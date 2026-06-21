import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TagWithCount } from "@sourdex/core";
import { useDeleteTag, useMergeTag, useRenameTag, useTags } from "@/hooks/useTags";
import { TagCloud } from "@/features/tags/TagCloud";
import { TagRow } from "@/features/tags/TagRow";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type Filter = "all" | "ai" | "manual";

/** Tags page (PRD §6.2, design tags 06): cloud + list with rename / merge / delete. */
export function TagsPage() {
  const { t } = useTranslation();
  const tags = useTags();
  const rename = useRenameTag();
  const merge = useMergeTag();
  const del = useDeleteTag();
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<TagWithCount | null>(null);

  const all = tags.data ?? [];
  const filtered = useMemo(
    () => all.filter((tg) => (filter === "all" ? true : tg.type === filter)),
    [all, filter],
  );

  const TABS: { key: Filter; label: string }[] = [
    { key: "all", label: t("tagsPage.all") },
    { key: "ai", label: t("tagsPage.ai") },
    { key: "manual", label: t("tagsPage.manual") },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[920px] px-9 pb-[70px] pt-[30px]">
        <header className="mb-6">
          <h1 className="text-[22px] font-semibold tracking-tight">{t("tagsPage.title")}</h1>
          <p className="mt-1.5 text-[13px] text-text3">{t("tagsPage.subtitle")}</p>
        </header>

        {tags.isLoading ? (
          <Loading />
        ) : tags.error ? (
          <ErrorState error={tags.error} onRetry={() => void tags.refetch()} />
        ) : all.length === 0 ? (
          <EmptyState message={t("tagsPage.empty")} />
        ) : (
          <>
            <TagCloud tags={all} />
            <div className="mb-3.5 flex items-center gap-2">
              <span className="text-[13px] font-semibold text-text">{t("tagsPage.allTags")}</span>
              <span className="text-[12px] text-text3">{all.length}</span>
              <div className="ml-auto flex gap-1.5">
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`rounded-[7px] px-2.5 py-1 text-[12px] font-medium ${
                      filter === key
                        ? "border border-border2 bg-surface2 text-text"
                        : "text-text3 hover:text-text"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
              {filtered.map((tag) => (
                <TagRow
                  key={tag.id}
                  tag={tag}
                  others={all.filter((o) => o.id !== tag.id)}
                  onRename={(name) => rename.mutate({ id: tag.id, name })}
                  onMerge={(targetId) => merge.mutate({ id: tag.id, targetId })}
                  onDelete={() => setPending(tag)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={t("tagsPage.deleteConfirmTitle")}
        body={t("tagsPage.deleteConfirmBody")}
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          if (pending) del.mutate(pending.id);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
