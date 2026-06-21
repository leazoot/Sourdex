import { t } from "@/lib/i18n";
import { CheckIcon } from "./icons";

/** Saving / saved / error states for the popup body (design 09/17). */
export function PopupOutcome({
  view,
  message,
  truncated,
  onRetry,
}: {
  view: "saving" | "saved" | "error";
  message?: string;
  truncated?: boolean;
  onRetry: () => void;
}) {
  if (view === "saving") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-[14px]">
        <span className="h-[30px] w-[30px] animate-spin rounded-full border-[2.5px] border-border2 border-t-copper" />
        <span className="text-[13.5px] font-medium text-text2">{t.saving}</span>
      </div>
    );
  }

  if (view === "saved") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-[11px] py-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-olive/15 text-olive">
          <CheckIcon />
        </div>
        <span className="text-[15px] font-semibold">{t.saved}</span>
        {truncated && (
          <span className="px-4 text-center text-[11px] text-text3">
            Page was large — a truncated copy was saved.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <span className="text-[13px] text-clay">{message}</span>
      <button
        onClick={onRetry}
        className="h-9 rounded-[9px] border border-border bg-surface2 px-4 text-[12.5px] font-medium text-text2 hover:border-border2 hover:text-text"
      >
        {t.retry}
      </button>
    </div>
  );
}
