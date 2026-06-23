import { useTranslation } from "react-i18next";
import { useProviders } from "@/hooks/useProviders";
import { RoleProviderCard } from "./RoleProviderCard";

/**
 * AI settings: chat and embedding are configured as two separate cards, each with its
 * own endpoint/provider/model/key. The server resolves each role independently from the
 * provider rows (first enabled with a chat model serves chat; first with an embedding
 * model serves embeddings), so a relay without embeddings can pair with a local embedder.
 */
export function ProvidersSection() {
  const { t } = useTranslation();
  const providers = useProviders();

  const list = providers.data ?? [];
  const chatProvider = list.find((p) => Boolean(p.chatModel));
  const embedProvider = list.find((p) => Boolean(p.embeddingModel));

  return (
    <section>
      <h2 className="text-[20px] font-semibold">{t("settings.aiProviders")}</h2>
      <p className="mt-1 max-w-[460px] text-[13px] text-text3">{t("settings.aiProvidersDesc")}</p>
      <p className="mt-1 max-w-[460px] text-[12px] text-text3">{t("settings.aiRoleHint")}</p>

      <div className="mt-4 flex flex-col gap-3">
        <RoleProviderCard
          key={`chat-${chatProvider?.id ?? "new"}`}
          role="chat"
          provider={chatProvider}
        />
        <RoleProviderCard
          key={`embed-${embedProvider?.id ?? "new"}`}
          role="embedding"
          provider={embedProvider}
        />
      </div>

      <p className="mt-5 max-w-[520px] rounded-lg bg-surface2 px-3.5 py-3 text-[12px] leading-relaxed text-text3">
        {t("settings.aiEgressNote")}
      </p>
    </section>
  );
}
