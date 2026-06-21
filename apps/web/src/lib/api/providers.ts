import type { ProviderConfig, ProviderType } from "@sourdex/core";
import { apiFetch } from "./client";

/** Provider config view from the server — includes `hasApiKey`, never the key itself. */
export interface ProviderConfigView extends ProviderConfig {
  hasApiKey: boolean;
}

export interface CreateProviderBody {
  name: string;
  type: ProviderType;
  baseUrl?: string | null;
  chatModel?: string | null;
  embeddingModel?: string | null;
  enabled?: boolean;
  apiKey?: string;
}

/** Patch body: `apiKey` string replaces, `null` clears, omitted leaves unchanged. */
export interface UpdateProviderBody {
  name?: string;
  type?: ProviderType;
  baseUrl?: string | null;
  chatModel?: string | null;
  embeddingModel?: string | null;
  enabled?: boolean;
  apiKey?: string | null;
}

const BASE = "/api/settings/providers";

export function listProviders(): Promise<ProviderConfigView[]> {
  return apiFetch<ProviderConfigView[]>(BASE);
}

export function createProvider(body: CreateProviderBody): Promise<ProviderConfigView> {
  return apiFetch<ProviderConfigView>(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function updateProvider(id: string, patch: UpdateProviderBody): Promise<ProviderConfigView> {
  return apiFetch<ProviderConfigView>(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export function deleteProvider(id: string): Promise<{ id: string; deleted: true }> {
  return apiFetch(`${BASE}/${id}`, { method: "DELETE" });
}

export function testProvider(id: string): Promise<{ ok: true; model: string }> {
  return apiFetch(`${BASE}/${id}/test`, { method: "POST" });
}
