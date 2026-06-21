import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useStatus } from "@/hooks/useItems";
import { useTheme, type ThemePref } from "@/lib/theme";
import { currentLang, setLang } from "@/lib/i18n";
import { ProvidersSection } from "@/features/settings/ProvidersSection";

type Section = "appearance" | "language" | "dataLocation" | "aiProviders" | "privacy" | "about";
const SECTIONS: Section[] = [
  "appearance",
  "language",
  "dataLocation",
  "aiProviders",
  "privacy",
  "about",
];

const SECTION_LABEL = {
  appearance: "settings.appearance",
  language: "settings.language",
  dataLocation: "settings.dataLocation",
  aiProviders: "settings.aiProviders",
  privacy: "settings.privacy",
  about: "settings.about",
} as const satisfies Record<Section, string>;

/**
 * Mini mockup for each theme card (design settings 08). Colors are intentionally fixed (not
 * theme tokens): a "Light" preview must look light even while the app is in dark mode.
 */
function ThemePreview({ theme }: { theme: ThemePref }) {
  if (theme === "system") {
    return (
      <div
        className="h-16 rounded-lg border border-border"
        style={{ background: "linear-gradient(120deg,#f4f0e7 0 50%,#201d19 50% 100%)" }}
      />
    );
  }
  const dark = theme === "dark";
  return (
    <div
      className="flex h-16 flex-col justify-center gap-1.5 rounded-lg border border-border px-3"
      style={{ background: dark ? "#201d19" : "#f4f0e7" }}
    >
      <div
        className="h-1.5 w-3/5 rounded-full"
        style={{ background: dark ? "#56504a" : "#d7cfbe" }}
      />
      <div
        className="h-1.5 w-2/5 rounded-full"
        style={{ background: dark ? "#383531" : "#e7e0d2" }}
      />
    </div>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const [section, setSection] = useState<Section>("appearance");
  const { pref, setPref } = useTheme();
  const status = useStatus();
  const [, force] = useState(0);

  const themes: ThemePref[] = ["light", "dark", "system"];

  return (
    <div className="flex h-full">
      <aside className="w-[200px] flex-none border-r border-border p-6">
        <h1 className="mb-5 font-serif text-[22px] font-bold">{t("settings.title")}</h1>
        <nav className="flex flex-col gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                section === s ? "bg-surface2 font-medium text-text" : "text-text2 hover:text-text"
              }`}
            >
              {t(SECTION_LABEL[s])}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-[640px]">
          {section === "appearance" && (
            <section>
              <h2 className="text-[20px] font-semibold">{t("settings.appearance")}</h2>
              <p className="mt-1 text-[13px] text-text3">{t("settings.appearanceDesc")}</p>
              <div className="mt-5 grid grid-cols-3 gap-4">
                {themes.map((th) => (
                  <button
                    key={th}
                    onClick={() => setPref(th)}
                    className={`rounded-xl border-2 p-2.5 text-left transition-colors ${pref === th ? "border-copper" : "border-border hover:border-border2"}`}
                  >
                    <ThemePreview theme={th} />
                    <span className="mt-2.5 block text-[13px] font-medium">
                      {t(`settings.${th}`)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {section === "language" && (
            <section>
              <h2 className="text-[20px] font-semibold">{t("settings.language")}</h2>
              <p className="mt-1 text-[13px] text-text3">{t("settings.languageDesc")}</p>
              <div className="mt-5 inline-flex rounded-lg bg-surface2 p-1">
                {(["en", "zh"] as const).map((lng) => (
                  <button
                    key={lng}
                    onClick={() => {
                      setLang(lng);
                      force((n) => n + 1);
                    }}
                    className={`rounded-md px-4 py-[6px] text-[13px] ${currentLang() === lng ? "bg-surface-raised font-medium text-text shadow-sm" : "text-text2"}`}
                  >
                    {lng === "en" ? "English" : "中文"}
                  </button>
                ))}
              </div>
            </section>
          )}

          {section === "dataLocation" && (
            <section>
              <h2 className="text-[20px] font-semibold">{t("settings.dataLocation")}</h2>
              <p className="mt-1 text-[13px] text-text3">{t("settings.dataDirectory")}</p>
              <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                <span className="font-mono text-[13px] text-text2">
                  {status.data?.dataDir ?? (status.isError ? t("status.offline") : "…")}
                </span>
              </div>
            </section>
          )}

          {section === "aiProviders" && <ProvidersSection />}

          {section === "privacy" && (
            <section>
              <h2 className="text-[20px] font-semibold">{t("settings.privacy")}</h2>
              <p className="mt-3 max-w-[460px] text-[13px] text-text2">
                {t("settings.privacyDesc")}
              </p>
            </section>
          )}

          {section === "about" && (
            <section>
              <h2 className="text-[20px] font-semibold">{t("settings.about")}</h2>
              <p className="mt-3 text-[13px] text-text2">
                {t("app.name")} · v{status.data?.version ?? "0.0.0"}
              </p>
              <p className="mt-1 text-[13px] italic text-text3">{t("app.tagline")}</p>
              <div className="mt-4 flex items-center gap-[6px] text-[12px] text-text3">
                <span
                  className={`h-[7px] w-[7px] rounded-full ${status.isSuccess ? "bg-olive" : "bg-clay"}`}
                />
                {t("settings.serviceStatus")}:{" "}
                {status.isSuccess ? `${status.data.host}:${status.data.port}` : t("status.offline")}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
