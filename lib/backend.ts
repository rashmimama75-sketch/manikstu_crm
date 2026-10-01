import { NextResponse } from 'next/server';

// Server-only client for the Laravel CRM backend.
//
// When CRM_API_BASE is set (e.g. http://localhost:8000/api), the app's own /api
// routes proxy to that backend and auth runs against its Sanctum tokens. When it
// is unset, the app runs entirely on local sample data (the offline demo), so the
// whole integration is reversible by a single env var.

export const API_BASE = (process.env.CRM_API_BASE ?? '').replace(/\/+$/, '');

/** True when a backend is configured; otherwise the local sample data is used. */
export const usingBackend = (): boolean => API_BASE.length > 0;

/** httpOnly cookie that carries the Sanctum bearer token for backend calls. */
export const TOKEN_COOKIE = 'mk_token';

interface CallOpts {
  method?: string;
  token?: string;
  body?: unknown;
  query?: Record<string, string | null | undefined>;
}

/** Make one call to the backend. Never throws on HTTP status — inspect the Response. */
export async function backendCall(path: string, opts: CallOpts = {}): Promise<Response> {
  const url = new URL(API_BASE + path);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v);
    }
  }
  return fetch(url, {
    method: opts.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });
}

/**
 * Turn a backend Response into the JSON shape this app's own routes return:
 * success bodies and `{error}` bodies pass through; Laravel's `{message, errors}`
 * is flattened to `{error}` so the existing frontend error handling works unchanged.
 */
export async function relay(r: Response, fallback: string): Promise<NextResponse> {
  const body = await r.json().catch(() => ({}));
  const hasError = body && typeof body === 'object' && typeof (body as Record<string, unknown>).error === 'string';
  if (!r.ok && !hasError) {
    return NextResponse.json({ error: backendError(body, fallback) }, { status: r.status });
  }
  return NextResponse.json(body, { status: r.status });
}

/** Pull a human message out of a backend error body ({error} or Laravel {message,errors}). */
export function backendError(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (typeof b.error === 'string') return b.error;
    if (b.errors && typeof b.errors === 'object') {
      const first = Object.values(b.errors as Record<string, unknown>)[0];
      if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
    }
    if (typeof b.message === 'string') return b.message;
  }
  return fallback;
}
