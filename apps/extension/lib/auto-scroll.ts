/**
 * Bounded auto-scroll used before capturing a page, so lazily / virtually rendered content
 * (forums, infinite feeds) is in the DOM when we read `outerHTML`. The loop scrolls to the
 * bottom until the page stops growing, then stops — so a static page exits after a couple of
 * no-growth checks (~half a second) while a dynamic page keeps loading until a cap is hit.
 *
 * The decision logic lives here (dependency-injected) so it is unit-testable; the extension's
 * injected capture script mirrors this exact algorithm inline (it cannot import modules).
 */

export interface AutoScrollOptions {
  /** Hard cap on scroll steps. */
  maxScrolls?: number;
  /** Stop after this many consecutive checks where the page did not grow. */
  stableThreshold?: number;
  /** Delay between scroll steps (lets lazy content load). */
  stepDelayMs?: number;
  /** Overall time budget. */
  maxDurationMs?: number;
}

export const DEFAULT_AUTO_SCROLL: Required<AutoScrollOptions> = {
  maxScrolls: 30,
  stableThreshold: 2,
  stepDelayMs: 250,
  maxDurationMs: 6000,
};

export interface ScrollEnv {
  /** Current full scroll height of the page. */
  scrollHeight(): number;
  /** Scroll the viewport to the bottom (triggers lazy loaders). */
  scrollToBottom(): void;
  /** Resolve after `ms`. */
  wait(ms: number): Promise<void>;
  /** Monotonic timestamp in ms. */
  now(): number;
}

/**
 * Scroll to the bottom repeatedly until the page stops growing, bounded by step/time caps.
 * Returns the number of scroll steps performed.
 */
export async function autoScroll(env: ScrollEnv, options: AutoScrollOptions = {}): Promise<number> {
  const opts = { ...DEFAULT_AUTO_SCROLL, ...options };
  const start = env.now();
  let lastHeight = env.scrollHeight();
  let stable = 0;
  let steps = 0;

  while (
    steps < opts.maxScrolls &&
    stable < opts.stableThreshold &&
    env.now() - start < opts.maxDurationMs
  ) {
    env.scrollToBottom();
    await env.wait(opts.stepDelayMs);
    steps++;

    const height = env.scrollHeight();
    if (height <= lastHeight) {
      stable++;
    } else {
      stable = 0;
      lastHeight = height;
    }
  }

  return steps;
}
