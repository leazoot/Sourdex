import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useItems } from "@/hooks/useItems";
import { ItemList } from "@/features/item-list/ItemList";
import { useItemActions } from "@/features/item-list/useItemActions";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function InboxPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const query = { status: "inbox", sort: "newest" } as const;
  const { data, isLoading, error, refetch } = useItems(query);
  const actions = useItemActions();

  return (
    <div className="mx-auto max-w-[920px] px-8 py-8">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-copper">
        {t("inbox.eyebrow")}
      </p>
      <h1 className="mt-2 font-serif text-[34px] font-bold leading-tight">{t("inbox.title")}</h1>
      <p className="mt-1 text-[15px] italic text-text3">{t("app.tagline")}</p>

      <button
        onClick={() => navigate("/search")}
        className="mt-6 flex w-full items-center gap-3 rounded-[13px] border border-border2 bg-surface-raised px-[18px] py-4 text-left shadow-sm hover:border-copper"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          className="text-text3"
        >
          <circle cx="11" cy="11" r="6.2" />
          <path d="M20 20l-3.4-3.4" />
        </svg>
        <span className="text-[15px] text-text3">{t("search.placeholder")}</span>
      </button>

      <div className="mt-4 flex items-center gap-[10px] rounded-[10px] bg-olive-tint px-4 py-3">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-olive"
        >
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        <span className="text-[13px] font-semibold">{t("inbox.dataLocalTitle")}</span>
        <span className="text-[13px] text-text3">{t("inbox.dataLocalDesc")}</span>
      </div>

      <h2 className="mt-8 mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-text3">
        {t("nav.inbox")}
      </h2>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState message={t("inbox.empty")} />
      ) : (
        <ItemList
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
