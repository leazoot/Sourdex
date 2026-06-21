/** Text chunking for embeddings (PRD §14.6). Splits long text into overlapping chunks. */

const LATIN_WORD = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;
// CJK ideographs + Japanese kana + Korean hangul syllables.
const CJK_CHAR = /[一-鿿぀-ヿ가-힯]/g;

/** A chunk produced by {@link chunkText}, before it is persisted (PRD §12.3). */
export interface TextChunk {
  chunkIndex: number;
  text: string;
  startOffset: number;
  endOffset: number;
  /** Estimated token count (PRD §14.6 chunk size is measured in tokens). */
  tokenCount: number;
}

export interface ChunkOptions {
  /** Target chunk size in tokens (PRD §14.6 rule 3: 500–900). */
  targetTokens?: number;
  /** Overlap between adjacent chunks in tokens (PRD §14.6 rule 4: 80–120). */
  overlapTokens?: number;
}

const DEFAULT_TARGET_TOKENS = 700;
const DEFAULT_OVERLAP_TOKENS = 100;

/**
 * Estimated token count: Latin words + individual CJK characters. A stable,
 * dependency-free proxy (mirrors extractor's countWords) that is close enough to keep
 * chunks within the PRD §14.6 size band without bundling a real tokenizer.
 */
export function estimateTokens(text: string): number {
  const latin = text.match(LATIN_WORD)?.length ?? 0;
  const cjk = text.match(CJK_CHAR)?.length ?? 0;
  return latin + cjk;
}

/**
 * Split text into overlapping chunks sized for embedding (PRD §14.6). Splits on
 * paragraph boundaries first, packing paragraphs up to the token target; paragraphs
 * larger than the target are hard-split by sentence/whitespace. Each chunk overlaps the
 * previous one by ~`overlapTokens` to preserve context across boundaries. Offsets are
 * character offsets into the original text so citations stay traceable (PRD §5.2.3.5).
 */
export function chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
  const target = Math.max(1, options.targetTokens ?? DEFAULT_TARGET_TOKENS);
  const overlap = Math.max(
    0,
    Math.min(options.overlapTokens ?? DEFAULT_OVERLAP_TOKENS, target - 1),
  );

  const trimmed = text.trim();
  if (!trimmed) return [];

  const units = splitUnits(text, target);
  if (units.length === 0) return [];

  const chunks: TextChunk[] = [];
  let current: typeof units = [];
  let currentTokens = 0;

  const flush = (): void => {
    const first = current[0];
    const last = current[current.length - 1];
    if (!first || !last) return;
    const start = first.start;
    const end = last.end;
    const chunkStr = text.slice(start, end).trim();
    if (chunkStr) {
      chunks.push({
        chunkIndex: chunks.length,
        text: chunkStr,
        startOffset: start,
        endOffset: end,
        tokenCount: estimateTokens(chunkStr),
      });
    }
  };

  for (const unit of units) {
    if (currentTokens > 0 && currentTokens + unit.tokens > target) {
      flush();
      // Carry over trailing units as overlap for the next chunk.
      const carried: typeof units = [];
      let carriedTokens = 0;
      for (let i = current.length - 1; i >= 0 && carriedTokens < overlap; i--) {
        const u = current[i];
        if (!u) continue;
        carried.unshift(u);
        carriedTokens += u.tokens;
      }
      current = carried;
      currentTokens = carriedTokens;
    }
    current.push(unit);
    currentTokens += unit.tokens;
  }
  flush();

  return chunks;
}

interface Unit {
  start: number;
  end: number;
  tokens: number;
}

/** Break text into paragraph units, hard-splitting any unit larger than `target`. */
function splitUnits(text: string, target: number): Unit[] {
  const units: Unit[] = [];
  const paragraphRe = /[^\n]+(?:\n(?!\n)[^\n]*)*/g;
  let match: RegExpExecArray | null;
  while ((match = paragraphRe.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    const tokens = estimateTokens(match[0]);
    if (tokens <= target) {
      units.push({ start, end, tokens });
    } else {
      units.push(...hardSplit(text, start, end, target));
    }
  }
  return units;
}

/** Hard-split an oversized span on sentence/whitespace boundaries near the token target. */
function hardSplit(text: string, start: number, end: number, target: number): Unit[] {
  const units: Unit[] = [];
  const span = text.slice(start, end);
  const boundaryRe = /\S+\s*/g;
  let segStart = 0;
  let cursor = 0;
  let tokens = 0;
  let match: RegExpExecArray | null;
  while ((match = boundaryRe.exec(span)) !== null) {
    cursor = match.index + match[0].length;
    tokens += estimateTokens(match[0]);
    if (tokens >= target) {
      units.push({ start: start + segStart, end: start + cursor, tokens });
      segStart = cursor;
      tokens = 0;
    }
  }
  if (segStart < span.length) {
    units.push({ start: start + segStart, end, tokens: estimateTokens(span.slice(segStart)) });
  }
  return units;
}
