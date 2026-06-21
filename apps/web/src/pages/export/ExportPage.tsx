import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ExportFormat, ExportScope } from "@sourdex/core";
import { useExport } from "@/hooks/useExport";
import { useTags } from "@/hooks/useTags";
import { useStatus } from "@/hooks/useItems";
import { FormatPicker } from "@/features/export/FormatPicker";
import { ExportPreview } from "@/features/export/ExportPreview";
import { Select } from "@/components/ui/Select";
import { ExportIcon } from "@/components/icons";

type ScopeMode = "all" | "inbox" | "tag";

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.05em] text-text3">
    {children}
  </span>
);

/** Export page (PRD §6.2 / §8.9, design export 07): format + scope + preview + run. */
export function ExportPage() {
  const { t } = useTranslation();
  const exportM = useExport();
  const tags = useTags();
  const status = useStatus();
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [scopeMode, setScopeMode] = useState<ScopeMode>("all");
  const [tagId, setTagId] = useState("");
  const [result, setResult] = useState<{ path: string; count: number; failed: number } | null>(
    null,
  );

  const tagList = tags.data ?? [];
  const effectiveTagId = tagId || tagList[0]?.id || "";

  const buildScope = (): ExportScope =>
    scopeMode === "inbox"
      ? { type: "status", status: "inbox" }
      : scopeMode === "tag"
        ? { type: "tag", tagId: effectiveTagId }
        : { type: "all" };

  const start = () => {
    if (scopeMode === "tag" && !effectiveTagId) return;
    exportM.mutate(
      { scope: buildScope(), format },
      { onSuccess: (r) => setResult({ path: r.path, count: r.count, failed: r.failed.length }) },
    );
  };

  const SCOPES: { mode: ScopeMode; label: string }[] = [
    { mode: "all", label: t("exportPage.entireLibrary") },
    { mode: "inbox", label: t("exportPage.inboxOnly") },
    { mode: "tag", label: t("exportPage.byTag") },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[960px] px-9 pb-[70px] pt-[30px]">
        <header className="mb-6">
          <h1 className="text-[22px] font-semibold tracking-tight">{t("exportPage.title")}</h1>
          <p className="mt-1.5 text-[13px] text-text3">{t("exportPage.subtitle")}</p>
        </header>

        <div className="flex items-start gap-6">
          <div className="min-w-0 flex-1">
            <SectionLabel>{t("exportPage.chooseFormat")}</SectionLabel>
            <FormatPicker value={format} onChange={setFormat} />

            <SectionLabel>{t("exportPage.scope")}</SectionLabel>
            <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
              {SCOPES.map(({ mode, label }) => (
                <label
                  key={mode}
                  className="flex cursor-pointer items-center gap-3 border-b border-border px-4 py-[13px] last:border-b-0"
                >
                  <input
                    type="radio"
                    name="scope"
                    checked={scopeMode === mode}
                    onChange={() => setScopeMode(mode)}
                    className="accent-copper"
                  />
                  <span className="flex-1 text-[13.5px] text-text">{label}</span>
                  {mode === "tag" && scopeMode === "tag" && tagList.length > 0 && (
                    <Select
                      value={effectiveTagId}
                      onChange={(e) => setTagId(e.target.value)}
                      options={tagList.map((tg) => ({ value: tg.id, label: tg.name }))}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="w-[344px] flex-none">
            <SectionLabel>{t("exportPage.preview")}</SectionLabel>
            <div className="mb-[18px]">
              <ExportPreview format={format} />
            </div>

            <SectionLabel>{t("exportPage.destination")}</SectionLabel>
            <div className="mb-3 flex items-center gap-2 rounded-[9px] border border-border bg-surface px-3 py-2.5">
              <span className="flex-1 truncate font-mono text-[12px] text-text2">
                {status.data ? `${status.data.dataDir}/files/exports` : "…"}
              </span>
            </div>
            <p className="mb-[18px] text-[12px] text-text3">{t("exportPage.destinationNote")}</p>

            <button
              type="button"
              onClick={start}
              disabled={exportM.isPending || (scopeMode === "tag" && !effectiveTagId)}
              className="flex h-[42px] w-full items-center justify-center gap-2 rounded-[10px] bg-primary text-[13px] font-semibold text-primaryfg disabled:opacity-40"
            >
              <ExportIcon size={16} />
              {exportM.isPending ? t("exportPage.exporting") : t("exportPage.start")}
            </button>

            {result && (
              <p className="mt-3 rounded-[9px] border border-border bg-surface2 px-3 py-2 text-[12px] text-text2">
                {t("exportPage.done", { count: result.count, path: result.path })}
                {result.failed > 0 ? ` · ${t("exportPage.someSkipped", { n: result.failed })}` : ""}
              </p>
            )}
            {exportM.error && (
              <p className="mt-3 text-[12px] text-clay">{t("exportPage.failed")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
