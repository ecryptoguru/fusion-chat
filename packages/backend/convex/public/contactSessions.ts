import { ConvexError, v } from "convex/values";
import { mutation } from "../_generated/server";
import { SESSION_DURATION_MS } from "../constants";
import { checkRateLimit } from "../lib/rateLimit";

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    organizationId: v.string(),

    metadata: v.optional(
      v.object({
        userAgent: v.optional(v.string()),
        language: v.optional(v.string()),
        languages: v.optional(v.string()),
        platform: v.optional(v.string()),
        vendor: v.optional(v.string()),
        screenResolution: v.optional(v.string()),
        viewportSize: v.optional(v.string()),
        timezone: v.optional(v.string()),
        timezoneOffset: v.optional(v.number()),
        cookieEnabled: v.optional(v.boolean()),
        referrer: v.optional(v.string()),
        currentUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.name.trim().length === 0 || args.name.length > 100) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Name must be between 1 and 100 characters" });
    }
    if (args.email.length > 254) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Email address too long" });
    }

    // Check rate limiting by organization to prevent abuse
    await checkRateLimit(ctx, args.organizationId, "sessions");

    const now = Date.now();
    const expiresAt = now + SESSION_DURATION_MS;

    const contactSessionId = await ctx.db.insert("contactSessions", {
      name: args.name,
      email: args.email,
      organizationId: args.organizationId,
      expiresAt,
      metadata: args.metadata,
    });

    return contactSessionId;
  },
});

export const validate = mutation({
  args: {
    contactSessionId: v.id("contactSessions"),
  },
  handler: async (ctx, args) => {
    const contactSession = await ctx.db.get(args.contactSessionId);

    if (!contactSession) {
      return { valid: false, reason: "Contact session not found" };
    }

    if (contactSession.expiresAt < Date.now()) {
      return { valid: false, reason: "Contact session expired" };
    }

    return { valid: true, contactSession };
  },
});
