export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";

export function assertDraft(status: CampaignStatus, errorCode: string) {
  if (status !== "draft") {
    const err = new Error(errorCode);
    (err as any).statusCode = 409;
    throw err;
  }
}

export function assertNotSentOrSending(status: CampaignStatus) {
  if (status === "sent") {
    const err = new Error("campaign_already_sent");
    (err as any).statusCode = 409;
    throw err;
  }
  if (status === "sending") {
    const err = new Error("campaign_already_sending");
    (err as any).statusCode = 409;
    throw err;
  }
}

export function parseAndValidateFutureIsoDatetime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const err = new Error("invalid_scheduled_at");
    (err as any).statusCode = 400;
    throw err;
  }
  if (d.getTime() <= Date.now()) {
    const err = new Error("scheduled_at_must_be_future");
    (err as any).statusCode = 400;
    throw err;
  }
  return d;
}

