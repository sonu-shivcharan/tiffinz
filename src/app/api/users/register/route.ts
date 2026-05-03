import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { userSchema } from "@/zod/user.schema";
import { registerUser } from "@/helpers/server/user.auth";
import { UserRole } from "@/constants/enum";
import { IUser } from "@/models/user.model";

export const POST = asyncHandler(
  async (req) => {
    const body = await req.json();
    // console.log('body', body)
    const parseResult = userSchema.safeParse(body);
    if (!parseResult.success) {
      return ApiResponse.zodError(parseResult.error);
    }

    const userData = parseResult.data;

    if (
      userData.role === UserRole.admin &&
      userData.adminSecret !== process.env.ADMIN_SECRET
    ) {
      console.info(
        `Invalid Secret, registering user with default privileges. FullName: ${userData.fullName}`,
      );
      userData.role = UserRole.user;
    }
    console.log("userData", userData);
    const createdUser = await registerUser(userData as IUser);
    const userType = userData.role === UserRole.admin ? "Admin" : "User";
    return ApiResponse.success(
      `${userType} registered successfully`,
      { user: createdUser },
      201,
    );
  },
  {
    rateLimiter: {
      maxReq: 5,
      timeout: 60,
    },
  },
);
