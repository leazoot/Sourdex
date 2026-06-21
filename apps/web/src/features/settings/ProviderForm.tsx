import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ProviderType } from "@sourdex/core";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useCreateProvider, useUpdateProvider } from "@/hooks/useProviders";
import type { ProviderConfigView } from "@/lib/api/providers";

const TYPES = [
  { type: "openai-compatible", subtitleKey: "settings.aiOpenaiSubtitle" },
  { type: "ollama", subtitleKey: "settings.aiOllamaSubtitle" },
] as const satisfies readonly { type: ProviderType; subtitleKey: string }[];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] text-text3">{label}</span>
      {children}
    </label>
  );
}

/** Create/edit form for one AI provider config (design settings 08). */
export function ProviderForm({
  existing,
  onClose,
}: {
  existing?: ProviderConfigView;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const create = useCreateProvider();
  const update = useUpdateProvider();
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<ProviderType>(existing?.type ?? "openai-compatible");
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl ?? "");
  const [chatModel, setChatModel] = useState(existing?.chatModel ?? "");
  const [embeddingModel, setEmbeddingModel] = useState(existing?.embeddingModel ?? "");
  const [enabled, setEnabled] = useState(existing?.enabled ?? false);
  const [apiKey, setApiKey] = useState("");
  const pending = create.isPending || update.isPending;
  const isOllama = type === "ollama";

  const submit = () => {
    const shared = {
      name: name.trim(),
      type,
      baseUrl: baseUrl.trim() || null,
      chatModel: chatModel.trim() || null,
      embeddingModel: embeddingModel.trim() || null,
      enabled,
    };
    const key = apiKey.trim();
    if (existing) {
      update.mutate(
        { id: existing.id, patch: { ...shared, apiKey: key ? key : undefined } },
        { onSuccess: onClose },
      );
    } else {
      create.mutate({ ...shared, apiKey: key || undefined }, { onSuccess: onClose });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
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
        <Field label={t("settings.aiProviderName")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t("settings.aiEndpoint")}>
          <Input
            value={baseUrl}
            placeholder={isOllama ? "http://127.0.0.1:11434" : "https://api.openai.com/v1"}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </Field>
        <div className="flex gap-3">
          <Field label={t("settings.aiChatModel")}>
            <Input value={chatModel} onChange={(e) => setChatModel(e.target.value)} />
          </Field>
          <Field label={t("settings.aiEmbeddingModel")}>
            <Input value={embeddingModel} onChange={(e) => setEmbeddingModel(e.target.value)} />
          </Field>
        </div>
        {!isOllama && (
          <Field label={t("settings.aiApiKey")}>
            <Input
              type="password"
              value={apiKey}
              placeholder={existing?.hasApiKey ? "••••••••" : t("settings.aiApiKeyPlaceholder")}
              onChange={(e) => setApiKey(e.target.value)}
            />
            {existing?.hasApiKey && (
              <span className="mt-1 block text-[11px] text-text3">
                {t("settings.aiApiKeyStored")}
              </span>
            )}
          </Field>
        )}
        <div className="flex items-center gap-2.5">
          <Switch checked={enabled} onChange={setEnabled} label={t("settings.aiEnabled")} />
          <span className="text-[13px] text-text2">{t("settings.aiEnabled")}</span>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button variant="primary" disabled={pending || !name.trim()} onClick={submit}>
          {t("settings.aiSave")}
        </Button>
      </div>
    </div>
  );
}
