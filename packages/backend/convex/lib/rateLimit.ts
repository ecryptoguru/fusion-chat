import { ConvexError } from "convex/values";
import { MutationCtx } from "../_generated/server";

// Rate limit windows in milliseconds
export const RATE_LIMIT_WINDOWS = {
  // 1 minute window for high-frequency actions (messages)
  messages: 60 * 1000,
  // 5 minute window for session creation
  sessions: 5 * 60 * 1000,
  // 1 minute window for conversations
  conversations: 60 * 1000,
} as const;

// Max requests per window
export const RATE_LIMIT_MAX = {
  messages: 30, // 30 messages per minute
  sessions: 5, // 5 sessions per 5 minutes
  conversations: 10, // 10 conversations per minute
} as const;

type RateLimitKey = keyof typeof RATE_LIMIT_WINDOWS;

/**
 * Check and enforce rate limiting for a given key
 * @param ctx - Convex mutation context
 * @param key - Unique identifier for rate limiting (e.g., contactSessionId, organizationId)
 * @param limitKey - The type of rate limit to apply
 * @throws ConvexError if rate limit is exceeded
 */
export async function checkRateLimit(
  ctx: MutationCtx,
  key: string,
  limitKey: RateLimitKey,
): Promise<void> {
  const window = RATE_LIMIT_WINDOWS[limitKey];
  const max = RATE_LIMIT_MAX[limitKey];
  const now = Date.now();
  const windowStart = Math.floor(now / window) * window;

  // Get or create rate limit entry
  const existingEntry = await ctx.db
    .query("rateLimits")
    .withIndex("by_key_and_window", (q) =>
      q.eq("key", key).eq("windowStart", windowStart)
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
      key,
      windowStart,
      count: 1,
    });
  }
}

/**
 * Check if organization has an active subscription
 * @param ctx - Convex mutation context
 * @param organizationId - Organization to check
 * @throws ConvexError if no active subscription found
 */
export async function requireActiveSubscription(
  ctx: MutationCtx,
  organizationId: string,
): Promise<void> {
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_organization_id", (q) =>
      q.eq("organizationId", organizationId)
    )
    .unique();

  if (!subscription) {
    throw new ConvexError({
      code: "SUBSCRIPTION_REQUIRED",
      message: "No subscription found for this organization",
    });
  }

  if (subscription.status !== "active") {
    throw new ConvexError({
      code: "SUBSCRIPTION_INACTIVE",
      message: `Subscription is ${subscription.status}`,
    });
  }
}
