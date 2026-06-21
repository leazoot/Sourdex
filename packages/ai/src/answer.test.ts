import { describe, expect, it } from "vitest";
import { AIProviderError } from "@sourdex/core";
import { buildAnswerMessages, parseAnswerOutput } from "./answer.js";

describe("buildAnswerMessages", () => {
  it("numbers the passages and embeds the question", () => {
    const msgs = buildAnswerMessages({
      question: "How do CRDTs merge?",
      contexts: [
        { n: 1, title: "CRDT basics", text: "CRDTs merge deterministically." },
        { n: 2, title: "Sync", text: "Replicas converge." },
      ],
    });
    expect(msgs[0].role).toBe("system");
    expect(msgs[0].content).toMatch(/only.*saved sources/i);
    expect(msgs[1].content).toContain("[1] CRDT basics");
    expect(msgs[1].content).toContain("[2] Sync");
    expect(msgs[1].content).toContain("How do CRDTs merge?");
  });

  it("signals when no sources are available", () => {
    const msgs = buildAnswerMessages({ question: "Q", contexts: [] });
    expect(msgs[1].content).toContain("(no sources available)");
  });
});

describe("parseAnswerOutput", () => {
  it("parses answer, citations and confidence", () => {
    const out = parseAnswerOutput(
      JSON.stringify({
        answer: "They merge via CRDTs [1].",
        citations: [{ n: 1, quote: "CRDTs merge deterministically." }],
        confidence: "high",
      }),
    );
    expect(out.answer).toContain("[1]");
    expect(out.citations).toEqual([{ n: 1, quote: "CRDTs merge deterministically." }]);
    expect(out.confidence).toBe("high");
  });

  it("tolerates code fences and recovers JSON from surrounding prose", () => {
    const out = parseAnswerOutput('```json\n{"answer":"a","citations":[],"confidence":"low"}\n```');
    expect(out.answer).toBe("a");
    expect(out.confidence).toBe("low");
  });

  it("drops malformed citations and defaults confidence to low", () => {
    const out = parseAnswerOutput(
      JSON.stringify({
        answer: "x",
        citations: [{ n: 0 }, { n: 2, quote: "ok" }, { quote: "no n" }, "junk"],
        confidence: "bogus",
      }),
    );
    expect(out.citations).toEqual([{ n: 2, quote: "ok" }]);
    expect(out.confidence).toBe("low");
  });

  it("throws AIProviderError on non-JSON / non-object output", () => {
    expect(() => parseAnswerOutput("not json")).toThrow(AIProviderError);
    expect(() => parseAnswerOutput("[1,2,3]")).toThrow(AIProviderError);
  });
});
