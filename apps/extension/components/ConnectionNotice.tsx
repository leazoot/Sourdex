import { t } from "@/lib/i18n";

/**
 * Shown in the popup when saving isn't possible yet, so failures are never silent
 * (TASK-031): the service is offline, or the extension hasn't been paired.
 */
export function ConnectionNotice({
  state,
  onRetry,
  onOpenSettings,
}: {
  state: "disconnected" | "unpaired";
  onRetry: () => void;
  onOpenSettings: () => void;
}) {
  const offline = state === "disconnected";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <span className="text-[13.5px] font-semibold">{offline ? t.offline : t.notPaired}</span>
      <span className="text-[12px] text-text3">{offline ? t.offlineHelp : t.pairPrompt}</span>
      <button
        onClick={offline ? onRetry : onOpenSettings}
        className="mt-1 h-9 rounded-[9px] bg-primary px-4 text-[12.5px] font-semibold text-primaryfg hover:opacity-90"
      >
        {offline ? t.retry : t.openSettings}
      </button>
    </div>
  );
}
