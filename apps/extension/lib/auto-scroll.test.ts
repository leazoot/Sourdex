import { describe, expect, it } from "vitest";
import { autoScroll, type ScrollEnv } from "./auto-scroll";

/** Fake environment: height follows a scripted sequence; time advances by stepDelay each wait. */
function makeEnv(heights: number[], stepDelay = 250): { env: ScrollEnv; scrolls: () => number } {
  let i = 0;
  let t = 0;
  let scrolls = 0;
  const env: ScrollEnv = {
    scrollHeight: () => heights[Math.min(i, heights.length - 1)] ?? 0,
    scrollToBottom: () => {
      scrolls++;
    },
    wait: async (ms) => {
      t += ms;
      i++;
    },
    now: () => t,
  };
  void stepDelay;
  return { env, scrolls: () => scrolls };
}

describe("autoScroll", () => {
  it("stops quickly on a static page (no growth)", async () => {
    const { env } = makeEnv([1000, 1000, 1000, 1000, 1000]);
    const steps = await autoScroll(env, { stableThreshold: 2, stepDelayMs: 250 });
    expect(steps).toBe(2); // two consecutive no-growth checks → stop
  });

  it("keeps scrolling while the page grows, then stops when stable", async () => {
    // grows for 3 steps, then flat
    const { env } = makeEnv([1000, 2000, 3000, 4000, 4000, 4000]);
    const steps = await autoScroll(env, { stableThreshold: 2, maxScrolls: 30 });
    expect(steps).toBe(5); // 3 growth steps + 2 stable steps
  });

  it("respects the max scroll cap when the page always grows", async () => {
    const ever = Array.from({ length: 100 }, (_, n) => (n + 1) * 1000);
    const { env, scrolls } = makeEnv(ever);
    const steps = await autoScroll(env, { maxScrolls: 5, stableThreshold: 3 });
    expect(steps).toBe(5);
    expect(scrolls()).toBe(5);
  });

  it("respects the time budget", async () => {
    const ever = Array.from({ length: 100 }, (_, n) => (n + 1) * 1000);
    const { env } = makeEnv(ever);
    const steps = await autoScroll(env, {
      maxScrolls: 100,
      stableThreshold: 50,
      stepDelayMs: 250,
      maxDurationMs: 1000,
    });
    expect(steps).toBe(4); // 4 × 250ms reaches the 1000ms budget
  });
});
