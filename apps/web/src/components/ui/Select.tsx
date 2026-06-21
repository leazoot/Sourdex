import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

/** Styled native select (accessible, design dropdowns). */
export function Select({
  options,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }) {
  return (
    <select
      className={`h-9 rounded-[9px] border border-border bg-surface px-3 text-[13px] text-text2 hover:border-border2 focus:border-border2 focus:outline-none ${className}`}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
