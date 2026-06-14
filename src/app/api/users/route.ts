import { IUser } from "@/models/user.model";
import { ApiResponse } from "@/utils/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/utils/withAuth";
import { ApiError } from "@/utils/apiError";
import { updateUserDetails, updateUserAvatar } from "@/helpers/server/user.auth";
import { updateUserSchema } from "@/zod/user.schema";

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

const updateUserRoute = withAuth(async (req, _, user) => {
  const data = await req.json();
  const parseResult = updateUserSchema.safeParse(data);
  if (!parseResult.success) {
    return ApiResponse.zodError(parseResult.error);
  }
  const res = await updateUserDetails(String(user?._id), parseResult.data);
  return ApiResponse.success(res, "User profile updated successfully");
});

export { updateUserAvatarRoute as PATCH, updateUserRoute as PUT };
