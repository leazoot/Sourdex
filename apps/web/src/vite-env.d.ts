/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Override the local service base URL (default http://127.0.0.1:8787). */
  readonly VITE_SOURDEX_API?: string;
  /** Dev-only paired token (OQ-W1); production injects it at serve time. */
  readonly VITE_SOURDEX_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __SOURDEX__?: { token?: string };
}
