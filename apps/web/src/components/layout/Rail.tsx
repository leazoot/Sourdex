import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/Logo";
import {
  AskIcon,
  ExportIcon,
  HomeIcon,
  LibraryIcon,
  SearchIcon,
  SettingsIcon,
  TagsIcon,
} from "@/components/icons";

type IconType = ComponentType<{ size?: number }>;

const PRIMARY: { to: string; icon: IconType; key: "inbox" | "library" | "search" }[] = [
  { to: "/", icon: HomeIcon, key: "inbox" },
  { to: "/library", icon: LibraryIcon, key: "library" },
  { to: "/search", icon: SearchIcon, key: "search" },
];

// v0.2 surfaces — shown for design parity but disabled in v0.1 (OQ-D2).
const SOON: { icon: IconType; key: "ask" | "export" | "tags" }[] = [
  { icon: AskIcon, key: "ask" },
  { icon: ExportIcon, key: "export" },
  { icon: TagsIcon, key: "tags" },
];

const itemBase = "flex h-10 w-10 items-center justify-center rounded-[10px] transition-colors";

export function Rail() {
  const { t } = useTranslation();
  return (
    <nav className="flex w-[60px] flex-none flex-col items-center border-r border-border bg-surface py-[13px]">
      <NavLink to="/" className="mb-4" aria-label={t("nav.inbox")}>
        <Logo size={30} />
      </NavLink>

      <div className="flex flex-col gap-1">
        {PRIMARY.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={key}
            to={to}
            end={to === "/"}
            title={t(`nav.${key}`)}
            aria-label={t(`nav.${key}`)}
            className={({ isActive }) =>
              `${itemBase} ${isActive ? "bg-surface-raised text-text shadow-sm" : "text-text3 hover:bg-surface2 hover:text-text2"}`
            }
          >
            <Icon />
          </NavLink>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-1">
        {SOON.map(({ icon: Icon, key }) => (
          <span
            key={key}
            title={`${t(`nav.${key}`)} · ${t("nav.soon")}`}
            aria-disabled
            className={`${itemBase} cursor-not-allowed text-text3 opacity-40`}
          >
            <Icon size={18} />
          </span>
        ))}
        <NavLink
          to="/settings"
          title={t("nav.settings")}
          aria-label={t("nav.settings")}
          className={({ isActive }) =>
            `${itemBase} ${isActive ? "bg-surface-raised text-text shadow-sm" : "text-text3 hover:bg-surface2 hover:text-text2"}`
          }
        >
          <SettingsIcon size={18} />
        </NavLink>
      </div>
    </nav>
  );
}
