import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { api } from '../utils/api'
import { Button } from '../components/ui/Button'
import { StatusPill } from '../components/ui/StatusPill'
import { ApiError } from '../utils/apiBase'

interface CertificateVerification {
  certificateNumber: string
  status: string
  valid: boolean
  issueDate: string
  courseId: string
}

/** wireframes.md #12 — public, unauthenticated (GET /certificates/verify/{verificationCode}). */
export function VerifyCertificate() {
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code') ?? '')
  const [result, setResult] = useState<CertificateVerification | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setError(null)
    setResult(null)
    setIsSubmitting(true)

    try {
      setResult(await api.get<CertificateVerification>(`/certificates/verify/${encodeURIComponent(code)}`))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-sm space-y-4 rounded-md border border-border bg-surface p-4 sm:p-8">
        <h1 className="text-heading-lg font-semibold text-text-primary">Verify a certificate</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm text-text-secondary">Verification code</span>
            <input
              type="text"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-text-primary"
            />
          </label>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Checking…' : 'Verify'}
          </Button>
        </form>

        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {result && (
          <div className="space-y-2 rounded-md border border-border bg-bg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Status</span>
              <StatusPill status={result.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Certificate #</span>
              <span className="font-mono text-sm text-text-primary">{result.certificateNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Issued</span>
              <span className="text-sm text-text-primary">{result.issueDate}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
