/** Identifier helpers. IDs are prefixed for readability, e.g. `item_3f9a…`. */

/**
 * Create a prefixed, collision-resistant id using the Web Crypto UUID generator
 * (available in both Node 22 and browsers, keeping `@sourdex/core` runtime-agnostic).
 *
 * @example createId("item") // => "item_3f9a1c2b4d..."
 */
export function createId(prefix: string): string {
  const uuid = globalThis.crypto.randomUUID().replace(/-/g, "");
  return `${prefix}_${uuid}`;
}
