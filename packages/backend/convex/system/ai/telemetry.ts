type AiUsageEvent = {
  scope: string;
  model: string;
  provider: string;
  threadId?: string;
  organizationId?: string;
  usage: unknown;
};

export function logAiUsage(event: AiUsageEvent): void {
  console.info("[ai-usage]", JSON.stringify(event));
}
