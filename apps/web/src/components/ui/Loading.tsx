import { useTranslation } from "react-i18next";

/** Centered spinner used while queries are in flight. */
export function Loading() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-text3">
      <span className="h-7 w-7 animate-spin rounded-full border-[2.5px] border-border2 border-t-copper" />
      <span className="text-[13px]">{t("common.loading")}</span>
    </div>
  );
}
