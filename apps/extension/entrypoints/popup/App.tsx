import { useCallback, useEffect, useState } from "react";
import { browser } from "wxt/browser";
import { getConnectionState, NotConnectedError, NotPairedError } from "@/lib/api";
import { buildCapturePayload, readActiveTab, saveWebpage } from "@/lib/capture";
import { t } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { ConnectionStatus, type ConnState } from "@/components/ConnectionStatus";
import { ConnectionNotice } from "@/components/ConnectionNotice";
import { SourceCard } from "@/components/SourceCard";
import { PopupOutcome } from "@/components/PopupOutcome";
import { SaveIcon, SelectionIcon, SettingsIcon } from "@/components/icons";

type View = "ready" | "saving" | "saved" | "error";
interface Page {
  title: string;
  domain: string;
  faviconUrl?: string;
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default function App() {
  const [conn, setConn] = useState<ConnState>("checking");
  const [page, setPage] = useState<Page | null>(null);
  const [view, setView] = useState<View>("ready");
  const [error, setError] = useState<string>();
  const [truncated, setTruncated] = useState(false);

  const refresh = useCallback(async () => {
    setConn("checking");
    setConn(await getConnectionState());
  }, []);

  useEffect(() => {
    void (async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        setPage({
          title: tab.title ?? tab.url,
          domain: domainOf(tab.url),
          faviconUrl: tab.favIconUrl,
        });
      }
      await refresh();
    })();
  }, [refresh]);

  const openSettings = () => void browser.runtime.openOptionsPage();

  const save = async (mode: "page" | "selection") => {
    setView("saving");
    setError(undefined);
    try {
      const raw = await readActiveTab();
      if (mode === "selection" && !raw.selectedText.trim()) {
        setError("Select some text on the page first.");
        setView("error");
        return;
      }
      const payload = buildCapturePayload(raw, new Date().toISOString());
      await saveWebpage(payload);
      setTruncated(payload.truncated);
      setView("saved");
    } catch (err) {
      if (err instanceof NotPairedError) {
        setConn("unpaired");
        openSettings();
        setView("ready");
        return;
      }
      setError(err instanceof NotConnectedError ? t.offlineHelp : (err as Error).message);
      setView("error");
    }
  };

  return (
    <div className="flex w-[360px] flex-col bg-bg text-text" style={{ minHeight: 520 }}>
      <header className="flex items-center gap-[9px] border-b border-border px-4 py-[14px]">
        <Logo size={26} />
        <span className="text-sm font-semibold">{t.appName}</span>
        <span className="ml-auto">
          <ConnectionStatus state={conn} />
        </span>
        <button
          title={t.settings}
          onClick={openSettings}
          className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-text3 hover:bg-surface2"
        >
          <SettingsIcon />
        </button>
      </header>

      <div className="flex flex-1 flex-col p-4">
        {page && (
          <SourceCard title={page.title} domain={page.domain} faviconUrl={page.faviconUrl} />
        )}

        {view !== "ready" ? (
          <PopupOutcome
            view={view}
            message={error}
            truncated={truncated}
            onRetry={() => setView("ready")}
          />
        ) : conn === "disconnected" || conn === "unpaired" ? (
          <ConnectionNotice
            state={conn}
            onRetry={() => void refresh()}
            onOpenSettings={openSettings}
          />
        ) : (
          <>
            <button
              onClick={() => void save("page")}
              className="mb-[9px] flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-primary text-sm font-semibold text-primaryfg hover:opacity-90"
            >
              <SaveIcon />
              {t.savePage}
            </button>
            <button
              onClick={() => void save("selection")}
              className="mb-4 flex h-[38px] w-full items-center justify-center gap-[6px] rounded-[9px] border border-border bg-surface2 text-xs font-medium text-text2 hover:border-border2 hover:text-text"
            >
              <SelectionIcon />
              {t.saveSelection}
            </button>

            <span className="mb-[9px] text-[11px] text-text3">{t.saveAs}</span>
            <div className="flex flex-wrap gap-[7px]">
              <span className="flex items-center gap-[5px] rounded-[7px] border border-border2 bg-surface px-[10px] py-[5px] text-xs font-medium text-text">
                <span className="h-[5px] w-[5px] rounded-full bg-blue" />
                {t.webpage}
              </span>
              <span className="rounded-[7px] border border-border bg-surface2 px-[10px] py-[5px] text-xs text-text2">
                {t.selection}
              </span>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-border pt-[14px]">
              <span className="font-mono text-[11px] text-text3">⌘⇧S</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
