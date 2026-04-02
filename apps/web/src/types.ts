export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";

export type CampaignListItem = {
  id: string;
  name: string;
  subject: string;
  status: CampaignStatus;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignDetail = {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: CampaignStatus;
  scheduled_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CampaignRecipientRow = {
  id: string;
  email: string;
  name: string;
  status: "pending" | "sent" | "failed";
  sent_at: string | null;
  opened_at: string | null;
};

export type CampaignStats = {
  total: number;
  sent: number;
  failed: number;
  opened: number;
  open_rate: number;
  send_rate: number;
};

