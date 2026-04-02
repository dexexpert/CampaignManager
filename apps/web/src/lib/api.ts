import type { AuthUser } from "../features/auth/authSlice";

export type ApiError = { error: string; details?: Array<{ path: string; message: string }> };

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function parseError(res: Response): Promise<ApiError> {
  try {
    return (await res.json()) as ApiError;
  } catch {
    return { error: `http_${res.status}` };
  }
}

export async function apiFetch<T>(
  path: string,
  opts: { token?: string | null; method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: {
      "content-type": "application/json",
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type LoginResponse = { token: string; user: AuthUser };

