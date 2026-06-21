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

type PrimaryKey = "inbox" | "library" | "search" | "ask" | "export";

const PRIMARY: { to: string; icon: IconType; key: PrimaryKey }[] = [
  { to: "/", icon: HomeIcon, key: "inbox" },
  { to: "/library", icon: LibraryIcon, key: "library" },
  { to: "/search", icon: SearchIcon, key: "search" },
  { to: "/ask", icon: AskIcon, key: "ask" },
  { to: "/export", icon: ExportIcon, key: "export" },
];

const SECONDARY: { to: string; icon: IconType; key: "tags" | "settings" }[] = [
  { to: "/tags", icon: TagsIcon, key: "tags" },
  { to: "/settings", icon: SettingsIcon, key: "settings" },
];

const itemBase = "flex h-10 w-10 items-center justify-center rounded-[10px] transition-colors";
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${itemBase} ${isActive ? "bg-surface-raised text-text shadow-sm" : "text-text3 hover:bg-surface2 hover:text-text2"}`;

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
            className={linkClass}
          >
            <Icon />
          </NavLink>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-1">
        {SECONDARY.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={key}
            to={to}
            title={t(`nav.${key}`)}
            aria-label={t(`nav.${key}`)}
            className={linkClass}
          >
            <Icon size={18} />
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
