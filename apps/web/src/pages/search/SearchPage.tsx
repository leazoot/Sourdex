import type { SearchInput, SourceType } from "@sourdex/core";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSearch } from "@/hooks/useSearch";
import { SearchResultCard } from "@/features/search/SearchResultCard";
import { SearchFilters, type TimeRange } from "@/features/search/SearchFilters";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { SearchIcon } from "@/components/icons";

const DAY = 1000 * 60 * 60 * 24;

function fromForTime(time: TimeRange): string | undefined {
  if (time === "week") return new Date(Date.now() - 7 * DAY).toISOString();
  if (time === "month") return new Date(Date.now() - 30 * DAY).toISOString();
  return undefined;
}

export function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [input, setInput] = useState(params.get("q") ?? "");
  const [q, setQ] = useState(input);
  const [type, setType] = useState<SourceType | "">("");
  const [time, setTime] = useState<TimeRange>("any");
  const [sort, setSort] = useState<"relevance" | "newest">("relevance");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  // Debounce the typed query into the actual search term + URL.
  useEffect(() => {
    const id = setTimeout(() => {
      setQ(input);
      setParams(input ? { q: input } : {}, { replace: true });
    }, 250);
    return () => clearTimeout(id);
  }, [input, setParams]);

  const request: SearchInput = { q, sort, ...(type ? { type } : {}), from: fromForTime(time) };
  const { data, isFetching, error, refetch } = useSearch(request);
  const results = data?.results ?? [];
  const hasQuery = q.trim().length > 0;

  return (
    <div className="mx-auto h-full max-w-[1080px] overflow-y-auto px-9 py-10">
      <div className="flex h-[62px] items-center gap-[13px] rounded-[15px] border border-border2 bg-surface px-5 shadow-sm">
        <span className="flex-none text-text2">
          <SearchIcon size={24} />
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("search.inputPlaceholder")}
          className="flex-1 bg-transparent text-[22px] font-medium tracking-tight text-text outline-none placeholder:text-text3"
        />
        <div className="flex w-[178px] gap-[3px] rounded-[9px] border border-border bg-surface2 p-[3px]">
          <span className="flex flex-1 items-center justify-center rounded-md bg-surface py-[5px] text-[12px] font-medium text-text shadow-sm">
            {t("search.keyword")}
          </span>
          <span
            title={t("search.semanticSoon")}
            className="flex flex-1 cursor-not-allowed items-center justify-center rounded-md py-[5px] text-[12px] font-medium text-text3"
          >
            {t("search.semantic")}
          </span>
        </div>
      </div>

      {!hasQuery ? (
        <p className="mt-10 text-center text-[14px] text-text3">{t("search.prompt")}</p>
      ) : (
        <div className="mt-8 flex items-start gap-7">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[13px] text-text3">
                <b className="font-semibold text-text">{results.length}</b> {t("search.results")} ·
                “{q}”
              </span>
              <div className="flex gap-[5px]">
                {(["relevance", "newest"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`rounded-[7px] px-[11px] py-[5px] text-[12px] font-medium ${
                      sort === s
                        ? "border border-border2 bg-surface2 text-text"
                        : "text-text3 hover:text-text"
                    }`}
                  >
                    {t(`search.${s}`)}
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <ErrorState error={error} onRetry={() => void refetch()} />
            ) : isFetching && results.length === 0 ? (
              <Loading />
            ) : results.length === 0 ? (
              <p className="mt-10 text-center text-[14px] text-text3">
                {t("search.empty")} “{q}”
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {results.map((hit) => (
                  <SearchResultCard
                    key={hit.itemId}
                    hit={hit}
                    onOpen={(id) => navigate(`/reader/${id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          <SearchFilters type={type} onType={setType} time={time} onTime={setTime} />
        </div>
      )}
    </div>
  );
}
