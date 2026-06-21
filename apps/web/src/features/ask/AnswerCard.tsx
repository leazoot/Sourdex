import { Fragment, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { AskResult } from "@sourdex/core";

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "text-olive bg-olive-tint",
  medium: "text-amber bg-amber-tint",
  low: "text-clay bg-clay-tint",
};

/** Render answer text with inline [n] citation chips that jump to the cited source. */
function renderAnswer(answer: string, cited: Set<number>, onCite: (n: number) => void): ReactNode {
  return answer.split(/(\[\d+\])/g).map((part, i) => {
    const m = /^\[(\d+)\]$/.exec(part);
    if (m && cited.has(Number(m[1]))) {
      const n = Number(m[1]);
      return (
        <button
          key={i}
          onClick={() => onCite(n)}
          className="mx-[2px] inline-flex h-4 min-w-4 items-center justify-center rounded bg-copper-tint px-1 align-[1px] font-mono text-[10px] font-semibold text-copper"
        >
          {n}
        </button>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function AnswerCard({
  result,
  onOpen,
}: {
  result: AskResult;
  onOpen: (id: string) => void;
}) {
  const { t } = useTranslation();
  const cited = new Set(result.citations.map((c) => c.n));

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-[10px] border-b border-border bg-surface2 px-[22px] py-[15px]">
        <span className="font-mono text-[12px] font-semibold uppercase tracking-wide text-text2">
          {t("ask.answer")}
        </span>
        <span
          className={`flex items-center gap-[6px] rounded-md px-[9px] py-[3px] text-[12px] font-medium ${
            CONFIDENCE_COLOR[result.confidence] ?? "text-text2 bg-surface3"
          }`}
        >
          {t("ask.confidence")}: {t(`ask.${result.confidence}`)}
        </span>
        {result.citations.length > 0 && (
          <span className="text-[12px] text-text3">
            · {t("ask.basedOn", { count: result.citations.length })}
          </span>
        )}
      </div>

      <div className="whitespace-pre-wrap px-[22px] py-[22px] text-[15px] leading-[1.72] text-text">
        {renderAnswer(result.answer, cited, (n) => {
          const c = result.citations.find((x) => x.n === n);
          if (c) onOpen(c.itemId);
        })}
      </div>

      {result.citations.length > 0 && (
        <div className="px-[22px] pb-[22px] pt-1">
          <span className="mb-[11px] block font-mono text-[11px] uppercase tracking-wide text-text3">
            {t("ask.sources")}
          </span>
          <div className="flex flex-col gap-[10px]">
            {result.citations.map((c) => (
              <button
                key={c.n}
                onClick={() => onOpen(c.itemId)}
                className="flex gap-[13px] rounded-[11px] border border-border bg-bg px-[15px] py-[13px] text-left hover:border-border2"
              >
                <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md bg-copper-tint font-mono text-[11px] font-semibold text-copper">
                  {c.n}
                </span>
                <div className="min-w-0">
                  <span className="mb-[5px] block text-[13px] font-semibold text-text">
                    {c.title}
                  </span>
                  <p className="m-0 border-l-2 border-border2 pl-[10px] text-[12.5px] leading-[1.55] text-text2">
                    “{c.quote}”
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
