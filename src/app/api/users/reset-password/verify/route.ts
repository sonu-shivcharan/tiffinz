import { verifyPasswordResetToken } from "@/helpers/server/user.auth";
import { ApiError } from "@/utils/apiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

const verifyPasswordResetTokenRoute = asyncHandler(
  async (req) => {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");
    const userId = searchParams.get("id");
    if (!token || !userId) {
      throw new ApiError("Invalid password reset link");
    }

    const isTokenValid = await verifyPasswordResetToken(token, userId);
    if (!isTokenValid) {
      throw new ApiError("Invalid or expired password reset token", 400);
    }

    return ApiResponse.success("Password reset token is valid", { userId });
  },
  {
    rateLimiter: {
      maxReq: 10,
      timeout: 60,
    },
  },
);

export const GET = verifyPasswordResetTokenRoute;
