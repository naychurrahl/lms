import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api } from '../utils/api'
import { Button } from '../components/ui/Button'
import { ApiError } from '../utils/apiBase'

export function ResetPassword() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/auth/password/reset', { resetToken: token, newPassword })
      navigate('/', { state: { justReset: true } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-md border border-border bg-surface p-4 sm:p-8">
        <h1 className="text-heading-lg font-semibold text-text-primary">Reset password</h1>

        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <label className="block space-y-1">
          <span className="text-sm text-text-secondary">New password</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-text-secondary">Confirm new password</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
          />
        </label>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Resetting…' : 'Reset password'}
        </Button>

        <p className="text-sm text-text-secondary">
          <Link to="/" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
