import { IUser } from "@/models/user.model";
import { ApiResponse } from "@/utils/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/utils/withAuth";
import { ApiError } from "@/utils/apiError";
import { updateUserAvatar } from "@/helpers/server/user.auth";

type RouteContext<T = Record<string, never>> = {
  params: Promise<T>;
};
async function getCurrentUser(
  _req: NextRequest,
  _context: RouteContext,
  user: IUser | undefined,
): Promise<NextResponse> {
  return ApiResponse.success("Fetched user successfully", { user });
}

export const GET = withAuth(getCurrentUser);

const updateUserAvatarRoute = withAuth(async (req, _, user) => {
  const data = await req.json();
  if (!data.newAvatarUrl) {
    throw new ApiError("Avatar url is required");
  }
  const res = await updateUserAvatar(String(user?._id), data.newAvatarUrl);
  return ApiResponse.success(res, "User avatar updated successfully");
});

export { updateUserAvatarRoute as PATCH };
