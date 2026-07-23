/**
 * Typed API client for the FastAPI backend.
 * Base URL comes from NEXT_PUBLIC_API_URL (.env.local).
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ApiContact {
  name: string;
  phone: string;
}

export interface CampaignCreatePayload {
  campaign_name: string;
  agent: string;
  script: string;
  schedule_date: string;
  schedule_time: string;
  contacts: ApiContact[];
}

export interface CampaignRow {
  id: string;
  name: string;
  date: string;
  schedule: string;
  sheetName: string;
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  interested: number;
  callbacks: number;
  creditsUsed: number;
  agent: string;
  status: string;
  script: string;
  uploadSource: string;
  notes: string;
}

export interface ResponseLog {
  id: string;
  name: string;
  phone: string;
  status: string;
  response: string;
  datetime: string;
  campaign: string;
  duration: string;
  duration_seconds?: number;
  transcript: { speaker: string; text: string }[];
  summary: string;
  notes: string;
  appointment_date?: string;
  appointment_time?: string;
  customer_name?: string;
  recording_url?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${init?.method ?? "GET"} ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Campaign endpoints ─────────────────────────────────────────────────────

export const api = {
  /** Create a new campaign with contacts. Returns { campaign_id }. */
  createCampaign: (payload: CampaignCreatePayload) =>
    request<{ campaign_id: number; message: string }>("/api/campaigns", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Launch a campaign by id. Returns { job_id, total_contacts }. */
  launchCampaign: (campaignId: number) =>
    request<{ job_id: number; total_contacts: number; message: string }>(
      `/api/campaigns/${campaignId}/launch`,
      { method: "POST" }
    ),

  /** List all campaigns. */
  getCampaigns: () => request<CampaignRow[]>("/api/campaigns"),

  /** Single campaign detail. */
  getCampaign: (id: number) => request<CampaignRow>(`/api/campaigns/${id}`),

  /** Contacts for a campaign. */
  getCampaignContacts: (campaignId: number) =>
    request<{ id: number; name: string; phone: string; status: string; response: string }[]>(
      `/api/campaigns/${campaignId}/contacts`
    ),

  /** All completed/in-progress calls (Responses page). */
  getCalls: () => request<ResponseLog[]>("/api/calls"),

  /** BUG-007: Live contact-status counts for the Live Journey panel. */
  getCampaignLive: (campaignId: number) =>
    request<{
      registry: number; standby: number; dialer: number;
      analysis: number; completed: number; failed: number;
      campaign_status: string; total_contacts: number;
    }>(`/api/campaigns/${campaignId}/live`),

  /** BUG-024: Lightweight status poll. */
  getCampaignStatus: (campaignId: number) =>
    request<{ status: string; completed: number; failed: number; total: number }>(
      `/api/campaigns/${campaignId}/status`
    ),
};
