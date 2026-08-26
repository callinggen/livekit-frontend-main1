/**
 * Typed API client for the FastAPI backend.
 * Base URL comes from NEXT_PUBLIC_API_URL (.env.local).
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


// ── Types ──────────────────────────────────────────────────────────────────

export interface ApiContact {
  name: string;
  phone: string;
  metadata_fields?: Record<string, string>;
  original_row?: number;
}

export interface CampaignCreatePayload {
  campaign_name: string;
  agent: string;
  script: string;
  schedule_date: string;
  schedule_time: string;
  outbound_phone_number?: string;
  selection_type?: "all" | "range";
  start_row?: number;
  end_row?: number;
  whatsapp_automation?: any;
  contacts: ApiContact[];
  upload_source?: string;
  sheet_name?: string;
}

export interface UserPhoneNumber {
  id: number;
  phone_number: string;
  provider_name: string;
  region: string;
  sip_trunk_id?: string;
  is_default: boolean;
}


export interface CampaignRow {
  id: string;
  name: string;
  date: string;
  schedule: string;
  schedule_date?: string;
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
  campaignType?: string;
  parentCampaignId?: number;
  parentCampaignName?: string;
  contactCount?: number;
  upload_source?: string;
  sheet_name?: string;
}

export interface CampaignDetail extends CampaignRow {
  upload_source?: string;
  sheet_name?: string;
  schedule_date?: string;
  schedule_time?: string;
  job?: {
    total_contacts: number;
    completed_contacts: number;
    failed_contacts: number;
    status: string;
    started_at?: string | null;
    finished_at?: string | null;
  };
  contacts: {
    id: number;
    name: string;
    phone: string;
    status: string;
    response: string;
    duration: number;
    datetime: string;
    appointment_date?: string | null;
    appointment_time?: string | null;
    customer_name?: string | null;
    transcript?: string;
    credits?: number;
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
  campaign_id?: number;
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
  creditsDeducted?: number;
}

// ── Email Campaign Types ───────────────────────────────────────────────────

export interface EmailContactItem {
  name: string;
  email: string;
}

export interface EmailCampaignCreatePayload {
  name: string;
  subject: string;
  html_body: string;
  from_name?: string;
  reply_to?: string;
  schedule_date?: string;
  schedule_time?: string;
  contacts: EmailContactItem[];
}

export interface EmailCampaignRow {
  id: number;
  name: string;
  subject: string;
  from_name: string;
  status: string;
  schedule_date: string;
  schedule_time: string;
  created_at: string;
  total: number;
  sent: number;
  failed: number;
  pending: number;
}

export interface EmailCampaignDetail extends EmailCampaignRow {
  html_body: string;
  reply_to: string;
  stats: { total: number; sent: number; failed: number; pending: number };
  contacts: {
    id: number;
    name: string;
    email: string;
    status: string;
    sent_at: string | null;
    error_message: string;
  }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Read the auth token from session storage on every request
  let token: string | null = null;
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("callinggen-auth") || localStorage.getItem("callinggen-auth");
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
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("unauthorized-access"));
    }
    const text = await res.text();
    throw new Error(`API ${init?.method ?? "GET"} ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Campaign endpoints ─────────────────────────────────────────────────────

export const api = {
  /** Get current user details. */
  getMe: () => request<any>("/api/auth/me"),
  /** Update user profile information. */
  updateProfile: (data: { full_name?: string; company_name?: string; industry?: string; phone_number?: string }) =>
    request<any>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  /** Get user agents. */
  getAgents: () => request<{ id: number; name: string; language: string; voice: string; script: string }[]>("/api/agents"),
  /** Get current user credits. */
  getCredits: (token?: string) =>
    request<{ credits: number }>("/api/auth/me", {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    }),
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
  getCampaigns: (type?: string) => request<CampaignRow[]>(type ? `/api/campaigns?type=${type}` : "/api/campaigns"),

  /** Single campaign detail. */
  getCampaign: (id: number) => request<CampaignDetail>(`/api/campaigns/${id}`),

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

  /** Generate an AI report over a date range. */
  generateReport: (startDate: string, endDate: string) =>
    request<{ report: string; stats: any; id: number }>(
      `/api/reports/generate?start_date=${startDate}&end_date=${endDate}`
    ),

  /** Get all generated reports. */
  getReports: () =>
    request<{ id: number; title: string; start_date: string; end_date: string; generated_at: string }[]>(
      `/api/reports`
    ),

  /** Get a single report by ID. */
  getReport: (id: number) =>
    request<{ id: number; title: string; start_date: string; end_date: string; content: string; stats: any; generated_at: string }>(
      `/api/reports/${id}`
    ),

  /** Get available calendar booking slots. */
  getCalendarSlots: () =>
    request<{ available_slots: string[] }>("/api/calendar/slots"),

  /** Book an appointment slot on the calendar. */
  bookCalendarSlot: (payload: { name: string; email: string; phone: string; company: string; industry: string; appointment_time: string }) =>
    request<{ status: string; message: string }>("/api/calendar/book", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Trigger an instant demo call. */
  triggerDemoCall: (payload: { name: string; email?: string; company?: string; phone: string; industry?: string }) =>
    request<{ success: boolean; message: string }>("/api/demo/trigger-call", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Get user assigned provider phone numbers and region metadata. */
  getUserPhoneNumbers: () =>
    request<UserPhoneNumber[]>("/api/user/phone-numbers"),

  // ── Email Campaign endpoints ──────────────────────────────────────────────

  /** Create a new email campaign with contacts. Returns { campaign_id }. */
  createEmailCampaign: (payload: EmailCampaignCreatePayload) =>
    request<{ campaign_id: number; message: string }>("/api/email-campaigns", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** List all email campaigns for the current user. */
  getEmailCampaigns: () => request<EmailCampaignRow[]>("/api/email-campaigns"),

  /** Get full detail of a single email campaign. */
  getEmailCampaign: (id: number) =>
    request<EmailCampaignDetail>(`/api/email-campaigns/${id}`),

  /** Launch an email campaign (begins bulk sending). */
  launchEmailCampaign: (id: number) =>
    request<{ campaign_id: number; status: string; message: string }>(
      `/api/email-campaigns/${id}/launch`,
      { method: "POST" }
    ),

  /** Lightweight status poll for live updates on the detail page. */
  getEmailCampaignStatus: (id: number) =>
    request<{ status: string; total: number; sent: number; failed: number; pending: number }>(
      `/api/email-campaigns/${id}/status`
    ),

  /** Delete an email campaign. */
  deleteEmailCampaign: (id: number) =>
    request<{ message: string }>(`/api/email-campaigns/${id}`, {
      method: "DELETE",
    }),

  /** Create a Razorpay payment order. */
  createPaymentOrder: (planName: string) =>
    request<{ razorpay_order_id: string; amount: number; currency: string; key_id: string; plan_name: string }>(
      "/api/payments/create-order",
      {
        method: "POST",
        body: JSON.stringify({ plan_name: planName }),
      }
    ),

  /** Verify Razorpay payment signature. */
  verifyPayment: (payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    request<{ status: string; message: string; credits: number }>("/api/payments/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};



