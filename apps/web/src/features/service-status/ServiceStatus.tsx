import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE } from "@/lib/config";

type State = "connected" | "offline" | "checking";

/** Header pill reflecting local-service reachability (public /api/health probe). */
export function ServiceStatus() {
  const { t } = useTranslation();
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let active = true;
    const ping = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (active) setState(res.ok ? "connected" : "offline");
      } catch {
        if (active) setState("offline");
      }
    };
    void ping();
    const id = setInterval(() => void ping(), 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const dot = state === "connected" ? "bg-olive" : state === "offline" ? "bg-clay" : "bg-text3";
  const label = state === "offline" ? t("status.offline") : t("status.connected");

  return (
    <span className="flex items-center gap-[6px] text-[12px] text-text2">
      <span className={`h-[7px] w-[7px] rounded-full ${dot}`} />
      {label}
    </span>
  );
}
