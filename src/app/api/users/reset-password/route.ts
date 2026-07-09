import {
  resetPassword,
  verifyPasswordResetToken,
} from "@/helpers/server/user.auth";
import { ApiError } from "@/utils/apiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { publicRateLimiter } from "@/utils/middlewares/rateLimiter";

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
    middlewares: [publicRateLimiter({ maxReq: 5, window: 60 * 5 })],
  },
);

export const POST = resetPasswordRoute;
