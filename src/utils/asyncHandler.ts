import { handleError } from "@/utils/handleError";
import { NextRequest } from "next/server";
import { redis, isRedisEnabled } from "./redis";
import { ApiError } from "./apiError";
import { MiddlewareFn } from "./middlewares";

type RouteContext<T = Record<string, never>> = {
  params: Promise<T>;
};

type AsyncHandlerOptions = {
  /**
   * @deprecated use middelwares:[MiddelwareFN]
   */
  rateLimiter?: {
    maxReq: number;
    timeout: number;
  };
  middlewares?: MiddlewareFn[];
};
export function asyncHandler<T = Record<string, never>>(
  handler: (req: NextRequest, context: RouteContext<T>) => Promise<Response>,
  options?: AsyncHandlerOptions,
) {
  return async function (req: NextRequest, context: RouteContext<T>) {
    try {
      if (options?.rateLimiter && isRedisEnabled && redis) {
        const ip =
          req.headers.get("x-forwarded-for")?.split(",")[0] ||
          req.headers.get("x-real-ip") ||
          req.headers.get("x-vercel-ip") ||
          "unknown";
        // console.log("options", options, "IP:", ip);
        const rateLimiterKey = `rate_limit:${ip}`;
        const limit = options.rateLimiter.maxReq || 5;
        const window = options.rateLimiter.timeout;
        const current = await redis.incr(rateLimiterKey);
        if (current === 1) {
          redis.expire(rateLimiterKey, window);
        }
        if (current > limit) {
          throw new ApiError("Too many requests, try later", 429);
        }
      }
      if (options?.middlewares) {
        for (const middleware of options?.middlewares) {
          await middleware(req);
        }
      }
      return await handler(req, context);
    } catch (error) {
      return handleError(error);
    }
  };
}
