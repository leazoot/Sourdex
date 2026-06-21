/** Sourdex "S" mark with the copper source-dot (design system brand block). */
export function Logo({ size = 27 }: { size?: number }) {
  return (
    <div
      className="relative flex flex-none items-center justify-center rounded-[7px] bg-primary shadow-sm"
      style={{ width: size, height: size }}
    >
      <span
        className="font-serif font-semibold leading-none text-primaryfg"
        style={{ fontSize: size * 0.6, marginTop: 2 }}
      >
        S
      </span>
      <span className="absolute right-1 bottom-1 h-1 w-1 rounded-full bg-copper" />
    </div>
  );
}
