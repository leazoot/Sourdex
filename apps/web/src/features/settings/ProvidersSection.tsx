import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDeleteProvider, useProviders } from "@/hooks/useProviders";
import type { ProviderConfigView } from "@/lib/api/providers";
import { ProviderForm } from "./ProviderForm";
import { ProviderRow } from "./ProviderRow";

type Editing = { mode: "new" } | { mode: "edit"; provider: ProviderConfigView } | null;

/** AI providers settings: list, add/edit, delete, with the data-egress disclosure. */
export function ProvidersSection() {
  const { t } = useTranslation();
  const providers = useProviders();
  const del = useDeleteProvider();
  const [editing, setEditing] = useState<Editing>(null);
  const [pendingDelete, setPendingDelete] = useState<ProviderConfigView | null>(null);

  const list = providers.data ?? [];
  // Chat and embedding roles resolve independently (matches the server): the first enabled
  // provider with a chat model serves chat; the first with an embedding model serves
  // embeddings. They can be different providers.
  const chatProvider = list.find((p) => p.enabled && Boolean(p.chatModel));
  const embedProvider = list.find((p) => p.enabled && Boolean(p.embeddingModel));

  const roleValue = (p: ProviderConfigView | undefined, model: string | null | undefined) =>
    p ? `${p.name} · ${model}` : t("settings.aiRoleNone");

  return (
    <section>
      <h2 className="text-[20px] font-semibold">{t("settings.aiProviders")}</h2>
      <p className="mt-1 max-w-[460px] text-[13px] text-text3">{t("settings.aiProvidersDesc")}</p>

      {list.length > 0 && (
        <div className="mt-4 grid max-w-[520px] grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-surface px-3.5 py-2.5">
            <div className="text-[11px] uppercase tracking-[0.05em] text-text3">
              {t("settings.aiChatRole")}
            </div>
            <div className="mt-1 truncate text-[13px] text-text">
              {roleValue(chatProvider, chatProvider?.chatModel)}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface px-3.5 py-2.5">
            <div className="text-[11px] uppercase tracking-[0.05em] text-text3">
              {t("settings.aiEmbeddingRole")}
            </div>
            <div className="mt-1 truncate text-[13px] text-text">
              {roleValue(embedProvider, embedProvider?.embeddingModel)}
            </div>
          </div>
          <p className="col-span-2 text-[12px] text-text3">{t("settings.aiRoleHint")}</p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {list.map((provider) => (
          <ProviderRow
            key={provider.id}
            provider={provider}
            onEdit={() => setEditing({ mode: "edit", provider })}
            onDelete={() => setPendingDelete(provider)}
          />
        ))}

        {list.length === 0 && !editing && (
          <p className="text-[13px] text-text3">{t("settings.aiNoProviders")}</p>
        )}

        {editing?.mode === "edit" && (
          <ProviderForm existing={editing.provider} onClose={() => setEditing(null)} />
        )}
        {editing?.mode === "new" && <ProviderForm onClose={() => setEditing(null)} />}
      </div>

      {!editing && (
        <Button variant="secondary" className="mt-4" onClick={() => setEditing({ mode: "new" })}>
          {t("settings.aiAddProvider")}
        </Button>
      )}

      <p className="mt-5 max-w-[520px] rounded-lg bg-surface2 px-3.5 py-3 text-[12px] leading-relaxed text-text3">
        {t("settings.aiEgressNote")}
      </p>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("settings.aiDeleteConfirmTitle")}
        body={t("settings.aiDeleteConfirmBody")}
        confirmLabel={t("common.delete")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) del.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </section>
  );
}
