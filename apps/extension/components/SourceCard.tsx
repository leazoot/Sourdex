/** Page header card in the popup: favicon (or domain initials) + title + domain. */
export function SourceCard({
  title,
  domain,
  faviconUrl,
}: {
  title: string;
  domain: string;
  faviconUrl?: string;
}) {
  const initials =
    domain
      .replace(/^www\./, "")
      .slice(0, 3)
      .toUpperCase() || "—";
  return (
    <div className="mb-4 flex gap-[11px]">
      <div className="flex h-[42px] w-[42px] flex-none items-center justify-center overflow-hidden rounded-lg border border-border bg-surface2 font-mono text-xs font-semibold text-text2">
        {faviconUrl ? <img src={faviconUrl} alt="" className="h-5 w-5" /> : <span>{initials}</span>}
      </div>
      <div className="min-w-0">
        <div className="line-clamp-2 text-[13.5px] font-semibold leading-[1.35]">{title}</div>
        <div className="mt-[3px] font-mono text-[11px] text-text3">{domain}</div>
      </div>
    </div>
  );
}
