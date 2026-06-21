import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useTestProvider, useUpdateProvider } from "@/hooks/useProviders";
import type { ProviderConfigView } from "@/lib/api/providers";

type TestState = { kind: "ok"; model: string } | { kind: "error" } | null;

/** One configured provider: status, enable toggle, test, edit, delete (design settings 08). */
export function ProviderRow({
  provider,
  onEdit,
  onDelete,
}: {
  provider: ProviderConfigView;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateProvider();
  const test = useTestProvider();
  const [result, setResult] = useState<TestState>(null);

  const runTest = () => {
    setResult(null);
    test.mutate(provider.id, {
      onSuccess: (r) => setResult({ kind: "ok", model: r.model }),
      onError: () => setResult({ kind: "error" }),
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13.5px] font-semibold">{provider.name}</span>
            <span className="text-[12px] text-text3">{t(`provider.${provider.type}`)}</span>
            {provider.hasApiKey && (
              <span className="rounded-full bg-surface2 px-2 py-[1px] text-[11px] text-text3">
                {t("settings.aiKeySet")}
              </span>
            )}
          </div>
          {provider.baseUrl && (
            <div className="mt-1 truncate font-mono text-[12px] text-text3">{provider.baseUrl}</div>
          )}
        </div>
        <Switch
          checked={provider.enabled}
          onChange={(next) => update.mutate({ id: provider.id, patch: { enabled: next } })}
          label={t("settings.aiEnabled")}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button variant="secondary" onClick={runTest} disabled={test.isPending}>
          {test.isPending ? t("settings.aiTesting") : t("settings.aiTest")}
        </Button>
        <Button variant="ghost" onClick={onEdit}>
          {t("settings.aiEdit")}
        </Button>
        <Button variant="ghost" className="text-clay" onClick={onDelete}>
          {t("common.delete")}
        </Button>
        {result?.kind === "ok" && (
          <span className="text-[12px] text-olive">
            {t("settings.aiTestOk")} · {result.model}
          </span>
        )}
        {result?.kind === "error" && (
          <span className="text-[12px] text-clay">{t("settings.aiTestFailed")}</span>
        )}
      </div>
    </div>
  );
}
