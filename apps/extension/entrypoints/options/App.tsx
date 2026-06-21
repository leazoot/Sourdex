import { useCallback, useEffect, useState } from "react";
import { getConnectionState } from "@/lib/api";
import { clearToken } from "@/lib/storage";
import { t } from "@/lib/i18n";
import { ConnectionStatus, type ConnState } from "@/components/ConnectionStatus";
import { PairingForm } from "@/components/PairingForm";
import { Logo } from "@/components/Logo";

export default function App() {
  const [conn, setConn] = useState<ConnState>("checking");

  const refresh = useCallback(async () => {
    setConn("checking");
    setConn(await getConnectionState());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const unpair = async () => {
    await clearToken();
    await refresh();
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="mx-auto max-w-[560px] px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <Logo size={30} />
          <div>
            <h1 className="text-lg font-semibold">{t.appName}</h1>
            <p className="text-[12px] text-text3">{t.tagline}</p>
          </div>
          <div className="ml-auto">
            <ConnectionStatus state={conn} />
          </div>
        </div>

        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold">{t.connectTitle}</h2>

          {conn === "connected" ? (
            <div className="mt-3">
              <p className="text-[13px] text-text2">{t.pairedOk}</p>
              <button
                onClick={() => void unpair()}
                className="mt-4 h-9 rounded-[9px] border border-border bg-surface2 px-4 text-[13px] font-medium text-text2 hover:border-border2 hover:text-text"
              >
                {t.unpair}
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <p className="mb-4 text-[13px] text-text2">{t.pairIntro}</p>
              {conn === "disconnected" ? (
                <div>
                  <p className="text-[12px] text-clay">{t.offlineHelp}</p>
                  <button
                    onClick={() => void refresh()}
                    className="mt-4 h-9 rounded-[9px] border border-border bg-surface2 px-4 text-[13px] font-medium text-text2 hover:border-border2 hover:text-text"
                  >
                    {t.retry}
                  </button>
                </div>
              ) : (
                <PairingForm onPaired={() => void refresh()} />
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
