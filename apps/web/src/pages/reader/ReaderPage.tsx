import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDeleteItem, useItem, useItemContent, useUpdateItem } from "@/hooks/useItems";
import { useExport } from "@/hooks/useExport";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { TagDisplay } from "@/components/ui/TagDisplay";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SummaryPanel } from "@/features/reader/SummaryPanel";
import { formatNumber } from "@/lib/format";

export function ReaderPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const detail = useItem(id);
  const content = useItemContent(id);
  const update = useUpdateItem();
  const del = useDeleteItem();
  const exportM = useExport();
  const [copied, setCopied] = useState(false);
  const [exportedPath, setExportedPath] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const markedRead = useRef(false);

  const item = detail.data?.item;

  useEffect(() => {
    if (item && item.status === "inbox" && !markedRead.current) {
      markedRead.current = true;
      update.mutate({ id: item.id, patch: { status: "read" } });
    }
  }, [item, update]);

  if (detail.isLoading) return <Loading />;
  if (detail.error || !item)
    return <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />;

  const copyMarkdown = async () => {
    const md = content.data?.markdown;
    if (!md) return;
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center gap-3 border-b border-border px-6 py-3">
        <button
          onClick={() => navigate("/library")}
          className="flex items-center gap-1 text-[13px] text-text2 hover:text-text"
        >
          ← {t("reader.back")}
        </button>
        <span className="font-mono text-[11px] uppercase tracking-wide text-text3">
          {t("reader.reading")}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => void copyMarkdown()}
            disabled={!content.data?.markdown}
          >
            {copied ? t("common.copied") : t("common.copyMarkdown")}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              exportM.mutate(
                { itemIds: [item.id], format: "markdown" },
                { onSuccess: (r) => setExportedPath(r.path) },
              )
            }
            disabled={exportM.isPending}
          >
            {exportM.isPending ? t("exportUi.exporting") : t("exportUi.button")}
          </Button>
          {item.url && (
            <Button
              variant="secondary"
              onClick={() => window.open(item.url ?? "", "_blank", "noopener")}
            >
              {t("common.openOriginal")}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() =>
              update.mutate({
                id: item.id,
                patch: { status: item.status === "archived" ? "read" : "archived" },
              })
            }
          >
            {item.status === "archived" ? t("common.unarchive") : t("common.archive")}
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(true)}>
            {t("common.delete")}
          </Button>
        </div>
      </div>

      {exportedPath && (
        <div className="flex-none border-b border-border bg-surface2 px-6 py-2 text-[12px] text-text2">
          {t("exportUi.done", { path: exportedPath })}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto">
          <article className="mx-auto w-full max-w-[720px] px-8 py-8">
            <div className="mb-3 flex items-center gap-2">
              <TypeBadge type={item.type} />
              {item.domain && (
                <span className="font-mono text-[12px] text-text3">{item.domain}</span>
              )}
            </div>
            <h1 className="font-serif text-[34px] font-bold leading-[1.2]">{item.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-text3">
              {item.author && <span>{item.author}</span>}
              {item.wordCount > 0 && (
                <span>
                  {formatNumber(item.wordCount)} {t("common.words")}
                </span>
              )}
              {item.readingTime > 0 && (
                <span>
                  {item.readingTime} {t("common.min")}
                </span>
              )}
            </div>
            {detail.data && detail.data.tags.length > 0 && (
              <div className="mt-4">
                <TagDisplay tags={detail.data.tags.map((tg) => tg.name)} />
              </div>
            )}

            <div className="mt-8 border-t border-border pt-8">
              {content.isLoading ? (
                <Loading />
              ) : content.data?.readableHtml ? (
                <div
                  className="reader-content"
                  dangerouslySetInnerHTML={{ __html: content.data.readableHtml }}
                />
              ) : content.data?.plainText ? (
                <div className="reader-content whitespace-pre-wrap">{content.data.plainText}</div>
              ) : (
                <p className="text-[14px] text-text3">{t("reader.noContent")}</p>
              )}
            </div>
          </article>
        </div>
        <SummaryPanel item={item} summary={detail.data?.summary ?? null} />
      </div>

      <ConfirmDialog
        open={confirming}
        title={t("common.deleteConfirmTitle")}
        body={t("common.deleteConfirmBody")}
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          del.mutate(item.id);
          setConfirming(false);
          navigate("/library");
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
