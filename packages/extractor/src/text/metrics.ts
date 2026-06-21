/** Reading metrics (decision OQ-R4). Handles mixed CJK + Latin text. */

const LATIN_WORD = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;
// CJK ideographs + Japanese kana + Korean hangul syllables.
const CJK_CHAR = /[一-鿿぀-ヿ가-힯]/g;

/** Count words: Latin tokens plus individual CJK characters. */
export function countWords(text: string): number {
  const latin = text.match(LATIN_WORD)?.length ?? 0;
  const cjk = text.match(CJK_CHAR)?.length ?? 0;
  return latin + cjk;
}

/** Estimated reading time in minutes (~200 words/min), at least 1 for any content. */
export function readingTimeMinutes(words: number): number {
  return words > 0 ? Math.max(1, Math.ceil(words / 200)) : 0;
}
