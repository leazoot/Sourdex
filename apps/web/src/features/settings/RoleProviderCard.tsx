import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProviderType } from "@sourdex/core";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import {
  useCreateProvider,
  useDeleteProvider,
  useTestProvider,
  useUpdateProvider,
} from "@/hooks/useProviders";
import type { ProviderConfigView } from "@/lib/api/providers";

const TYPES = [
  { type: "openai-compatible", subtitleKey: "settings.aiOpenaiSubtitle" },
  { type: "ollama", subtitleKey: "settings.aiOllamaSubtitle" },
] as const satisfies readonly { type: ProviderType; subtitleKey: string }[];

type TestState = { kind: "ok"; model: string } | { kind: "error" } | null;

/**
 * One AI role — chat or embedding — configured as a standalone card with its own
 * endpoint/provider/model/key. Backed by a single provider_configs row that carries
 * only this role's model, so chat and embedding can use different providers (design
 * settings 08, adapted: roles are configured separately, not bundled per provider).
 */
export function RoleProviderCard({
  role,
  provider,
}: {
  role: "chat" | "embedding";
  provider?: ProviderConfigView;
}) {
  const { t } = useTranslation();
  const create = useCreateProvider();
  const update = useUpdateProvider();
  const del = useDeleteProvider();
  const test = useTestProvider();

  const [type, setType] = useState<ProviderType>(provider?.type ?? "openai-compatible");
  const [baseUrl, setBaseUrl] = useState(provider?.baseUrl ?? "");
  const [model, setModel] = useState(
    (role === "chat" ? provider?.chatModel : provider?.embeddingModel) ?? "",
  );
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(provider?.enabled ?? false);
  const [result, setResult] = useState<TestState>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const pending = create.isPending || update.isPending;
  const failed = create.isError || update.isError;
  const isOllama = type === "ollama";
  const title = role === "chat" ? t("settings.aiChatModel") : t("settings.aiEmbeddingModel");

  const submit = () => {
    const key = apiKey.trim();
    const nextModel = model.trim() || null;
    const roleModel = role === "chat" ? { chatModel: nextModel } : { embeddingModel: nextModel };
    if (provider) {
      update.mutate({
        id: provider.id,
        patch: {
          type,
          baseUrl: baseUrl.trim() || null,
          ...roleModel,
          enabled,
          ...(key ? { apiKey: key } : {}),
        },
      });
    } else {
      create.mutate({
        name: role === "chat" ? "Chat" : "Embedding",
        type,
        baseUrl: baseUrl.trim() || null,
        chatModel: role === "chat" ? nextModel : null,
        embeddingModel: role === "embedding" ? nextModel : null,
        enabled,
        ...(key ? { apiKey: key } : {}),
      });
    }
  };

  const runTest = () => {
    if (!provider) return;
    setResult(null);
    test.mutate(provider.id, {
      onSuccess: (r) => setResult({ kind: "ok", model: r.model }),
      onError: () => setResult({ kind: "error" }),
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold">{title}</h3>
        <Switch checked={enabled} onChange={setEnabled} label={t("settings.aiEnabled")} />
      </div>

      <div className="mb-3 flex gap-2.5">
        {TYPES.map((opt) => (
          <button
            key={opt.type}
            onClick={() => setType(opt.type)}
            className={`flex-1 rounded-[11px] border p-3 text-left transition-colors ${
              type === opt.type
                ? "border-copper bg-surface"
                : "border-border bg-bg hover:border-border2"
            }`}
          >
            <div className="text-[13.5px] font-semibold">{t(`provider.${opt.type}`)}</div>
            <div className="text-[12px] text-text3">{t(opt.subtitleKey)}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-text3">{t("settings.aiEndpoint")}</span>
          <Input
            value={baseUrl}
            placeholder={isOllama ? "http://127.0.0.1:11434" : "https://api.openai.com/v1"}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-text3">{t("settings.aiModelLabel")}</span>
          <Input value={model} onChange={(e) => setModel(e.target.value)} />
        </label>
        {!isOllama && (
          <label className="block">
            <span className="mb-1.5 block text-[12px] text-text3">{t("settings.aiApiKey")}</span>
            <Input
              type="password"
              value={apiKey}
              placeholder={provider?.hasApiKey ? "••••••••" : t("settings.aiApiKeyPlaceholder")}
              onChange={(e) => setApiKey(e.target.value)}
            />
            {provider?.hasApiKey && (
              <span className="mt-1 block text-[11px] text-text3">
                {t("settings.aiApiKeyStored")}
              </span>
            )}
          </label>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          disabled={pending || (!provider && !model.trim())}
          onClick={submit}
        >
          {t("settings.aiSave")}
        </Button>
        {provider && role === "chat" && (
          <Button variant="secondary" onClick={runTest} disabled={test.isPending}>
            {test.isPending ? t("settings.aiTesting") : t("settings.aiTest")}
          </Button>
        )}
        {provider && (
          <Button variant="ghost" className="text-clay" onClick={() => setConfirmRemove(true)}>
            {t("common.delete")}
          </Button>
        )}
        {result?.kind === "ok" && (
          <span className="text-[12px] text-olive">
            {t("settings.aiTestOk")} · {result.model}
          </span>
        )}
        {result?.kind === "error" && (
          <span className="text-[12px] text-clay">{t("settings.aiTestFailed")}</span>
        )}
        {failed && <span className="text-[12px] text-clay">{t("settings.aiSaveFailed")}</span>}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        title={t("settings.aiDeleteConfirmTitle")}
        body={t("settings.aiDeleteConfirmBody")}
        confirmLabel={t("common.delete")}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          if (provider) del.mutate(provider.id);
          setConfirmRemove(false);
        }}
      />
    </div>
  );
}
