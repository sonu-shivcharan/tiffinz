import {
  resetPassword,
  verifyPasswordResetToken,
} from "@/helpers/server/user.auth";
import { ApiError } from "@/utils/apiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

const resetPasswordRoute = asyncHandler(
  async (req) => {
    const { token, newPassword, userId } = await req.json();
    if (!token) {
      throw new ApiError("Token is required", 400);
    }
    if (!newPassword || newPassword.trim() === "") {
      throw new ApiError("New password is required", 400);
    }

    const isTokenValid = await verifyPasswordResetToken(token, userId);
    if (!isTokenValid) {
      throw new ApiError("Password reset token expired", 400);
    }
    const { success } = await resetPassword(userId, newPassword);
    if (!success) {
      throw new ApiError("Failed to reset password try again later", 500);
    }

    return ApiResponse.success("Password reset successfully");
  },
  {
    rateLimiter: {
      maxReq: 5,
      timeout: 60,
    },
  },
);

export const POST = resetPasswordRoute;
