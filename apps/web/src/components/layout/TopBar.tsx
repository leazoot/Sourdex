import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/Logo";
import { ThemeIcon } from "@/components/icons";
import { useTheme } from "@/lib/theme";
import { currentLang, setLang } from "@/lib/i18n";
import { ServiceStatus } from "@/features/service-status/ServiceStatus";

export function TopBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pref, setPref } = useTheme();

  const toggleTheme = () =>
    setPref(document.documentElement.classList.contains("dark") ? "light" : "dark");
  const toggleLang = () => setLang(currentLang() === "en" ? "zh" : "en");

  return (
    <header className="flex h-[50px] flex-none items-center gap-[14px] border-b border-border bg-bg px-4">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-[10px]"
        aria-label={t("app.name")}
      >
        <Logo size={27} />
        <span className="text-[15px] font-semibold tracking-tight">{t("app.name")}</span>
      </button>

      <button
        onClick={() => navigate("/search")}
        className="flex h-[34px] w-full max-w-[460px] items-center gap-[9px] rounded-[9px] border border-border bg-surface2 px-[13px] text-text3 hover:border-border2"
      >
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="6.2" />
          <path d="M20 20l-3.4-3.4" />
        </svg>
        <span className="text-[13px]">{t("search.placeholder")}</span>
        <span className="ml-auto flex gap-1">
          <kbd className="rounded border border-border bg-surface px-[5px] py-px font-mono text-[10px] text-text3">
            ⌘
          </kbd>
          <kbd className="rounded border border-border bg-surface px-[5px] py-px font-mono text-[10px] text-text3">
            K
          </kbd>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <ServiceStatus />
        <span className="h-[18px] w-px bg-border" />
        <button
          onClick={toggleLang}
          title="Language"
          className="flex h-[30px] items-center rounded-lg border border-border bg-surface px-[11px] text-[12px] font-medium text-text2 hover:border-border2 hover:text-text"
        >
          {currentLang() === "en" ? "EN / 中" : "中 / EN"}
        </button>
        <button
          onClick={toggleTheme}
          title={pref}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border bg-surface text-text2 hover:border-border2 hover:text-text"
        >
          <ThemeIcon />
        </button>
      </div>
    </header>
  );
}
