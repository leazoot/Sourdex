import { useTranslation } from "react-i18next";
import type { TagWithCount } from "@sourdex/core";

/** Map a tag's usage count to a cloud font size (15–38px), scaled to the busiest tag. */
function sizeFor(count: number, max: number): number {
  if (max <= 0) return 15;
  return Math.round(15 + (count / max) * 23);
}

/**
 * Tag cloud (weighted by count) + a "Recently added" card (design tags 06). True growth
 * deltas aren't tracked (item_tags has no timestamp, OQ-A12), so the card shows the most
 * recently created tags with their current count rather than a fabricated increment.
 */
export function TagCloud({ tags }: { tags: TagWithCount[] }) {
  const { t } = useTranslation();
  const max = tags.reduce((m, tag) => Math.max(m, tag.count), 0);
  const cloud = tags.slice(0, 14);
  const recent = [...tags].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 3);

  return (
    <div className="mb-7 flex items-stretch gap-[18px]">
      <div className="flex flex-1 flex-wrap content-center items-baseline gap-x-[22px] gap-y-[18px] rounded-[14px] border border-border bg-surface px-[26px] py-6">
        {cloud.map((tag) => (
          <span
            key={tag.id}
            style={{ fontSize: `${sizeFor(tag.count, max)}px` }}
            className="font-semibold leading-none tracking-tight text-text hover:text-copper"
          >
            {tag.name}
          </span>
        ))}
      </div>
      <div className="w-[236px] flex-none rounded-[14px] border border-border bg-surface p-[18px]">
        <div className="mb-[14px] text-[13px] font-semibold text-text">
          {t("tagsPage.recentlyGrowing")}
        </div>
        <div className="flex flex-col gap-3">
          {recent.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-text">{tag.name}</span>
              <span className="font-mono text-[12px] font-semibold text-olive">{tag.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
