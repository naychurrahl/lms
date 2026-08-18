import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../utils/api'
import { ApiError } from '../utils/apiBase'

interface PublicCourse {
  id: string
  title: string
  code: string
  description: string | null
  difficulty: string | null
  durationMinutes: number | null
}

interface PublicOrganization {
  id: string
  name: string
  selfRegistrationEnabled: boolean
}

/**
 * screens.md's "Public Course Catalog" (`/explore`) — its route is marked
 * illustrative, and api_endpoints.md never actually specified one backing
 * it. The org-scoped public endpoint agreed on (GET
 * /organizations/{organizationId}/courses/public) needs to know which
 * Organization's catalog to show, so this reads that id from the URL rather
 * than the org-less `/explore` screens.md sketched.
 */
export function PublicCatalog() {
  const { organizationId } = useParams<{ organizationId: string }>()
  const [courses, setCourses] = useState<PublicCourse[]>([])
  const [organization, setOrganization] = useState<PublicOrganization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      return
    }

    api.get<PublicOrganization>(`/organizations/${organizationId}/public`).then(setOrganization).catch(() => undefined)
    api
      .get<PublicCourse[]>(`/organizations/${organizationId}/courses/public`)
      .then(setCourses)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Something went wrong.'))
      .finally(() => setIsLoading(false))
  }, [organizationId])

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border px-4 sm:px-8 py-6">
        <h1 className="text-heading-lg font-semibold text-text-primary">{organization?.name ?? 'Course Catalog'}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Browse publicly available courses.{' '}
          <Link to={`/explore/${organizationId}/sign-in`} className="text-primary hover:underline">
            Sign in
          </Link>{' '}
          {organization?.selfRegistrationEnabled && (
            <>
              or{' '}
              <Link to={`/explore/${organizationId}/sign-up`} className="text-primary hover:underline">
                create an account
              </Link>{' '}
            </>
          )}
          to enroll.
        </p>
      </header>

      <main className="p-4 sm:p-8">
        {isLoading && <p className="text-text-secondary">Loading…</p>}
        {error && <p className="text-danger">{error}</p>}

        {!isLoading && !error && courses.length === 0 && (
          <p className="text-text-secondary">No public courses are available right now.</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className="rounded-md border border-border bg-surface p-5">
              <p className="text-xs uppercase tracking-wide text-text-secondary">{course.code}</p>
              <h2 className="mt-1 text-heading-sm font-semibold text-text-primary">{course.title}</h2>
              {course.description && <p className="mt-2 text-sm text-text-secondary">{course.description}</p>}
              <div className="mt-3 flex gap-3 text-xs text-text-secondary">
                {course.difficulty && <span className="capitalize">{course.difficulty}</span>}
                {course.durationMinutes && <span>{course.durationMinutes} min</span>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
