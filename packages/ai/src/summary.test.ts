import { describe, expect, it } from "vitest";
import { AIProviderError } from "@sourdex/core";
import { buildSummaryMessages, parseSummaryOutput } from "./summary.js";

describe("buildSummaryMessages", () => {
  it("includes a JSON-only system instruction and the title + content", () => {
    const messages = buildSummaryMessages({ title: "My Title", text: "Body text", lang: "en" });
    expect(messages[0]?.role).toBe("system");
    expect(messages[0]?.content).toMatch(/only a single json object/i);
    expect(messages[1]?.content).toContain("My Title");
    expect(messages[1]?.content).toContain("Body text");
    expect(messages[1]?.content).toContain("en");
  });
});

describe("parseSummaryOutput", () => {
  it("parses a clean snake_case JSON object", () => {
    const out = parseSummaryOutput(
      JSON.stringify({
        one_sentence: "It's about X.",
        summary: "A longer summary.",
        key_points: ["a", "b"],
        useful_for: ["research"],
        risk_notes: [],
        suggested_tags: ["sqlite", "search"],
      }),
    );
    expect(out).toEqual({
      oneSentence: "It's about X.",
      summary: "A longer summary.",
      keyPoints: ["a", "b"],
      usefulFor: ["research"],
      riskNotes: [],
      suggestedTags: ["sqlite", "search"],
    });
  });

  it("strips ```json fences and accepts camelCase keys", () => {
    const out = parseSummaryOutput('```json\n{"oneSentence":"hi","keyPoints":["p"]}\n```');
    expect(out.oneSentence).toBe("hi");
    expect(out.keyPoints).toEqual(["p"]);
  });

  it("recovers a JSON object embedded in stray prose", () => {
    const out = parseSummaryOutput('Sure! {"summary":"ok"} hope that helps');
    expect(out.summary).toBe("ok");
  });

  it("fills missing fields with empty defaults and drops non-string array items", () => {
    const out = parseSummaryOutput('{"summary":"only summary","key_points":["a",2,""]}');
    expect(out.summary).toBe("only summary");
    expect(out.oneSentence).toBe("");
    expect(out.keyPoints).toEqual(["a"]);
    expect(out.suggestedTags).toEqual([]);
  });

  it("throws AIProviderError on non-JSON and on non-object JSON", () => {
    expect(() => parseSummaryOutput("not json at all")).toThrow(AIProviderError);
    expect(() => parseSummaryOutput("[1,2,3]")).toThrow(AIProviderError);
  });
});
