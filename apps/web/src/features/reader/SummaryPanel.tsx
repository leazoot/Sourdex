import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type { Item, SummaryOutput } from "@sourdex/core";
import { Button } from "@/components/ui/Button";
import { useProviders } from "@/hooks/useProviders";
import { useSummarize } from "@/hooks/useSummarize";
import { queryKeys } from "@/lib/api/query-keys";

/** Reader right sidebar: AI summary + key points, with a generate action (design 03/14). */
export function SummaryPanel({ item, summary }: { item: Item; summary: SummaryOutput | null }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const providers = useProviders();
  const summarize = useSummarize(item.id);

  const hasEnabledProvider = (Array.isArray(providers.data) ? providers.data : []).some(
    (p) => p.enabled,
  );
  const pending = item.aiStatus === "pending" || summarize.isPending;

  // While a summary job runs, refresh the item so the result appears when ready.
  useEffect(() => {
    if (item.aiStatus !== "pending") return;
    const timer = setInterval(() => {
      void qc.invalidateQueries({ queryKey: queryKeys.item(item.id) });
    }, 2500);
    return () => clearInterval(timer);
  }, [item.aiStatus, item.id, qc]);

  return (
    <aside className="hidden w-[320px] flex-none overflow-y-auto border-l border-border px-6 py-6 lg:block">
      <div className="flex items-center gap-2">
        <h2 className="text-[15px] font-semibold">{t("reader.summary")}</h2>
      </div>

      {summary && summary.summary ? (
        <>
          <p className="mt-3 text-[13px] leading-relaxed text-text2">{summary.summary}</p>
          {summary.keyPoints.length > 0 && (
            <>
              <h3 className="mt-6 font-mono text-[11px] uppercase tracking-wide text-text3">
                {t("reader.keyPoints")}
              </h3>
              <ol className="mt-3 flex flex-col gap-3">
                {summary.keyPoints.map((point, i) => (
                  <li key={i} className="flex gap-3 text-[13px] text-text2">
                    <span className="font-mono text-[12px] text-copper">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="leading-snug">{point}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </>
      ) : (
        <div className="mt-3">
          {pending ? (
            <p className="text-[13px] text-text3">{t("reader.summarizing")}</p>
          ) : (
            <>
              <p className="text-[13px] text-text3">
                {item.aiStatus === "failed" ? t("reader.summaryFailed") : t("reader.noSummary")}
              </p>
              <Button
                variant="secondary"
                className="mt-3"
                disabled={!hasEnabledProvider}
                onClick={() => summarize.mutate()}
              >
                {t("reader.summarize")}
              </Button>
              {!hasEnabledProvider && (
                <p className="mt-2 text-[11px] text-text3">{t("reader.aiOff")}</p>
              )}
            </>
          )}
        </div>
      )}
    </aside>
  );
}
