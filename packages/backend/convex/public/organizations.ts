import { createClerkClient } from "@clerk/backend";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { ConvexError } from "convex/values";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || "",
});

export const validate = action({
  args: {
    organizationId: v.string(),
  },
  handler: async (_, args) => {
    try {
      const organization = await clerkClient.organizations.getOrganization({
        organizationId: args.organizationId,
      });
      
      if (organization) {
        return { valid: true };
      }
    } catch (error) {
      // Clerk throws on not-found; catch and return graceful error
      return { 
        valid: false, 
        reason: "Organization not valid" 
      };
    }
    
    return { valid: false, reason: "Organization not valid" };
  },
});
