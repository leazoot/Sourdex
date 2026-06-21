import type { ItemListQuery, ItemSort, ItemStatus, SourceType } from "@sourdex/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useItems } from "@/hooks/useItems";
import { useExport } from "@/hooks/useExport";
import { VirtualItemList } from "@/features/item-list/VirtualItemList";
import { useItemActions } from "@/features/item-list/useItemActions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type Tab = "all" | "unread" | "archived";
const TAB_STATUS: Record<Tab, ItemStatus | undefined> = {
  all: undefined,
  unread: "inbox",
  archived: "archived",
};

export function LibraryPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("all");
  const [type, setType] = useState<SourceType | "">("");
  const [sort, setSort] = useState<ItemSort>("newest");
  const [exportedPath, setExportedPath] = useState<string | null>(null);
  const actions = useItemActions();
  const exportM = useExport();

  const query: ItemListQuery = {
    status: TAB_STATUS[tab],
    ...(type ? { type } : {}),
    sort,
    pageSize: 100,
  };
  const { data, isLoading, error, refetch } = useItems(query);

  const all = useItems({ pageSize: 1 });
  const unread = useItems({ status: "inbox", pageSize: 1 });
  const archived = useItems({ status: "archived", pageSize: 1 });
  const counts: Record<Tab, number | undefined> = {
    all: all.data?.total,
    unread: unread.data?.total,
    archived: archived.data?.total,
  };

  const typeOptions = [
    { value: "", label: t("library.allTypes") },
    { value: "webpage", label: t("types.webpage") },
    { value: "selection", label: t("types.selection") },
    { value: "pdf", label: t("types.pdf") },
    { value: "video", label: t("types.video") },
  ];
  const sortOptions: { value: ItemSort; label: string }[] = [
    { value: "newest", label: t("library.sort.newest") },
    { value: "oldest", label: t("library.sort.oldest") },
    { value: "title", label: t("library.sort.title") },
  ];

  return (
    <div className="mx-auto flex h-full max-w-[920px] flex-col px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-bold">{t("library.title")}</h1>
          <p className="mt-1 text-[14px] text-text3">{t("library.subtitle")}</p>
        </div>
        <div className="flex flex-none gap-2">
          <Select
            options={typeOptions}
            value={type}
            onChange={(e) => setType(e.target.value as SourceType | "")}
          />
          <Select
            options={sortOptions}
            value={sort}
            onChange={(e) => setSort(e.target.value as ItemSort)}
          />
          <Button
            variant="secondary"
            disabled={exportM.isPending || !data || data.items.length === 0}
            onClick={() =>
              data &&
              exportM.mutate(
                { itemIds: data.items.map((it) => it.id), format: "obsidian" },
                { onSuccess: (r) => setExportedPath(r.path) },
              )
            }
          >
            {exportM.isPending ? t("exportUi.exporting") : t("exportUi.all")}
          </Button>
        </div>
      </div>

      {exportedPath && (
        <div className="mt-3 rounded-lg bg-surface2 px-3 py-2 text-[12px] text-text2">
          {t("exportUi.done", { path: exportedPath })}
        </div>
      )}

      <div className="mt-5 mb-4 flex gap-2">
        {(["all", "unread", "archived"] as Tab[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-lg px-3 py-[6px] text-[13px] font-medium transition-colors ${
              tab === key ? "bg-primary text-primaryfg" : "bg-surface2 text-text2 hover:text-text"
            }`}
          >
            {t(`library.${key}`)}
            {counts[key] !== undefined && (
              <span className={tab === key ? "opacity-70" : "text-text3"}>{counts[key]}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState message={t("library.empty")} />
      ) : (
        <VirtualItemList
          items={data.items}
          onOpen={actions.onOpen}
          onArchive={actions.onArchive}
          onDelete={actions.onDelete}
        />
      )}

      <ConfirmDialog
        open={!!actions.pendingDelete}
        title={t("common.deleteConfirmTitle")}
        body={t("common.deleteConfirmBody")}
        confirmLabel={t("common.delete")}
        onConfirm={actions.confirmDelete}
        onCancel={actions.cancelDelete}
      />
    </div>
  );
}
