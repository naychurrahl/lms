import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useOrganization } from '../../context/OrganizationContext'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../utils/apiBase'
import { api } from '../../utils/api'

/** screens.md: compose + publish an Announcement scoped to this Course. */
export function AnnouncementComposer() {
  const { courseId } = useParams<{ courseId: string }>()
  const { organizationId } = useOrganization()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handlePublish(): Promise<void> {
    setError(null)
    setIsSubmitting(true)
    try {
      const announcement = await api.post<{ id: string }>(`/organizations/${organizationId}/announcements`, {
        title,
        body,
        publishDate: new Date().toISOString(),
        courseId,
      })
      await api.post(`/organizations/${organizationId}/announcements/${announcement.id}/publish`)
      navigate(`/organizations/${organizationId}/announcements`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">New Announcement</h1>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm text-text-secondary">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary" />
        </label>
        <label className="block">
          <span className="text-sm text-text-secondary">Message</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary" />
        </label>
        <Button onClick={() => void handlePublish()} disabled={isSubmitting}>
          {isSubmitting ? 'Publishing…' : 'Publish'}
        </Button>
      </div>
    </div>
  )
}
