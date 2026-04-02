import { Link } from "react-router-dom";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="row center muted">
      <div className="spinner" aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </div>
  );
}

export function ErrorBox({ title, message }: { title: string; message?: string }) {
  return (
    <div className="card error">
      <div className="h3">{title}</div>
      <div className="muted">{message ?? "Something went wrong."}</div>
    </div>
  );
}

export function TopNav({ right }: { right?: React.ReactNode }) {
  return (
    <div className="topnav">
      <div className="row gap">
        <Link to="/campaigns" className="brand">
          Mini Campaign Manager
        </Link>
      </div>
      <div className="row gap">{right}</div>
    </div>
  );
}

export function Badge({ status }: { status: "draft" | "scheduled" | "sending" | "sent" }) {
  return <span className={`badge ${status}`}>{status}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="progressFill" style={{ width: `${pct * 100}%` }} />
    </div>
  );
}

