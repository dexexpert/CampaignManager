import {
  assertDraft,
  assertNotSentOrSending,
  parseAndValidateFutureIsoDatetime,
  type CampaignStatus,
} from "../src/campaigns/rules.js";

function expectError(fn: () => void, message: string, statusCode: number) {
  try {
    fn();
    throw new Error("expected_error_not_thrown");
  } catch (e: any) {
    expect(e.message).toBe(message);
    expect(e.statusCode).toBe(statusCode);
  }
}

describe("campaign business rules", () => {
  test("draft-only mutations reject non-draft", () => {
    const nonDraft: CampaignStatus[] = ["scheduled", "sending", "sent"];
    for (const s of nonDraft) {
      expectError(() => assertDraft(s, "campaign_not_editable"), "campaign_not_editable", 409);
    }
    expect(() => assertDraft("draft", "campaign_not_editable")).not.toThrow();
  });

  test("scheduled_at must be a future timestamp", () => {
    expectError(() => parseAndValidateFutureIsoDatetime("not-a-date"), "invalid_scheduled_at", 400);
    expectError(
      () => parseAndValidateFutureIsoDatetime(new Date(Date.now() - 60_000).toISOString()),
      "scheduled_at_must_be_future",
      400,
    );
    expect(parseAndValidateFutureIsoDatetime(new Date(Date.now() + 60_000).toISOString())).toBeInstanceOf(Date);
  });

  test("send cannot be repeated once sent/sending", () => {
    expectError(() => assertNotSentOrSending("sent"), "campaign_already_sent", 409);
    expectError(() => assertNotSentOrSending("sending"), "campaign_already_sending", 409);
    expect(() => assertNotSentOrSending("draft")).not.toThrow();
    expect(() => assertNotSentOrSending("scheduled")).not.toThrow();
  });
});

