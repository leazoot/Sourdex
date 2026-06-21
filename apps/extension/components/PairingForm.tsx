import { useState } from "react";
import { completePairing, initiatePairing, NotConnectedError } from "@/lib/api";
import { t } from "@/lib/i18n";

type Phase = "idle" | "awaiting-code" | "submitting";

/** Pairing flow (OQ-A1 方案B): start → read code from service console → exchange. */
export function PairingForm({ onPaired }: { onPaired: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    try {
      await initiatePairing();
      setPhase("awaiting-code");
    } catch (err) {
      setError(err instanceof NotConnectedError ? t.offlineHelp : (err as Error).message);
    }
  };

  const confirm = async () => {
    setError(null);
    setPhase("submitting");
    try {
      await completePairing(code.trim());
      onPaired();
    } catch (err) {
      setError(err instanceof NotConnectedError ? t.offlineHelp : (err as Error).message);
      setPhase("awaiting-code");
    }
  };

  if (phase === "idle") {
    return (
      <div>
        <button
          onClick={() => void start()}
          className="h-9 rounded-[9px] bg-primary px-4 text-[13px] font-semibold text-primaryfg hover:opacity-90"
        >
          {t.startPairing}
        </button>
        {error && <p className="mt-3 text-[12px] text-clay">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[13px] text-text2">{t.pairStep}</p>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          placeholder={t.codePlaceholder}
          className="h-9 w-40 rounded-[9px] border border-border bg-surface px-3 font-mono text-[13px] text-text outline-none focus:border-border2"
        />
        <button
          onClick={() => void confirm()}
          disabled={phase === "submitting" || code.trim().length === 0}
          className="h-9 rounded-[9px] bg-primary px-4 text-[13px] font-semibold text-primaryfg hover:opacity-90 disabled:opacity-50"
        >
          {t.confirm}
        </button>
      </div>
      {error && <p className="mt-3 text-[12px] text-clay">{error}</p>}
    </div>
  );
}
