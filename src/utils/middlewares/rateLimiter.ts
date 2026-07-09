import { NextRequest } from "next/server";
import { ApiError } from "../apiError";
import { isRedisEnabled, redis } from "../redis";

type RateLimiterOptions = {
  maxReq: number;
  window: number;
};
export function publicRateLimiter({
  maxReq = 5,
  window = 60,
}: RateLimiterOptions) {
  return async function (req: NextRequest) {
    if (isRedisEnabled && redis) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0] ||
        req.headers.get("x-real-ip") ||
        req.headers.get("x-vercel-ip") ||
        "unknown";
      // console.log("options", options, "IP:", ip);
      const rateLimiterKey = `rate_limit:${ip}`;
      const limit = maxReq || 5;
      const current = await redis.incr(rateLimiterKey);
      if (current === 1) {
        redis.expire(rateLimiterKey, window);
      }
      if (current > limit) {
        throw new ApiError("Too many requests, try later", 429);
      }
    }
  };
}
