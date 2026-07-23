export type ContactStatus = "pending" | "calling" | "completed" | "failed" | "no-answer";

export interface Contact {
  id: number;
  name: string;
  phone: string;
  status: ContactStatus;
  response: string;
  datetime?: string;
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
}

export interface LiveTrackingStats {
  registry: number;
  standby: number;
  dialer: number;
  analysis: number;
  completed: number;
  failed: number;
}
