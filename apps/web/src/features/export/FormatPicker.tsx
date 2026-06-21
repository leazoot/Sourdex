import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ExportFormat } from "@sourdex/core";

interface FormatDef {
  key: ExportFormat;
  badge: ReactNode;
  title: string;
  desc: string;
}

/** The four export-format cards (design export 07). Selected card shows a check. */
export function FormatPicker({
  value,
  onChange,
}: {
  value: ExportFormat;
  onChange: (f: ExportFormat) => void;
}) {
  const { t } = useTranslation();
  const monoBadge = (label: string) => (
    <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[9px] border border-border bg-surface2 font-mono text-[11px] font-semibold text-text2">
      {label}
    </span>
  );

  const formats: FormatDef[] = [
    {
      key: "markdown",
      badge: monoBadge("md"),
      title: t("exportPage.markdown"),
      desc: t("exportPage.markdownDesc"),
    },
    {
      key: "obsidian",
      badge: (
        <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[9px] border border-border bg-surface2 text-text2">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          >
            <path d="M12 3l7 5-2.5 11h-9L5 8z" />
          </svg>
        </span>
      ),
      title: t("exportPage.obsidian"),
      desc: t("exportPage.obsidianDesc"),
    },
    {
      key: "json",
      badge: monoBadge("{ }"),
      title: t("exportPage.json"),
      desc: t("exportPage.jsonDesc"),
    },
    {
      key: "csv",
      badge: monoBadge("csv"),
      title: t("exportPage.csv"),
      desc: t("exportPage.csvDesc"),
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-[11px]">
      {formats.map((f) => {
        const active = value === f.key;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onChange(f.key)}
            className={`flex items-start gap-3 rounded-[12px] border p-4 text-left ${
              active ? "border-copper bg-surface" : "border-border bg-surface hover:border-border2"
            }`}
          >
            {f.badge}
            <span className="flex-1">
              <span className="mb-0.5 block text-[14px] font-semibold text-text">{f.title}</span>
              <span className="block text-[12px] leading-snug text-text3">{f.desc}</span>
            </span>
            <span
              className={`flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border ${
                active ? "border-copper bg-copper text-primaryfg" : "border-border2"
              }`}
            >
              {active && (
                <svg
                  viewBox="0 0 24 24"
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12l4 4 10-10" />
                </svg>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
