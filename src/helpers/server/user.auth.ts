import { DEFAULT_AVATAR_URI } from "@/constants/constants";
import { UserRole } from "@/constants/enum";
import Session from "@/models/session.model";
import User, { IUser } from "@/models/user.model";
import { ApiError } from "@/utils/apiError";
import { ApiResponse } from "@/utils/ApiResponse";
import connectDB from "@/utils/dbConnect";
import generateRefreshAndAccessToken from "@/utils/generateTokens";
import { verifyJWT } from "@/utils/verifyJWT";

import {
  ILoginCredentials,
  loginWithEmailSchema,
  loginWithPhoneSchema,
  loginWithUsernameSchema,
} from "@/zod/user.login.schema";
import { CreateUserByAdminInput } from "@/zod/user.schema";
import { cookies } from "next/headers";

async function doesUserAlreadyExist(userData: IUser | CreateUserByAdminInput) {
  // Check if user exists
  const orConditions: Array<Record<string, string>> = [
    { phone: userData.phone },
    { username: userData.username },
  ];
  console.log("userData.email", userData.email);
  if (userData.email) {
    orConditions.push({ email: userData.email });
  }
  await connectDB();
  const existingUser = await User.findOne({ $or: orConditions });
  if (existingUser) {
    const credential =
      existingUser?.email && existingUser.email === userData.email
        ? "Email"
        : "Phone/Username";
    return {
      error: `User with ${credential} already registered`,
      exists: true,
    };
  }

  return { error: null, exists: false };
}

export async function registerUser(userData: IUser) {
  // Check if user exists
  const { error, exists } = await doesUserAlreadyExist(userData);
  if (exists) {
    throw new ApiError(
      error || "User registered with same credentials already",
      409,
    );
  }
  const newUser: IUser = {
    username: userData.username,
    fullName: userData.fullName,
    phone: userData.phone,
    avatar: userData.avatar || DEFAULT_AVATAR_URI,
    password: userData.password,
    role: userData.role,
    isVerified: userData.role === UserRole.admin,
    ...(userData.email && { email: userData.email }),
  };
  await connectDB();
  const userDoc = await User.create(newUser);
  const createdUser = await User.findById(userDoc._id).select("-password");
  if (!createdUser) {
    throw new ApiError("Failed to register user", 500);
  }
  return createdUser;
}

type LoginOption = {
  key: keyof ILoginCredentials;
  schema:
    | typeof loginWithEmailSchema
    | typeof loginWithPhoneSchema
    | typeof loginWithUsernameSchema;
};

const loginOptions: LoginOption[] = [
  {
    key: "email",
    schema: loginWithEmailSchema,
  },
  {
    key: "username",
    schema: loginWithUsernameSchema,
  },
  {
    key: "phone",
    schema: loginWithPhoneSchema,
  },
];

async function loginUser(
  key: "email" | "username" | "phone",
  value: string,
  password: string,
) {
  const query: Record<string, string> = {};
  query[key] = value;
  await connectDB();
  const user = await User.findOne(query);
  if (!user) {
    console.log("query", query);
    throw new ApiError(`User with ${key} not found`, 404);
  }

  const isValidPassword = await user.isPasswordCorrect(password);
  if (!isValidPassword) {
    throw new ApiError("Invalid credentials", 401);
  }
  console.log("user", user);
  return { user };
}

const cookieFlags = {
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

async function createUserSession(userId: string) {
  const { accessToken, refreshToken } =
    await generateRefreshAndAccessToken(userId);

  if (!accessToken || !refreshToken) {
    throw new ApiError("Failed to generate tokens", 500);
  }

  const userSession = await Session.findOneAndUpdate(
    { user: userId },
    { refreshToken },
    { upsert: true, new: true },
  ).select("-password");

  if (!userSession) {
    throw new ApiError("Session creation failed", 500);
  }

  const user = await User.findById(userId).select("-password");

  // Set cookies
  const response = ApiResponse.success("User logged in successfully", {
    user,
  });
  response.cookies
    .set("accessToken", accessToken, { ...cookieFlags, maxAge: 60 * 15 })
    .set("refreshToken", refreshToken, {
      ...cookieFlags,
      maxAge: 60 * 60 * 24 * 7,
    });

  return response;
}

async function logoutUser() {
  const cookieStore = await cookies();
  const refreshTokenFromClient = cookieStore.get("refreshToken")
    ?.value as string;
  if (!refreshTokenFromClient) {
    console.log("refreshToken not found in cookies");
    return ApiResponse.success("User already logged out");
  }
  const { payload, error } = await verifyJWT(refreshTokenFromClient, "refresh");
  if (error || !payload?._id) {
    console.log("Invalid refresh token", error);
    cookieStore.delete("refreshToken");
    cookieStore.delete("accessToken");
    return;
  }
  await connectDB();
  const deletedSession = await Session.findOneAndDelete({
    user: payload._id,
    refreshToken: refreshTokenFromClient,
  }).lean();

  if (!deletedSession) {
    console.log("Session not found — probably already logged out");
    // Proceed anyway
  }

  cookieStore.delete("refreshToken");
  cookieStore.delete("accessToken");
  return;
}

async function refreshUserSession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken) {
    console.log("refreshToken not found in cookies");
    throw new ApiError("Session expired, login again", 400);
  }
  const { payload, error } = await verifyJWT(refreshToken, "refresh");
  if (error) {
    console.error("Error while verifying the refreshToken", error);
    throw new ApiError("Session expired, login again", 400);
  }
  const userId = payload?._id as string;

  if (!userId) {
    console.error("userId not found in the payload");
    throw new ApiError("Session expired");
  }
  await connectDB();
  const existingUserSession = await Session.findOne({
    user: userId,
    refreshToken,
  }).lean();

  if (!existingUserSession) {
    console.log(
      "No session found for the user with the provided refresh token",
    );
    throw new ApiError("Session expired, login again", 400);
  }
  const { accessToken, refreshToken: newRefreshToken } =
    await generateRefreshAndAccessToken(userId);

  if (!accessToken || !newRefreshToken) {
    throw new ApiError("Failed to generate tokens", 500);
  }
  const newUserSession = await Session.findOneAndUpdate(
    { user: userId, refreshToken },
    { refreshToken: newRefreshToken },
    { upsert: true, new: true },
  ).lean();
  console.log("userSession", newUserSession);
  if (!newUserSession) {
    throw new ApiError("Session creation failed", 500);
  }
  // response.cookies
  //   .set("accessToken", accessToken, { ...cookieFlags, maxAge: 60 * 15 })
  //   .set("refreshToken", newRefreshToken, {
  //     ...cookieFlags,
  //     maxAge: 60 * 60 * 24 * 7,
  //   });
  cookieStore.set("accessToken", accessToken, {
    ...cookieFlags,
    maxAge: 60 * 15,
  });
  cookieStore.set("refreshToken", newRefreshToken, {
    ...cookieFlags,
    maxAge: 60 * 60 * 24 * 7,
  });

  const user = await User.findById(userId).select("-password");
  return user;
}
export {
  logoutUser,
  createUserSession,
  loginOptions,
  loginUser,
  refreshUserSession,
  doesUserAlreadyExist,
};
