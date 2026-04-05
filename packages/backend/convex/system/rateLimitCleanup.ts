import { internalMutation } from "../_generated/server";

// Clean up rate limit entries older than 24 hours
const CLEANUP_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Scheduled cleanup of expired rate limit entries.
 * Should be run periodically (e.g., via Convex scheduler every hour).
 */
export const cleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - CLEANUP_WINDOW_MS;
    
    // Query all rate limit entries and filter expired ones
    // Note: In production with many entries, consider adding a separate index on windowStart
    const allEntries = await ctx.db
      .query("rateLimits")
      .collect();

    const expiredEntries = allEntries.filter(entry => entry.windowStart < cutoffTime);

    // Delete expired entries (batch in chunks to avoid timeouts)
    const BATCH_SIZE = 100;
    for (let i = 0; i < expiredEntries.length; i += BATCH_SIZE) {
      const batch = expiredEntries.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((entry) => ctx.db.delete(entry._id))
      );
    }

    return {
      deletedCount: expiredEntries.length,
    };
  },
});
