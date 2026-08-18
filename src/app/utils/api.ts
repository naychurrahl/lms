import { API_BASE_URL, ApiError, getAccessToken } from './apiBase'

/**
 * The one place that talks to the backend — every component goes through
 * this, never a raw fetch(), so request_response.md's conventions (camelCase
 * bodies, the {data} / {error} envelopes, If-Match/Idempotency-Key headers)
 * are only implemented once.
 */
export interface RequestOptions {
  /** Optimistic-concurrency precondition — required on PATCH/DELETE of any versioned resource. */
  ifMatch?: string | number
  /** Required on POST actions with real-world side effects (enroll, issue a certificate, …). */
  idempotencyKey?: string
  signal?: AbortSignal
}

async function request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  if (options.ifMatch !== undefined) {
    headers['If-Match'] = String(options.ifMatch)
  }
  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    // authentication.md's Web/Admin Portal session cookie: harmless to send
    // even where frontend/backend don't share a registrable domain (the
    // browser just won't have the cookie to send) — the Authorization
    // header above is what actually authenticates in that case.
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options.signal,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const err = payload.error ?? {}
    throw new ApiError(
      err.category ?? 'infrastructure_failure',
      err.code ?? 'unknown_error',
      err.message ?? 'Something went wrong. Please try again.',
      response.status,
      err.details ?? [],
      err.requestId
    )
  }

  return payload.data as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
}
