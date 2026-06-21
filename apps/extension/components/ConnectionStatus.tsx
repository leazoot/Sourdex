import { t } from "@/lib/i18n";

export type ConnState = "connected" | "unpaired" | "disconnected" | "checking";

const STYLES: Record<ConnState, { dot: string; text: string; label: string }> = {
  connected: { dot: "bg-olive", text: "text-olive", label: t.connected },
  unpaired: { dot: "bg-copper", text: "text-copper", label: t.notPaired },
  disconnected: { dot: "bg-clay", text: "text-clay", label: t.offline },
  checking: { dot: "bg-text3", text: "text-text3", label: t.checking },
};

/** Small status pill used in the popup header and the options page. */
export function ConnectionStatus({ state }: { state: ConnState }) {
  const s = STYLES[state];
  return (
    <span className={`flex items-center gap-[5px] text-[11px] ${s.text}`}>
      <span className={`h-[6px] w-[6px] rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
