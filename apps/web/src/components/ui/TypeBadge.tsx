import type { SourceType } from "@sourdex/core";
import { useTranslation } from "react-i18next";

const DOT: Record<SourceType, string> = {
  webpage: "bg-blue",
  selection: "bg-amber",
  pdf: "bg-clay",
  video: "bg-olive",
  screenshot: "bg-copper",
};

/** Small uppercase pill with a type-colored dot (design library/reader). */
export function TypeBadge({ type }: { type: SourceType }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-[6px] rounded-md bg-surface2 px-[8px] py-[3px] font-mono text-[10px] font-semibold uppercase tracking-wide text-text2">
      <span className={`h-[5px] w-[5px] rounded-full ${DOT[type]}`} />
      {t(`types.${type === "screenshot" ? "webpage" : type}`)}
    </span>
  );
}
