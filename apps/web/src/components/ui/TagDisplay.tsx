/** Renders a row of tag chips (design library card). Presentational only. */
export function TagDisplay({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-[6px]">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-md border border-border bg-surface2 px-[9px] py-[3px] text-[11px] text-text2"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
