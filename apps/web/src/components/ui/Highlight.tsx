import { HIGHLIGHT_CLOSE, HIGHLIGHT_OPEN } from "@sourdex/core";
import { Fragment, type ReactNode } from "react";

const MARKED = new RegExp(`${HIGHLIGHT_OPEN}([^${HIGHLIGHT_CLOSE}]*)${HIGHLIGHT_CLOSE}`, "g");

/**
 * Render text that contains search highlight markers (PRD §15.4): the runs the server wrapped
 * in HIGHLIGHT_OPEN/CLOSE become `<mark>`; everything else is plain text. The markers are
 * private-use code points so they never appear literally in content.
 */
export function Highlight({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  MARKED.lastIndex = 0;
  while ((match = MARKED.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      <mark key={match.index} className="rounded-[3px] bg-amber-tint px-[2px] text-text">
        {match[1]}
      </mark>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));

  return (
    <>
      {nodes.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </>
  );
}
