import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../features/auth/authSlice";
import { apiFetch, type ApiError } from "../lib/api";
import type { CampaignListItem } from "../types";
import { Badge, ErrorBox, Spinner, TopNav } from "../components/ui";

export function CampaignListPage() {
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();

  const q = useQuery<{ campaigns: CampaignListItem[] }, ApiError>({
    queryKey: ["campaigns"],
    queryFn: async () => apiFetch("/campaigns", { token }),
    enabled: !!token,
  });

  return (
    <div className="container">
      <TopNav
        right={
          <>
            <span className="muted">{user?.email}</span>
            <Link to="/campaigns/new" className="btn primary">
              New campaign
            </Link>
            <button className="btn" onClick={() => dispatch(logout())}>
              Logout
            </button>
          </>
        }
      />

      <div style={{ height: 14 }} />

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
          <div>
            <div className="h1">Campaigns</div>
            <div className="muted">Your latest 50 campaigns.</div>
          </div>
          {q.isFetching ? <Spinner label="Refreshing" /> : null}
        </div>

        <div style={{ height: 12 }} />

        {q.isLoading ? (
          <Spinner label="Loading campaigns" />
        ) : q.isError ? (
          <ErrorBox title="Failed to load campaigns" message={q.error?.error} />
        ) : (
          <div className="grid">
            {(q.data?.campaigns ?? []).length === 0 ? (
              <div className="muted">No campaigns yet. Create your first one.</div>
            ) : (
              (q.data?.campaigns ?? []).map((c) => (
                <Link key={c.id} to={`/campaigns/${c.id}`} className="card" style={{ textDecoration: "none" }}>
                  <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div className="h2">{c.name}</div>
                      <div className="muted">{c.subject}</div>
                    </div>
                    <Badge status={c.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

