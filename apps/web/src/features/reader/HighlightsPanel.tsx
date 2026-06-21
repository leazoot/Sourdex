import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAnnotations, useDeleteAnnotation, useUpdateAnnotation } from "@/hooks/useAnnotations";

const COLOR_DOT: Record<string, string> = {
  amber: "bg-amber",
  blue: "bg-blue",
  olive: "bg-olive",
  clay: "bg-clay",
};

/** Reader highlights & notes list with inline note editing and delete (PRD §5.2.5). */
export function HighlightsPanel({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data } = useAnnotations(itemId);
  const del = useDeleteAnnotation(itemId);
  const update = useUpdateAnnotation(itemId);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const annotations = data?.annotations ?? [];
  if (annotations.length === 0) return null;

  const saveNote = (id: string) => {
    update.mutate({ id, note: draft.trim() || null });
    setEditing(null);
  };

  return (
    <section className="mx-auto mt-10 w-full max-w-[720px] border-t border-border px-8 pt-6">
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-text3">
        {t("reader.highlights")}
      </h2>
      <div className="flex flex-col gap-3">
        {annotations.map((a) => (
          <div key={a.id} className="flex gap-3 rounded-[11px] border border-border bg-surface p-3">
            <span
              className={`mt-1 h-3 w-3 flex-none rounded-full ${COLOR_DOT[a.color ?? "amber"] ?? "bg-amber"}`}
            />
            <div className="min-w-0 flex-1">
              <p className="m-0 border-l-2 border-border2 pl-[10px] text-[13px] leading-[1.55] text-text2">
                “{a.selectedText}”
              </p>
              {editing === a.id ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => saveNote(a.id)}
                  onKeyDown={(e) => e.key === "Enter" && saveNote(a.id)}
                  placeholder={t("reader.addNote")}
                  className="mt-2 w-full rounded-md border border-border bg-bg px-2 py-1 text-[13px] text-text outline-none"
                />
              ) : (
                <button
                  onClick={() => {
                    setEditing(a.id);
                    setDraft(a.note ?? "");
                  }}
                  className="mt-2 block text-left text-[13px] text-text2 hover:text-text"
                >
                  {a.note ? a.note : <span className="text-text3">{t("reader.addNote")}</span>}
                </button>
              )}
            </div>
            <button
              onClick={() => del.mutate(a.id)}
              aria-label={t("common.delete")}
              className="flex-none self-start text-[12px] text-text3 hover:text-clay"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
