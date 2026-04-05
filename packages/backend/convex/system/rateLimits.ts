import { ConvexError, v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { RATE_LIMIT_WINDOWS, RATE_LIMIT_MAX } from "../lib/rateLimit";

type RateLimitKey = keyof typeof RATE_LIMIT_WINDOWS;

/**
 * Internal mutation to check and enforce rate limiting.
 * This is called from actions since actions cannot write directly to the database.
 */
export const checkRateLimitInternal = internalMutation({
  args: {
    key: v.string(),
    limitKey: v.union(
      v.literal("messages"),
      v.literal("sessions"),
      v.literal("conversations")
    ),
  },
  handler: async (ctx, args) => {
    const window = RATE_LIMIT_WINDOWS[args.limitKey];
    const max = RATE_LIMIT_MAX[args.limitKey];
    const now = Date.now();
    const windowStart = Math.floor(now / window) * window;

    // Get or create rate limit entry
    const existingEntry = await ctx.db
      .query("rateLimits")
      .withIndex("by_key_and_window", (q) =>
        q.eq("key", args.key).eq("windowStart", windowStart)
      )
      .unique();

    if (existingEntry) {
      if (existingEntry.count >= max) {
        const retryAfter = Math.ceil((windowStart + window - now) / 1000);
        throw new ConvexError({
          code: "RATE_LIMIT_EXCEEDED",
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        });
      }
      // Increment counter
      await ctx.db.patch(existingEntry._id, {
        count: existingEntry.count + 1,
      });
    } else {
      // Create new entry
      await ctx.db.insert("rateLimits", {
        key: args.key,
        windowStart,
        count: 1,
      });
    }
  },
});
