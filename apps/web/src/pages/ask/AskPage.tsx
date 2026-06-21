import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { AskScope } from "@sourdex/core";
import { useAsk } from "@/hooks/useAsk";
import { useProviders } from "@/hooks/useProviders";
import { AnswerCard } from "@/features/ask/AnswerCard";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";

type ScopeMode = "all" | "tag" | "selected";

export function AskPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ask = useAsk();
  const providers = useProviders();
  const [question, setQuestion] = useState("");
  const [scopeMode, setScopeMode] = useState<ScopeMode>("all");
  const [copied, setCopied] = useState(false);

  const providerList = Array.isArray(providers.data) ? providers.data : [];
  // Ask needs a chat-capable provider (chat & embedding are configured separately).
  const aiOn = providerList.some((p) => p.enabled && Boolean(p.chatModel));

  const submit = () => {
    const q = question.trim();
    if (!q || !aiOn) return;
    const scope: AskScope = scopeMode === "all" ? { type: "all" } : {};
    ask.mutate({ question: q, scope });
  };

  const copyCitations = async () => {
    const cites = ask.data?.citations ?? [];
    if (cites.length === 0) return;
    const text = cites
      .map((c) => `[${c.n}] ${c.title}${c.url ? ` — ${c.url}` : ""}\n“${c.quote}”`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const SCOPES: { mode: ScopeMode; label: string }[] = [
    { mode: "all", label: t("ask.allLibrary") },
    { mode: "tag", label: t("ask.currentTag") },
    { mode: "selected", label: t("ask.selected") },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[840px] px-9 pb-[70px] pt-9">
        <div className="mb-[30px] flex flex-col gap-[13px]">
          <div className="flex min-h-[58px] items-center gap-[13px] rounded-[14px] border border-border2 bg-surface px-[18px] py-3 shadow-sm">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={t("ask.inputPlaceholder")}
              className="flex-1 bg-transparent text-[17px] font-medium tracking-tight text-text outline-none placeholder:text-text3"
            />
            <button
              onClick={submit}
              disabled={!aiOn || ask.isPending || !question.trim()}
              aria-label={t("ask.answer")}
              className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] bg-primary text-primaryfg disabled:opacity-40"
            >
              →
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-text3">{t("ask.sources")}:</span>
            {SCOPES.map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setScopeMode(mode)}
                className={`flex h-[30px] items-center rounded-lg border px-3 text-[12px] font-medium ${
                  scopeMode === mode
                    ? "border-border2 bg-surface text-text"
                    : "border-border text-text3 hover:text-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {!aiOn ? (
          <p className="mt-10 text-center text-[14px] text-text3">{t("ask.aiOff")}</p>
        ) : ask.isPending ? (
          <Loading />
        ) : ask.error ? (
          <ErrorState error={ask.error} onRetry={submit} />
        ) : ask.data ? (
          ask.data.citations.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-border bg-surface px-[22px] py-6 text-[14px] text-text2">
              {t("ask.insufficient")}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <AnswerCard result={ask.data} onOpen={(id) => navigate(`/reader/${id}`)} />
              <button
                onClick={() => void copyCitations()}
                className="flex h-9 w-fit items-center rounded-[9px] border border-border bg-surface2 px-[14px] text-[12px] font-medium text-text2 hover:border-border2 hover:text-text"
              >
                {copied ? t("ask.copied") : t("ask.copyCitations")}
              </button>
            </div>
          )
        ) : (
          <p className="mt-10 text-center text-[14px] text-text3">{t("ask.prompt")}</p>
        )}
      </div>
    </div>
  );
}
