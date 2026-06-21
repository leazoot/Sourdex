import type { Item } from "@sourdex/core";
import { useTranslation } from "react-i18next";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { formatRelativeTime } from "@/lib/format";

export interface ItemActions {
  onOpen: (id: string) => void;
  onArchive?: (item: Item) => void;
  onDelete?: (item: Item) => void;
}

/** A single saved item in a list (design library/inbox card). Presentational. */
export function ItemCard({ item, onOpen, onArchive, onDelete }: { item: Item } & ItemActions) {
  const { t } = useTranslation();
  return (
    <article
      onClick={() => onOpen(item.id)}
      className="group relative cursor-pointer rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border2"
    >
      <div className="mb-2 flex items-center gap-2">
        <TypeBadge type={item.type} />
        {item.domain && <span className="font-mono text-[11px] text-text3">{item.domain}</span>}
        <span className="text-[11px] text-text3">· {formatRelativeTime(item.savedAt)}</span>
        {item.status === "inbox" && (
          <span
            className="ml-auto h-[7px] w-[7px] flex-none rounded-full bg-copper"
            title={t("itemStatus.inbox")}
          />
        )}
      </div>

      <h3 className="text-[15px] font-semibold leading-snug">{item.title}</h3>
      {item.summary && (
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-text2">{item.summary}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-text3">
          {item.readingTime > 0 ? `${item.readingTime} ${t("common.min")}` : ""}
        </span>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(item);
              }}
              title={item.status === "archived" ? t("common.unarchive") : t("common.archive")}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text3 hover:bg-surface2 hover:text-text"
            >
              <svg
                viewBox="0 0 24 24"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="5" width="16" height="4" rx="1" />
                <path d="M5 9v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              title={t("common.delete")}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text3 hover:bg-clay-tint hover:text-clay"
            >
              <svg
                viewBox="0 0 24 24"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 7h14M9 7V5h6v2M7 7l1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
