import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TagWithCount } from "@sourdex/core";
import { MergeIcon, RenameIcon, TagsIcon, TrashIcon } from "@/components/icons";
import { Select } from "@/components/ui/Select";

interface TagRowProps {
  tag: TagWithCount;
  others: TagWithCount[];
  onRename: (name: string) => void;
  onMerge: (targetId: string) => void;
  onDelete: () => void;
}

const iconBtn =
  "flex h-7 w-7 items-center justify-center rounded-[7px] border border-transparent text-text3 hover:border-border hover:text-text";

/** One tag row on the Tags page with inline rename / merge and delete (design tags 06). */
export function TagRow({ tag, others, onRename, onMerge, onDelete }: TagRowProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"view" | "rename" | "merge">("view");
  const [name, setName] = useState(tag.name);
  const [target, setTarget] = useState(others[0]?.id ?? "");

  const reset = () => {
    setMode("view");
    setName(tag.name);
  };

  if (mode === "rename") {
    return (
      <form
        className="flex items-center gap-2 border-b border-border px-[18px] py-[10px] last:border-b-0"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onRename(name.trim());
          setMode("view");
        }}
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 flex-1 rounded-[8px] border border-border2 bg-surface px-3 text-[14px] text-text outline-none"
        />
        <button
          type="submit"
          className="rounded-[7px] bg-primary px-3 py-1.5 text-[12px] text-primaryfg"
        >
          {t("tagsPage.save")}
        </button>
        <button
          type="button"
          onClick={reset}
          className="px-2 text-[12px] text-text3 hover:text-text"
        >
          {t("tagsPage.cancel")}
        </button>
      </form>
    );
  }

  if (mode === "merge") {
    return (
      <div className="flex items-center gap-2 border-b border-border px-[18px] py-[10px] last:border-b-0">
        <span className="text-[13px] text-text2">
          {tag.name} {t("tagsPage.mergePick")}
        </span>
        <Select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          options={others.map((o) => ({ value: o.id, label: o.name }))}
        />
        <button
          type="button"
          disabled={!target}
          onClick={() => {
            onMerge(target);
            setMode("view");
          }}
          className="rounded-[7px] bg-primary px-3 py-1.5 text-[12px] text-primaryfg disabled:opacity-40"
        >
          {t("tagsPage.merge")}
        </button>
        <button
          type="button"
          onClick={reset}
          className="px-2 text-[12px] text-text3 hover:text-text"
        >
          {t("tagsPage.cancel")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-b border-border px-[18px] py-[13px] last:border-b-0 hover:bg-surface2">
      <span className="flex-none text-text3">
        <TagsIcon size={15} />
      </span>
      <span className="text-[14px] font-medium text-text">{tag.name}</span>
      {tag.type === "ai" && (
        <span className="rounded-[5px] bg-olive-tint px-[7px] py-0.5 text-[10px] font-semibold text-olive">
          {t("tagsPage.ai")}
        </span>
      )}
      <span className="ml-auto text-[13px] tabular-nums text-text3">{tag.count}</span>
      <div className="flex gap-1">
        {others.length > 0 && (
          <button
            type="button"
            title={t("tagsPage.merge")}
            aria-label={t("tagsPage.merge")}
            onClick={() => setMode("merge")}
            className={iconBtn}
          >
            <MergeIcon size={15} />
          </button>
        )}
        <button
          type="button"
          title={t("tagsPage.rename")}
          aria-label={t("tagsPage.rename")}
          onClick={() => setMode("rename")}
          className={iconBtn}
        >
          <RenameIcon size={15} />
        </button>
        <button
          type="button"
          title={t("common.delete")}
          aria-label={t("common.delete")}
          onClick={onDelete}
          className={`${iconBtn} hover:text-copper`}
        >
          <TrashIcon size={15} />
        </button>
      </div>
    </div>
  );
}
