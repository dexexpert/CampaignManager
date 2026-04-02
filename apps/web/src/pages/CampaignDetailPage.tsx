import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { apiFetch, type ApiError } from "../lib/api";
import type { CampaignDetail, CampaignRecipientRow, CampaignStats } from "../types";
import { Badge, ErrorBox, ProgressBar, Spinner, TopNav } from "../components/ui";

type CampaignDetailResponse = {
  campaign: CampaignDetail;
  recipients: CampaignRecipientRow[];
  stats: CampaignStats;
};

export function CampaignDetailPage() {
  const token = useAppSelector((s) => s.auth.token);
  const nav = useNavigate();
  const qc = useQueryClient();
  const { id } = useParams();
  const campaignId = id ?? "";

  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return d.toISOString().slice(0, 16); // yyyy-mm-ddThh:mm
  });

  const q = useQuery<CampaignDetailResponse, ApiError>({
    queryKey: ["campaign", campaignId],
    queryFn: async () => apiFetch(`/campaigns/${campaignId}`, { token }),
    enabled: !!token && !!campaignId,
    refetchInterval: 1500,
  });

  const stats = q.data?.stats;
  const isDraft = q.data?.campaign.status === "draft";
  const isSent = q.data?.campaign.status === "sent";
  const isSending = q.data?.campaign.status === "sending";

  const scheduleM = useMutation<{ campaign: any }, ApiError>({
    mutationFn: async () => {
      const iso = new Date(scheduledAt).toISOString();
      return await apiFetch(`/campaigns/${campaignId}/schedule`, { token, body: { scheduledAt: iso } });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["campaign", campaignId] });
      await qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  const sendM = useMutation<{ ok: true }, ApiError>({
    mutationFn: async () => apiFetch(`/campaigns/${campaignId}/send`, { token, method: "POST" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["campaign", campaignId] });
      await qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  const deleteM = useMutation<void, ApiError>({
    mutationFn: async () => {
      await apiFetch(`/campaigns/${campaignId}`, { token, method: "DELETE" });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["campaigns"] });
      nav("/campaigns");
    },
  });

  const openRateLabel = useMemo(() => (stats ? `${Math.round(stats.open_rate * 100)}%` : "—"), [stats]);
  const sendRateLabel = useMemo(() => (stats ? `${Math.round(stats.send_rate * 100)}%` : "—"), [stats]);

  // auth gate is enforced by the route wrapper.

  return (
    <div className="container">
      <TopNav
        right={
          <>
            <Link className="btn" to="/campaigns">
              Back
            </Link>
            {isDraft ? (
              <>
                <button className="btn" onClick={() => scheduleM.mutate()} disabled={scheduleM.isPending}>
                  Schedule
                </button>
                <button className="btn primary" onClick={() => sendM.mutate()} disabled={sendM.isPending}>
                  Send
                </button>
                <button className="btn danger" onClick={() => deleteM.mutate()} disabled={deleteM.isPending}>
                  Delete
                </button>
              </>
            ) : (
              <button className="btn primary" onClick={() => sendM.mutate()} disabled={sendM.isPending || isSent || isSending}>
                Send
              </button>
            )}
          </>
        }
      />

      <div style={{ height: 14 }} />

      {q.isLoading ? (
        <Spinner label="Loading campaign" />
      ) : q.isError ? (
        <ErrorBox title="Failed to load campaign" message={q.error?.error} />
      ) : (
        <>
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
              <div>
                <div className="h1" style={{ marginBottom: 6 }}>
                  {q.data?.campaign.name}
                </div>
                <div className="muted">{q.data?.campaign.subject}</div>
              </div>
              {q.data ? <Badge status={q.data.campaign.status} /> : null}
            </div>

            <div style={{ height: 12 }} />
            <div className="grid two">
              <div className="card">
                <div className="h3">Open rate</div>
                <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
                  <ProgressBar value={stats?.open_rate ?? 0} />
                  <span className="muted">{openRateLabel}</span>
                </div>
                <div style={{ height: 10 }} />
                <div className="h3">Send rate</div>
                <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
                  <ProgressBar value={stats?.send_rate ?? 0} />
                  <span className="muted">{sendRateLabel}</span>
                </div>
                <div style={{ height: 10 }} />
                <div className="muted">
                  Total: <b>{stats?.total ?? 0}</b> · Sent: <b>{stats?.sent ?? 0}</b> · Failed: <b>{stats?.failed ?? 0}</b> · Opened:{" "}
                  <b>{stats?.opened ?? 0}</b>
                </div>
              </div>

              <div className="card">
                <div className="h3">Schedule</div>
                <div className="muted">ISO timestamp (we’ll convert from local datetime).</div>
                <div style={{ height: 8 }} />
                <input
                  className="input"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  disabled={!isDraft}
                />
                <div style={{ height: 10 }} />
                {scheduleM.isError ? <ErrorBox title="Schedule failed" message={scheduleM.error?.error} /> : null}
                {sendM.isError ? <ErrorBox title="Send failed" message={sendM.error?.error} /> : null}
                {deleteM.isError ? <ErrorBox title="Delete failed" message={deleteM.error?.error} /> : null}
              </div>
            </div>

            <div style={{ height: 12 }} />
            <div className="card">
              <div className="h3">Body</div>
              <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
                {q.data?.campaign.body}
              </div>
            </div>
          </div>

          <div style={{ height: 14 }} />

          <div className="card">
            <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
              <div>
                <div className="h2">Recipients</div>
                <div className="muted">{q.data?.recipients.length ?? 0} recipients</div>
              </div>
              {q.isFetching ? <Spinner /> : null}
            </div>
            <div style={{ height: 12 }} />

            <div className="grid">
              {(q.data?.recipients ?? []).map((r) => (
                <div key={r.id} className="card" style={{ boxShadow: "none" }}>
                  <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div className="h2">{r.email}</div>
                      <div className="muted">{r.name}</div>
                    </div>
                    <span className={`badge ${r.status === "pending" ? "draft" : r.status === "sent" ? "sent" : "scheduled"}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="muted" style={{ marginTop: 8 }}>
                    sent_at: {r.sent_at ?? "—"} · opened_at: {r.opened_at ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

