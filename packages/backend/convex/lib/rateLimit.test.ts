import { describe, it, expect } from "vitest";
import { RATE_LIMIT_WINDOWS, RATE_LIMIT_MAX } from "./rateLimit";

describe("RATE_LIMIT_WINDOWS", () => {
  it("messages window is 1 minute", () => {
    expect(RATE_LIMIT_WINDOWS.messages).toBe(60 * 1000);
  });

  it("sessions window is 5 minutes", () => {
    expect(RATE_LIMIT_WINDOWS.sessions).toBe(5 * 60 * 1000);
  });

  it("conversations window is 1 minute", () => {
    expect(RATE_LIMIT_WINDOWS.conversations).toBe(60 * 1000);
  });
});

describe("RATE_LIMIT_MAX", () => {
  it("allows 30 messages per minute", () => {
    expect(RATE_LIMIT_MAX.messages).toBe(30);
  });

  it("allows 5 sessions per 5 minutes", () => {
    expect(RATE_LIMIT_MAX.sessions).toBe(5);
  });

  it("allows 10 conversations per minute", () => {
    expect(RATE_LIMIT_MAX.conversations).toBe(10);
  });
});

describe("window bucketing math", () => {
  it("computes consistent windowStart within the same minute", () => {
    const window = RATE_LIMIT_WINDOWS.messages; // 60_000 ms
    // Pick a known windowStart and two timestamps inside it
    const windowStart = 1_700_000_040_000; // aligned to 60s boundary
    const t1 = windowStart + 1_000;        // 1s into window
    const t2 = windowStart + 59_000;       // 59s into window
    const w1 = Math.floor(t1 / window) * window;
    const w2 = Math.floor(t2 / window) * window;
    expect(w1).toBe(windowStart);
    expect(w2).toBe(windowStart);
    expect(w1).toBe(w2);
  });

  it("produces different windowStart across minute boundaries", () => {
    const window = RATE_LIMIT_WINDOWS.messages; // 60_000 ms
    const windowStart = 1_700_000_040_000;
    const t1 = windowStart + 59_000;       // last second of window
    const t2 = windowStart + 60_000;       // first ms of next window
    const w1 = Math.floor(t1 / window) * window;
    const w2 = Math.floor(t2 / window) * window;
    expect(w1).toBe(windowStart);
    expect(w2).toBe(windowStart + window);
    expect(w1).not.toBe(w2);
  });

  it("retryAfter is positive when rate limit exceeded", () => {
    const window = RATE_LIMIT_WINDOWS.messages;
    const now = Date.now();
    const windowStart = Math.floor(now / window) * window;
    const retryAfter = Math.ceil((windowStart + window - now) / 1000);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });
});
