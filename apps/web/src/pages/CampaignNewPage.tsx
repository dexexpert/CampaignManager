import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { apiFetch, type ApiError } from "../lib/api";
import { ErrorBox, Spinner, TopNav } from "../components/ui";
import type { CampaignDetail } from "../types";

type CreateCampaignResponse = { campaign: CampaignDetail };

export function CampaignNewPage() {
  const token = useAppSelector((s) => s.auth.token);
  const nav = useNavigate();
  const qc = useQueryClient();

  const [name, setName] = useState("Welcome Campaign");
  const [subject, setSubject] = useState("Welcome!");
  const [body, setBody] = useState("Hello there — this is a demo campaign.");
  const [recipients, setRecipients] = useState("alice@example.com\nbob@example.com\ncarol@example.com");

  const recipientEmails = useMemo(
    () =>
      recipients
        .split(/\r?\n|,/g)
        .map((s) => s.trim())
        .filter(Boolean),
    [recipients],
  );

  const m = useMutation<CreateCampaignResponse, ApiError>({
    mutationFn: async () => {
      return await apiFetch("/campaigns", {
        token,
        body: { name, subject, body, recipientEmails },
      });
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ["campaigns"] });
      nav(`/campaigns/${data.campaign.id}`);
    },
  });

  // auth gate is enforced by the route wrapper; keep mutation code simple here.

  return (
    <div className="container">
      <TopNav
        right={
          <Link className="btn" to="/campaigns">
            Back
          </Link>
        }
      />
      <div style={{ height: 14 }} />
      <div className="card">
        <div className="h1">New campaign</div>
        <div className="muted">Create a draft campaign and attach recipients by email.</div>
        <div style={{ height: 14 }} />

        <div className="grid two">
          <div className="card">
            <div className="h3">Name</div>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            <div style={{ height: 12 }} />
            <div className="h3">Subject</div>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <div style={{ height: 12 }} />
            <div className="h3">Body</div>
            <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <div className="card">
            <div className="h3">Recipient emails</div>
            <div className="muted">One per line (or comma-separated). {recipientEmails.length} detected.</div>
            <div style={{ height: 8 }} />
            <textarea className="textarea" value={recipients} onChange={(e) => setRecipients(e.target.value)} />
            <div style={{ height: 12 }} />
            <div className="row gap">
              <button className="btn primary" onClick={() => m.mutate()} disabled={m.isPending}>
                {m.isPending ? "Creating..." : "Create campaign"}
              </button>
              {m.isPending ? <Spinner /> : null}
            </div>
            <div style={{ height: 10 }} />
            {m.isError ? <ErrorBox title="Create failed" message={m.error?.error} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

