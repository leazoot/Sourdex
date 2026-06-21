/** Shared text utilities. Pure, dependency-free (PRD §9.2). */

/**
 * Highlight markers wrapped around matched terms in search snippets (PRD §15.4). Private-use
 * code points so they never collide with document text; the web UI maps them to `<mark>`.
 * Defined here as a shared constant because both the FTS index layer (snippet generation)
 * and the search query layer (snippet cleanup) depend on them.
 */
export const HIGHLIGHT_OPEN = "\uE000";
export const HIGHLIGHT_CLOSE = "\uE001";

/**
 * Character class matching CJK ideographs and Japanese/Korean syllabaries:
 * CJK Ext-A, Unified Ideographs, Compatibility Ideographs, Hiragana/Katakana, Hangul.
 */
export const CJK_CHAR_CLASS =
  "\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\u3040-\\u30ff\\uac00-\\ud7af";

const CJK_CHAR = new RegExp(`[${CJK_CHAR_CLASS}]`);

/**
 * Insert spaces around every CJK character so the FTS5 `unicode61` tokenizer indexes
 * each ideograph/kana/syllable as its own token (decision OQ-A7). Without this, a run of
 * CJK characters with no whitespace becomes a single token and substring search fails for
 * common 2+ character Chinese words. Latin text is left untouched (its own tokenization is
 * already word-based). The same segmentation is applied to indexed text and to query terms
 * so a query like `机器` becomes the phrase `机 器`, matching `机器学习` etc.
 */
export function segmentCjk(text: string): string {
  let out = "";
  for (const ch of text) {
    out += CJK_CHAR.test(ch) ? ` ${ch} ` : ch;
  }
  return out.replace(/\s+/g, " ").trim();
}
