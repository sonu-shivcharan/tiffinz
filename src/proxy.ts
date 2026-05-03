import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "./utils/ApiResponse";
import { verifyJWT } from "./utils/verifyJWT";
// import { refreshUserSession } from "./helpers/server/user.auth";

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const token = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const response = NextResponse.next();

  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      if (refreshToken) {
        return NextResponse.redirect(
          new URL(
            `/refresh-session?redirect=${encodeURIComponent(pathname)}`,
            req.url,
          ),
        );
      }
      return NextResponse.redirect(
        new URL(`/login?redirect=${pathname.substring(1)}`, req.url),
      );
    }
  }

  if (
    pathname.startsWith("/api/users/register") ||
    pathname.startsWith("/api/user/logout") ||
    (pathname.startsWith("/api/users/login") && !token) ||
    (pathname.startsWith("/api/refresh-tokens") && refreshToken)
  ) {
    return response;
  }

  if (pathname.startsWith("/api")) {
    if (!token) {
      return ApiResponse.error("Authentication required", 401);
    }
    const { payload, error } = await verifyJWT(token);
    if (error || !payload?._id) {
      return ApiResponse.error("Authentication required", 401);
    }
    response.headers.set("x-user-id", String(payload?._id));
    response.headers.set("x-user-role", String(payload?.role));
    // console.log("payload", payload);
  }

  return response;
}

export const config = {
  matcher: ["/api/(.*)", "/dashboard", "/dashboard/:path", "/"],
};
