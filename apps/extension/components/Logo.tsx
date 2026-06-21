/** Sourdex "S" mark with the copper source-dot (design system brand block). */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <div
      className="relative flex flex-none items-center justify-center rounded-[7px] bg-primary"
      style={{ width: size, height: size }}
    >
      <span
        className="font-semibold text-primaryfg"
        style={{ fontFamily: "Literata, serif", fontSize: size * 0.58, marginTop: 1 }}
      >
        S
      </span>
      <span className="absolute right-[3px] bottom-[3px] h-1 w-1 rounded-full bg-copper" />
    </div>
  );
}
