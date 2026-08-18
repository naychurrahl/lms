export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? ''

let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export interface ApiErrorDetail {
  field: string
  issue: string
}

/** Mirrors errors.md's error envelope exactly — category, code, message, details, requestId. */
export class ApiError extends Error {
  constructor(
    public readonly category: string,
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details: ApiErrorDetail[] = [],
    public readonly requestId?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
