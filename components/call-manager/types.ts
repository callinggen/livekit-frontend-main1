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
