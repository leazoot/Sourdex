import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primaryfg hover:opacity-90",
  secondary: "border border-border bg-surface2 text-text2 hover:border-border2 hover:text-text",
  ghost: "text-text2 hover:bg-surface2 hover:text-text",
};

/** Minimal Tailwind button primitive matching the design system (OQ-02). */
export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex h-9 items-center justify-center gap-[6px] rounded-[9px] px-4 text-[13px] font-medium transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
