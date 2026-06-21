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

  return (
    <section>
      <h2 className="text-[20px] font-semibold">{t("settings.aiProviders")}</h2>
      <p className="mt-1 max-w-[460px] text-[13px] text-text3">{t("settings.aiProvidersDesc")}</p>

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
