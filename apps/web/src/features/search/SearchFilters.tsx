import type { SourceType } from "@sourdex/core";
import { useTranslation } from "react-i18next";

export type TimeRange = "any" | "week" | "month";

/** Filterable types shown in the UI (excludes screenshot, which has no v0.1 capture path). */
type FilterType = "" | "webpage" | "selection" | "pdf" | "video";
const TYPES: FilterType[] = ["", "webpage", "selection", "pdf", "video"];
const TIMES: TimeRange[] = ["any", "week", "month"];

/** Search filter sidebar (design search 04/15). Tag filter lands with tag data in v0.2. */
export function SearchFilters({
  type,
  onType,
  time,
  onTime,
}: {
  type: SourceType | "";
  onType: (t: SourceType | "") => void;
  time: TimeRange;
  onTime: (t: TimeRange) => void;
}) {
  const { t } = useTranslation();
  const timeLabel: Record<TimeRange, string> = {
    any: t("search.anyTime"),
    week: t("search.pastWeek"),
    month: t("search.pastMonth"),
  };
  return (
    <aside className="w-[228px] flex-none rounded-xl border border-border bg-surface p-[18px]">
      <div className="mb-4 text-[13px] font-semibold">{t("search.filters")}</div>

      <div className="mb-[18px]">
        <span className="mb-[9px] block font-mono text-[11px] uppercase tracking-wide text-text3">
          {t("search.type")}
        </span>
        <div className="flex flex-wrap gap-[6px]">
          {TYPES.map((val) => (
            <button
              key={val || "all"}
              onClick={() => onType(val)}
              className={`rounded-md px-[9px] py-[3px] text-[12px] ${
                type === val
                  ? "bg-primary text-primaryfg"
                  : "border border-border bg-surface2 text-text2 hover:border-border2"
              }`}
            >
              {val ? t(`types.${val}`) : t("search.allTypes")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-[9px] block font-mono text-[11px] uppercase tracking-wide text-text3">
          {t("search.time")}
        </span>
        <div className="flex flex-col gap-[7px] text-[13px]">
          {TIMES.map((val) => (
            <button
              key={val}
              onClick={() => onTime(val)}
              className="flex items-center gap-2 text-left"
            >
              <span
                className={`flex h-[14px] w-[14px] items-center justify-center rounded-full border-[1.5px] ${
                  time === val ? "border-copper" : "border-border2"
                }`}
              >
                {time === val && <span className="h-[7px] w-[7px] rounded-full bg-copper" />}
              </span>
              <span className={time === val ? "text-text2" : "text-text3"}>{timeLabel[val]}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
