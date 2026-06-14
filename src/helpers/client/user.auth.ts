"use client";

import { handleError } from "@/lib/handleError";
import { IUser } from "@/models/user.model";
import { RegisterFormInput, UpdateUserProfile } from "@/zod/user.schema";
import axios from "axios";

export interface IAuthUser {
  user: IUser | null;
  error: {
    type: string;
    message: string;
  } | null;
}

async function registerUser(userData: RegisterFormInput): Promise<IAuthUser> {
  try {
    const response = await axios.post("/api/users/register", userData);
    const user = response.data;
    if (!user) {
      throw new Error("Failed to register user");
    }
    return { user, error: null };
  } catch (error) {
    return { error: handleError(error, "register"), user: null };
  }
}

async function loginUserWithPhone(credentials: {
  phone: string;
  password: string;
}): Promise<IAuthUser> {
  try {
    const response = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }
    const payload = await response.json();
    const data = payload.data;
    const user = data.user;
    return { user, error: null };
  } catch (error) {
    return { user: null, error: handleError(error, "login") };
  }
}
async function loginUserWithEmail(credentials: {
  email: string;
  password: string;
}): Promise<IAuthUser> {
  try {
    const response = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }
    const payload = await response.json();
    const data = payload.data;
    const user = data.user;
    return { user, error: null };
  } catch (error) {
    return { user: null, error: handleError(error, "login") };
  }
}

async function loginUserWithUsername(credentials: {
  username: string;
  password: string;
}): Promise<IAuthUser> {
  try {
    const response = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }
    const payload = await response.json();
    const data = payload.data;
    const user = data.user;
    return { user, error: null };
  } catch (error) {
    return { user: null, error: handleError(error, "login") };
  }
}

async function getCurrentUser(): Promise<IUser> {
  try {
    const response = await axios.get("/api/users");
    const user = response.data?.data?.user;

    if (!user) {
      throw new Error("Failed to fetch user");
    }

    return user;
  } catch (error) {
    const message = handleError(error, "get current user").message;
    throw new Error(message);
  } // Just return the user object, no error handling here
}

async function logoutUser(): Promise<boolean> {
  try {
    const response = await axios.get("/api/users/logout");
    if (response.status === 200) {
      return true;
    } else {
      throw new Error("Logout failed");
    }
  } catch (error) {
    throw new Error(handleError(error, "logout error").message);
  }
}

async function refreshUserSession(): Promise<IUser> {
  try {
    const resp = await axios.get("/api/refresh-tokens");
    console.log("resp", resp);
    const user: IUser = resp.data.data.user;
    if (!user) {
      throw new Error("Failed to refresh user session");
    }
    return user;
  } catch (error) {
    console.log("error while refreshing token", error);
    const message = handleError(error, "refresh user session").message;
    throw new Error(message);
  }
}

async function verifyPasswordResetToken(token: string, id: string) {
  try {
    const res = await axios("/api/users/reset-password/verify", {
      params: { token, id },
    });
    const data = res.data.data;
    return data.success as boolean;
  } catch (error) {
    console.log("error", error);
    return false;
  }
}

async function updateUserAvatar(avatarUrl: string) {
  try {
    const res = await axios.patch("/api/users", {
      newAvatarUrl: avatarUrl,
    });
    const data = res.data.data;
    return data.success;
  } catch (error) {
    console.log("error while updating user avatar", error);
    const message = handleError(error, "update avatar").message;
    throw new Error(message);
  }
}

async function updateUserProfile(profileData: UpdateUserProfile): Promise<IAuthUser> {
  try {
    const response = await axios.put("/api/users", profileData);
    const user = response.data?.data;
    if (!user) {
      throw new Error("Failed to update profile");
    }
    return { user, error: null };
  } catch (error) {
    return { error: handleError(error, "update profile"), user: null };
  }
}

export {
  registerUser,
  loginUserWithPhone,
  getCurrentUser,
  logoutUser,
  refreshUserSession,
  loginUserWithEmail,
  loginUserWithUsername,
  verifyPasswordResetToken,
  updateUserAvatar,
  updateUserProfile,
};
