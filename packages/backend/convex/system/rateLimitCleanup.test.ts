import { describe, it, expect } from "vitest";

/**
 * Pure logic tests for the rate limit cleanup batch logic.
 * The Convex db interactions are tested via convex-test; here we verify
 * the windowing and cutoff math.
 */

const CLEANUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function computeCutoff(now: number): number {
  return now - CLEANUP_WINDOW_MS;
}

function isExpired(windowStart: number, cutoffTime: number): boolean {
  return windowStart < cutoffTime;
}

describe("rate limit cleanup - cutoff math", () => {
  it("cutoff is exactly 24 hours before now", () => {
    const now = 1_700_000_000_000;
    expect(computeCutoff(now)).toBe(now - CLEANUP_WINDOW_MS);
  });

  it("entry from 25 hours ago is expired", () => {
    const now = Date.now();
    const old = now - 25 * 60 * 60 * 1000;
    expect(isExpired(old, computeCutoff(now))).toBe(true);
  });

  it("entry from 23 hours ago is NOT expired", () => {
    const now = Date.now();
    const recent = now - 23 * 60 * 60 * 1000;
    expect(isExpired(recent, computeCutoff(now))).toBe(false);
  });

  it("entry exactly at cutoff boundary is NOT expired (strict less-than)", () => {
    const now = Date.now();
    const cutoff = computeCutoff(now);
    expect(isExpired(cutoff, cutoff)).toBe(false);
  });

  it("entry one ms before cutoff IS expired", () => {
    const now = Date.now();
    const cutoff = computeCutoff(now);
    expect(isExpired(cutoff - 1, cutoff)).toBe(true);
  });
});

describe("batch chunking logic", () => {
  const BATCH_SIZE = 100;

  function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  it("produces 1 chunk for 99 items", () => {
    const items = Array.from({ length: 99 }, (_, i) => i);
    expect(chunkArray(items, BATCH_SIZE)).toHaveLength(1);
  });

  it("produces 1 chunk for exactly 100 items", () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    expect(chunkArray(items, BATCH_SIZE)).toHaveLength(1);
  });

  it("produces 2 chunks for 101 items", () => {
    const items = Array.from({ length: 101 }, (_, i) => i);
    expect(chunkArray(items, BATCH_SIZE)).toHaveLength(2);
  });

  it("produces 0 chunks for empty array", () => {
    expect(chunkArray([], BATCH_SIZE)).toHaveLength(0);
  });

  it("last chunk has correct remainder items for 250 items", () => {
    const items = Array.from({ length: 250 }, (_, i) => i);
    const chunks = chunkArray(items, BATCH_SIZE);
    expect(chunks).toHaveLength(3);
    expect(chunks[2]).toHaveLength(50);
  });
});
