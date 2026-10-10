/** Thin client for /api/sync (server/sync.ts). Network failures resolve to { offline: true }. */

export interface RemoteDoc {
  code: string;
  rev: number;
  updatedAt: string;
  games: Record<string, unknown>;
}

export type ApiResult<T> =
  { offline: true } | { offline: false; status: number; body: T & { error?: string; current?: RemoteDoc } };

export const SYNC_URL = '/api/sync';

async function call<T>(method: string, query: string, body?: unknown): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${SYNC_URL}${query}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    return { offline: true };
  }
  let parsed: unknown = {};
  try {
    parsed = await res.json();
  } catch {
    // Non-JSON error page (e.g. a proxy); treat as an error with no message.
  }
  return {
    offline: false,
    status: res.status,
    body: (parsed ?? {}) as T & { error?: string; current?: RemoteDoc },
  };
}

const q = (code: string) => `?code=${encodeURIComponent(code)}`;

export const syncApi = {
  create: (games: Record<string, unknown>) =>
    call<{ code: string; rev: number; updatedAt: string }>('POST', '', { games }),
  get: (code: string) => call<RemoteDoc>('GET', q(code)),
  put: (code: string, baseRev: number, games: Record<string, unknown>) =>
    call<{ rev: number; updatedAt: string }>('PUT', q(code), { baseRev, games }),
};
