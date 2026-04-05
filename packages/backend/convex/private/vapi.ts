import { ConvexError, v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { getSecretValue, parseSecretString } from "../lib/secrets";
import { VapiClient } from "@vapi-ai/server-sdk";
import { ActionCtx } from "../_generated/server";

// Simplified types for frontend compatibility
export interface VapiAssistant {
  id: string;
  name?: string;
  firstMessage?: string;
  model?: {
    model?: string;
  };
}

export interface VapiPhoneNumber {
  id: string;
  number?: string;
  name?: string;
  status?: "active" | "inactive";
}

/**
 * Shared helper to get Vapi client for an organization.
 * Handles auth check, plugin lookup, secret fetching, and validation.
 */
async function getVapiClient(ctx: ActionCtx, orgId: string) {
  if (!orgId) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "Organization not found",
    });
  }

  const plugin = await ctx.runQuery(
    internal.system.plugins.getByOrganizationIdAndService,
    {
      organizationId: orgId,
      service: "vapi",
    },
  );

  if (!plugin) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Plugin not found",
    });
  }

  const secretName = plugin.secretName;
  const secret = await getSecretValue(secretName);
  const secretData = parseSecretString<{
    privateApiKey: string;
    publicApiKey: string;
  }>(secret);

  if (!secretData) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Credentials not found",
    });
  }

  if (!secretData.privateApiKey || !secretData.publicApiKey) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Credentials incomplete. Please reconnect your Vapi account.",
    });
  }

  return {
    client: new VapiClient({ token: secretData.privateApiKey }),
    publicApiKey: secretData.publicApiKey,
  };
}

export const getAssistants = action({
  args: {},
  handler: async (ctx): Promise<VapiAssistant[]> => {
    const identity = await ctx.auth.getUserIdentity();
            
    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      });
    }

    const orgId = identity.orgId as string;
    const { client } = await getVapiClient(ctx, orgId);
    const assistants = await client.assistants.list();
    return assistants as VapiAssistant[];
  },
});

export const getPhoneNumbers = action({
  args: {},
  handler: async (ctx): Promise<VapiPhoneNumber[]> => {
    const identity = await ctx.auth.getUserIdentity();
            
    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      });
    }

    const orgId = identity.orgId as string;
    const { client } = await getVapiClient(ctx, orgId);
    const phoneNumbers = await client.phoneNumbers.list();
    return phoneNumbers as VapiPhoneNumber[];
  },
});
