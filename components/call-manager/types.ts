export type ContactStatus = "pending" | "calling" | "completed" | "failed" | "no-answer";

export interface Contact {
  id: number;
  name: string;
  phone: string;
  status: ContactStatus;
  response: string;
  datetime?: string;
  metadata_fields?: Record<string, string>;
}

export type UploadSourceType = "excel" | "csv" | "google_sheet" | "single";

export interface WhatsAppAutomationRule {
  id: string;
  category?: "ai_classification" | "response" | "status";
  value?: string;
  values?: string[]; // Multiselect filter support
  call_type_filters?: string[]; // ["All Types"] or ["Outbound", "Inbound"]
  ai_class_filters?: string[]; // ["All Leads"] or ["Interested", "Hot Lead", ...]
  response_filters?: string[]; // ["All Responses"] or ["Answered", "Appointment Booked", ...]
  status_filters?: string[]; // ["All Status"] or ["Completed", "Failed", ...]
  require_permission?: boolean; // Post-call material permission/consent check
  material_id?: number;
  message_text: string;
  attachments?: Array<{
    id?: number;
    title: string;
    type: "image" | "document";
    url: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
  }>;
  enabled: boolean;
}

export interface WhatsAppAutomationConfig {
  enabled: boolean;
  rules: WhatsAppAutomationRule[];
}

export interface CampaignFormData {
  campaignTitle: string;
  agent: string;
  scheduleDate: string;
  scheduleTime: string;
  script: string;
  uploadSource: UploadSourceType;
  googleSheetUrl?: string;
  singleContactName?: string;
  singleContactPhone?: string;
  outboundPhoneNumber?: string;
  selectionType: "all" | "range";
  startRow?: number;
  endRow?: number;
  whatsappAutomation?: WhatsAppAutomationConfig;
}


export interface LiveTrackingStats {
  registry: number;
  standby: number;
  dialer: number;
  analysis: number;
  completed: number;
  failed: number;
  campaign_status?: string;
  schedule_date?: string;
  schedule_time?: string;
}
