import type { InputHTMLAttributes } from "react";

/** Text input matching the design system (settings 08): bg surface, subtle border. */
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-9 w-full rounded-lg border border-border bg-bg px-3 text-[12.5px] text-text2 placeholder:text-text3 focus:border-border2 focus:outline-none ${className}`}
      {...props}
    />
  );
}
