import type { ReactNode } from "react";

/** Outline icons from the design (Sourdex.dc.html rail/header). Stroke = currentColor. */
function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M4 10.5l8-6 8 6" />
    <path d="M6 9.5V18a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
    <path d="M9.5 19v-5h5v5" />
  </Icon>
);

export const LibraryIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <rect x="4" y="4.5" width="16" height="6" rx="1.6" />
    <rect x="4" y="13.5" width="16" height="6" rx="1.6" />
    <path d="M7.5 7.5h2M7.5 16.5h2" />
  </Icon>
);

export const SearchIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.2" />
    <path d="M20 20l-3.4-3.4" />
  </Icon>
);

export const AskIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M5 5.5h14a2 2 0 0 1 2 2v6.4a2 2 0 0 1-2 2h-7l-4 3v-3H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2z" />
    <path d="M8.5 10h7M8.5 13h4" />
  </Icon>
);

export const ExportIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M12 4v10" />
    <path d="M8.4 10.6L12 14.2l3.6-3.6" />
    <path d="M5 15.5v2.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.5" />
  </Icon>
);

export const TagsIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M4 11.8V5.5a1.5 1.5 0 0 1 1.5-1.5h6.3a1.5 1.5 0 0 1 1.06.44l6.7 6.7a1.5 1.5 0 0 1 0 2.12l-5.74 5.74a1.5 1.5 0 0 1-2.12 0l-6.7-6.7A1.5 1.5 0 0 1 4 11.8z" />
    <circle cx="8.2" cy="8.2" r="1.3" fill="currentColor" stroke="none" />
  </Icon>
);

export const SettingsIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M4 8h9" />
    <circle cx="16.5" cy="8" r="2.1" />
    <path d="M19 8h1" />
    <path d="M4 16h4" />
    <circle cx="11" cy="16" r="2.1" />
    <path d="M13.5 16H20" />
  </Icon>
);

export const ThemeIcon = (p: { size?: number }) => (
  <Icon {...p} size={p.size ?? 15}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
  </Icon>
);

export const ChevronDownIcon = (p: { size?: number }) => (
  <Icon {...p} size={p.size ?? 16}>
    <path d="M6 9.5l6 6 6-6" />
  </Icon>
);
