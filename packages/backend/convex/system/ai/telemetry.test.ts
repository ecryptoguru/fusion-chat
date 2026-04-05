import { describe, it, expect, vi, beforeEach } from "vitest";
import { logAiUsage } from "./telemetry";

describe("logAiUsage", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it("logs to console.info with [ai-usage] prefix", () => {
    logAiUsage({
      scope: "support-agent",
      model: "gpt-5.4-nano",
      provider: "openai",
      threadId: "thread_123",
      organizationId: "org_abc",
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    });

    expect(infoSpy).toHaveBeenCalledOnce();
    const [prefix, payload] = infoSpy.mock.calls[0] as [string, string];
    expect(prefix).toBe("[ai-usage]");
    const parsed = JSON.parse(payload);
    expect(parsed.scope).toBe("support-agent");
    expect(parsed.model).toBe("gpt-5.4-nano");
    expect(parsed.provider).toBe("openai");
    expect(parsed.threadId).toBe("thread_123");
    expect(parsed.organizationId).toBe("org_abc");
  });

  it("works without optional threadId and organizationId", () => {
    logAiUsage({
      scope: "search-interpreter",
      model: "gpt-5.4-nano",
      provider: "openai",
      usage: { totalTokens: 5 },
    });

    expect(infoSpy).toHaveBeenCalledOnce();
    const payload = JSON.parse(infoSpy.mock.calls[0][1] as string);
    expect(payload.threadId).toBeUndefined();
    expect(payload.organizationId).toBeUndefined();
    expect(payload.scope).toBe("search-interpreter");
  });

  it("serializes arbitrary usage shapes", () => {
    const usage = { promptTokens: 1, completionTokens: 2, totalTokens: 3, extra: "field" };
    logAiUsage({ scope: "test", model: "m", provider: "p", usage });

    const payload = JSON.parse(infoSpy.mock.calls[0][1] as string);
    expect(payload.usage).toEqual(usage);
  });

  it("serializes null usage without throwing", () => {
    expect(() =>
      logAiUsage({ scope: "test", model: "m", provider: "p", usage: null })
    ).not.toThrow();
  });
});
