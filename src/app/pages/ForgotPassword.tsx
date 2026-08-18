import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { api } from '../utils/api'
import { Button } from '../components/ui/Button'

/**
 * authentication.md: POST /auth/password/forgot always succeeds regardless
 * of whether the email matches an account, so this screen never branches on
 * success vs. "no such user" — there's only one outcome to show.
 */
export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await api.post('/auth/password/forgot', { email })
    } finally {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-sm space-y-4 rounded-md border border-border bg-surface p-4 sm:p-8">
        <h1 className="text-heading-lg font-semibold text-text-primary">Forgot password</h1>

        {isSubmitted ? (
          <p className="text-sm text-text-secondary">
            If an account exists for <span className="text-text-primary">{email}</span>, a reset code is on its way.
            It's valid for 15 minutes.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-text-secondary">
              Enter your email and we'll send you a code to reset your password.
            </p>

            <label className="block space-y-1">
              <span className="text-sm text-text-secondary">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
              />
            </label>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Sending…' : 'Send reset code'}
            </Button>
          </form>
        )}

        <p className="text-sm text-text-secondary">
          <Link to="/" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
