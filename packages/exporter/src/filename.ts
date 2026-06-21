/** Characters illegal in Windows/macOS/Linux filenames, plus control chars. */
// eslint-disable-next-line no-control-regex -- strip control chars from filenames
const ILLEGAL = /[\\/:*?"<>|\u0000-\u001f]/g;
/** Windows reserved device names (case-insensitive), which must not be used as a base name. */
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
/** Keep the base name comfortably under common 255-byte filename limits (room for ext/suffix). */
const MAX_BASE_BYTES = 100;

const encoder = new TextEncoder();

/** Truncate to at most `max` UTF-8 bytes without splitting a multibyte character. */
function truncateBytes(value: string, max: number): string {
  if (encoder.encode(value).length <= max) return value;
  let out = "";
  let bytes = 0;
  for (const ch of value) {
    const size = encoder.encode(ch).length;
    if (bytes + size > max) break;
    out += ch;
    bytes += size;
  }
  return out;
}

/**
 * Turn an arbitrary title into a safe export filename (PRD §5.1.7 #4): strip illegal/control
 * characters, collapse whitespace, drop leading/trailing dots & spaces, byte-truncate long
 * (e.g. Chinese) titles, and avoid Windows reserved names. Chinese and other Unicode letters
 * are preserved. Returns `<base><ext>`.
 */
export function safeFilename(title: string, ext = ".md"): string {
  let base = (title ?? "").replace(ILLEGAL, " ").replace(/\s+/g, " ").trim();
  base = base.replace(/^[.\s]+|[.\s]+$/g, "");
  base = truncateBytes(base, MAX_BASE_BYTES).replace(/[.\s]+$/g, "");
  if (!base) base = "untitled";
  else if (RESERVED.test(base)) base = `${base}_`;
  return `${base}${ext}`;
}

/**
 * Ensure a filename is unique within a batch by appending `-1`, `-2`, … before the extension.
 * Mutates `taken` to record the returned name (used by batch export, PRD §13.5).
 */
export function uniqueFilename(name: string, taken: Set<string>): string {
  if (!taken.has(name)) {
    taken.add(name);
    return name;
  }
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let i = 1;
  let candidate = `${base}-${i}${ext}`;
  while (taken.has(candidate)) {
    i += 1;
    candidate = `${base}-${i}${ext}`;
  }
  taken.add(candidate);
  return candidate;
}
