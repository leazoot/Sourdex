/** Toggle switch matching the design system (settings 08 toggles). */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-[22px] w-[38px] flex-none items-center rounded-full px-[2px] transition-colors ${
        checked ? "bg-copper" : "bg-surface3"
      }`}
    >
      <span
        className={`h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[16px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}
