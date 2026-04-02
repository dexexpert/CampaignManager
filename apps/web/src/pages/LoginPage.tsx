import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { apiFetch, type LoginResponse, type ApiError } from "../lib/api";
import { useAppDispatch } from "../app/hooks";
import { setAuth } from "../features/auth/authSlice";
import { ErrorBox, Spinner, TopNav } from "../components/ui";

export function LoginPage() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password");

  const mutation = useMutation<LoginResponse, ApiError>({
    mutationFn: async () => {
      return await apiFetch<LoginResponse>("/auth/login", { body: { email, password } });
    },
    onSuccess: (data) => {
      dispatch(setAuth({ token: data.token, user: data.user }));
      nav("/campaigns");
    },
  });

  return (
    <div className="container">
      <TopNav />
      <div style={{ height: 14 }} />
      <div className="grid two">
        <div className="card">
          <div className="h1">Login</div>
          <div className="muted">Use your API account to manage campaigns.</div>
          <div style={{ height: 14 }} />

          <div className="grid">
            <div>
              <div className="h3">Email</div>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <div className="h3">Password</div>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="row gap">
              <button className="btn primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? "Signing in..." : "Sign in"}
              </button>
              {mutation.isPending ? <Spinner /> : null}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="h2">Demo</div>
          <div className="muted">
            If you ran the seed, you can log in with <code>demo@example.com</code> / <code>password</code>.
          </div>
          <div style={{ height: 14 }} />
          {mutation.isError ? (
            <ErrorBox title="Login failed" message={mutation.error?.error ?? "invalid_credentials"} />
          ) : (
            <div className="muted">
              Tip: ensure API is running on <code>VITE_API_URL</code> and migrations are applied.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

