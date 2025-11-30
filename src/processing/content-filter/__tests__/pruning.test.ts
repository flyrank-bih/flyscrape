import { describe, expect, it } from "vitest";
import { pruneContent } from "../pruning";

describe("pruneContent", () => {
  const chunks = [
    "Apple banana cherry",
    "Apple banana",
    "Cherry date",
    "Elderberry fig",
  ];

  it("should return empty array for empty chunks", () => {
    const result = pruneContent([], { query: "apple" });
    expect(result).toEqual([]);
  });

  it("should return empty array for empty query", () => {
    const result = pruneContent(chunks, { query: "" });
    expect(result).toEqual([]);
  });

  it("should score and sort chunks", () => {
    const result = pruneContent(chunks, { query: "apple" });

    expect(result.length).toBe(4);
    // 'Apple banana' (shorter) should score higher than 'Apple banana cherry'
    expect(result[0].content).toBe("Apple banana");
    expect(result[1].content).toBe("Apple banana cherry");
    expect(result[2].score).toBe(0);
    expect(result[3].score).toBe(0);
  });

  it("should filter by threshold", () => {
    // First get scores to know what to set threshold to
    const all = pruneContent(chunks, { query: "apple" });
    const topScore = all[0].score;

    const _result = pruneContent(chunks, {
      query: "apple",
      threshold: topScore - 0.0001, // Should keep top score
    });

    // Depending on exact values, we expect at least the top one.
    // Since the second one also has 'apple', it might pass or fail depending on threshold.
    // Let's set a threshold that definitely excludes 0 scores.

    const resultPositive = pruneContent(chunks, {
      query: "apple",
      threshold: 0.0001,
    });

    expect(resultPositive.length).toBe(2); // Only chunks with 'apple'
    expect(resultPositive.map((c) => c.content)).toContain("Apple banana");
    expect(resultPositive.map((c) => c.content)).toContain(
      "Apple banana cherry"
    );
  });

  it("should limit by topK", () => {
    const result = pruneContent(chunks, {
      query: "apple",
      topK: 1,
    });

    expect(result.length).toBe(1);
    expect(result[0].content).toBe("Apple banana");
  });

  it("should handle combined options", () => {
    const result = pruneContent(chunks, {
      query: "apple",
      threshold: 0.0001,
      topK: 1,
    });

    expect(result.length).toBe(1);
    expect(result[0].content).toBe("Apple banana");
  });
});
