import type { SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "@/components/icons";

export interface SelectOption {
  value: string;
  label: string;
}

/** Styled native select with a custom chevron (appearance-none keeps text clear of the icon). */
export function Select({
  options,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }) {
  return (
    <div className="relative inline-flex items-center">
      <select
        className={`h-9 appearance-none rounded-[9px] border border-border bg-surface pl-3 pr-8 text-[13px] text-text2 hover:border-border2 focus:border-border2 focus:outline-none ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text3">
        <ChevronDownIcon size={15} />
      </span>
    </div>
  );
}
