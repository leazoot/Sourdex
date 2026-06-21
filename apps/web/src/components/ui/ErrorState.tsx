import { useTranslation } from "react-i18next";
import { NotConnectedError } from "@/lib/api/client";
import { Button } from "./Button";

/** Readable error with a retry action; never shows a raw stack (PRD §11.5). */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  const message = error instanceof NotConnectedError ? t("status.offline") : t("common.errorTitle");
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="text-[13.5px] font-semibold text-clay">{message}</span>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
