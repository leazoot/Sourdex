import type { SearchResultItem } from "@sourdex/core";
import { useTranslation } from "react-i18next";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { Highlight } from "@/components/ui/Highlight";
import { formatRelativeTime } from "@/lib/format";

/** A single search hit card (design search 04/15): type, domain, time, score, highlighted text. */
export function SearchResultCard({
  hit,
  onOpen,
}: {
  hit: SearchResultItem;
  onOpen: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      onClick={() => onOpen(hit.itemId)}
      className="w-full rounded-xl border border-border bg-surface px-[18px] py-4 text-left transition-colors hover:border-border2"
    >
      <div className="mb-[9px] flex items-center gap-2">
        <TypeBadge type={hit.type} />
        {hit.domain && <span className="font-mono text-[12px] text-text3">{hit.domain}</span>}
        <span className="text-[12px] text-text3">· {formatRelativeTime(hit.savedAt)}</span>
        <span className="ml-auto flex items-center gap-[5px] font-mono text-[11px] font-semibold text-olive">
          <span className="h-[6px] w-[6px] rounded-full bg-olive" />
          {Math.round(hit.score * 100)}% {t("search.match")}
        </span>
      </div>
      <h3 className="mb-2 text-[15px] font-semibold leading-snug">
        <Highlight text={hit.title} />
      </h3>
      {hit.snippet && (
        <p className="text-[13px] leading-relaxed text-text2">
          <Highlight text={hit.snippet} />
        </p>
      )}
    </button>
  );
}
