/**
 * Typed API client for the FastAPI backend.
 * Base URL comes from NEXT_PUBLIC_API_URL (.env.local).
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

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

export interface CampaignDetail {
  id: string;
  name: string;
  agent: string;
  script: string;
  schedule_date: string;
  schedule_time: string;
  status: string;
  pause_reason?: string;
  created_at: string;
  creditsUsed: number;
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  job: {
    total_contacts: number;
    completed_contacts: number;
    failed_contacts: number;
    status: string;
  };
  contacts: {
    id: number;
    name: string;
    phone: string;
    status: string;
    response: string;
    customer_name?: string;
    appointment_date?: string;
    appointment_time?: string;
    transcript?: any;
    duration?: number;
    datetime?: string;
  }[];
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
  human_response?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Read the auth token from session storage on every request
  let token: string | null = null;
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("callinggen-auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed.token ?? null;
      }
    } catch {}
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
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

  /** Single campaign detail with pagination. */
  getCampaign: (id: number, page: number = 1, limit: number = 50, search?: string, statusFilter?: string) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    if (statusFilter) params.set("status_filter", statusFilter);
    return request<CampaignDetail>(`/api/campaigns/${id}?${params.toString()}`);
  },

  /** Contacts for a campaign. */
  getCampaignContacts: (campaignId: number, page: number = 1, limit: number = 50, search?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    return request<{ id: number; name: string; phone: string; status: string; response: string }[]>(
      `/api/campaigns/${campaignId}/contacts?${params.toString()}`
    );
  },

  /** Pause campaign. */
  pauseCampaign: (campaignId: number) =>
    request<{ success: boolean; message: string; status: string }>(`/api/campaigns/${campaignId}/pause`, { method: "POST" }),

  /** Resume campaign. */
  resumeCampaign: (campaignId: number) =>
    request<{ success: boolean; message: string; status: string }>(`/api/campaigns/${campaignId}/resume`, { method: "POST" }),

  /** Stop campaign. */
  stopCampaign: (campaignId: number) =>
    request<{ success: boolean; message: string; status: string }>(`/api/campaigns/${campaignId}/stop`, { method: "POST" }),

  /** All completed/in-progress calls (Responses page). */
  getCalls: (page?: number, limit?: number, search?: string, status?: string, campaignId?: number) => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (campaignId) params.set("campaign_id", String(campaignId));
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return request<ResponseLog[] | { calls: ResponseLog[] }>(`/api/calls${queryStr}`).then(res => {
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).calls)) return (res as any).calls as ResponseLog[];
      return [] as ResponseLog[];
    });
  },

  /** BUG-007: Live contact-status counts for the Live Journey panel. */
  getCampaignLive: (campaignId: number) =>
    request<{
      registry: number; standby: number; dialer: number;
      analysis: number; completed: number; failed: number;
      campaign_status: string; total_contacts: number;
      schedule_date: string; schedule_time: string;
      contacts: { id: number; name: string; phone: string; status: string; response: string }[];
    }>(`/api/campaigns/${campaignId}/live`),

  /** BUG-024: Lightweight status poll. */
  getCampaignStatus: (campaignId: number) =>
    request<{ status: string; completed: number; failed: number; total: number }>(
      `/api/campaigns/${campaignId}/status`
    ),

  /** Update human response for a call. */
  updateHumanResponse: (callId: string, humanResponse: string) =>
    request<{ success: boolean; human_response: string | null }>(
      `/api/calls/${callId}/human-response`,
      {
        method: "PATCH",
        body: JSON.stringify({ human_response: humanResponse }),
      }
    ),

  /** Get user credits. */
  getCredits: (_token?: string) => request<{ credits: number }>("/api/auth/user/credits"),

  /** Get all report history. */
  getReports: () =>
    request<{ id: number; title: string; start_date: string; end_date: string; generated_at: string }[]>("/api/reports"),

  /** Generate a new report for date range. */
  generateReport: (startDate: string, endDate: string) =>
    request<{ report: string; stats: any }>("/api/reports/generate", {
      method: "POST",
      body: JSON.stringify({ start_date: startDate, end_date: endDate }),
    }),

  /** Get a single report by id. */
  getReport: (id: number) =>
    request<{
      id: number;
      title: string;
      start_date: string;
      end_date: string;
      content: string;
      stats: any;
      generated_at: string;
    }>(`/api/reports/${id}`),
};
