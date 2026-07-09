import { IUser } from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export type MiddlewareFn = (
  req: NextRequest,
  user?: IUser,
) =>
  | NextResponse
  | undefined
  | Promise<NextResponse | undefined | unknown>
  | unknown;
