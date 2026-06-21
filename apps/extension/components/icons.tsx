/** Small inline icons (design 09/17). Stroke follows currentColor. */
type IconProps = { size?: number };

export function SaveIcon({ size = 17 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4h9l4 4v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M9 4v5h5" />
    </svg>
  );
}

export function SelectionIcon({ size = 14 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 4v9a3 3 0 0 0 6 0V4" />
      <path d="M5 20h14" />
    </svg>
  );
}

export function CheckIcon({ size = 26 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12l4.5 4.5L19 7" />
    </svg>
  );
}

export function SettingsIcon({ size = 15 }: IconProps) {
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
      <path d="M4 8h9" />
      <circle cx="16.5" cy="8" r="2.1" />
      <path d="M4 16h4" />
      <circle cx="11" cy="16" r="2.1" />
      <path d="M13.5 16H20" />
    </svg>
  );
}
