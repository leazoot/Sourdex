import type { ReactNode } from "react";

/** Centered empty-state message with an optional action (design empty lists). */
export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface2 text-text3">
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M4 9h16M9 13h6" />
        </svg>
      </div>
      <p className="max-w-[320px] text-[13px] text-text3">{message}</p>
      {action}
    </div>
  );
}
