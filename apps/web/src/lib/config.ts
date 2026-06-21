/// <reference types="vite/client" />

/** Local Sourdex service base URL (loopback only, PRD §17.3). Overridable for dev. */
export const API_BASE = import.meta.env.VITE_SOURDEX_API ?? "http://127.0.0.1:8787";
