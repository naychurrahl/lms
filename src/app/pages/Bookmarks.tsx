import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { api } from '../utils/api'

interface Bookmark {
  id: string
  lessonId: string
  note: string | null
}

interface Lesson {
  id: string
  moduleId: string
  title: string
}

interface Module {
  id: string
  courseId: string
}

interface Enrollment {
  id: string
  courseId: string
}

interface BookmarkRow extends Bookmark {
  lessonTitle: string
  enrollmentId: string | null
}

/** screens.md: simple list, deep-links back into the Course Player at the bookmarked Lesson. */
export function Bookmarks() {
  const { organizationId } = useOrganization()
  const { user } = useAuth()
  const [rows, setRows] = useState<BookmarkRow[]>([])

  useEffect(() => {
    if (!user) {
      return
    }
    Promise.all([
      api.get<Bookmark[]>(`/organizations/${organizationId}/users/${user.id}/bookmarks`),
      api.get<Enrollment[]>(`/organizations/${organizationId}/users/${user.id}/enrollments`),
    ]).then(async ([bookmarks, enrollments]) => {
      const enrollmentByCourse = new Map(enrollments.map((e) => [e.courseId, e.id]))
      const resolved = await Promise.all(
        bookmarks.map(async (bookmark) => {
          const lesson = await api.get<Lesson>(`/organizations/${organizationId}/lessons/${bookmark.lessonId}`)
          const module = await api.get<Module>(`/organizations/${organizationId}/modules/${lesson.moduleId}`)
          return { ...bookmark, lessonTitle: lesson.title, enrollmentId: enrollmentByCourse.get(module.courseId) ?? null }
        })
      )
      setRows(resolved)
    })
  }, [organizationId, user])

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Bookmarks</h1>

      <div className="mt-6 divide-y divide-border rounded-md border border-border bg-surface">
        {rows.map((row) =>
          row.enrollmentId ? (
            <Link
              key={row.id}
              to={`/organizations/${organizationId}/my-learning/${row.enrollmentId}/play?lesson=${row.lessonId}`}
              className="block px-4 py-3 hover:bg-bg"
            >
              <p className="text-text-primary">{row.lessonTitle}</p>
              {row.note && <p className="text-sm text-text-secondary">{row.note}</p>}
            </Link>
          ) : (
            <div key={row.id} className="px-4 py-3">
              <p className="text-text-primary">{row.lessonTitle}</p>
              {row.note && <p className="text-sm text-text-secondary">{row.note}</p>}
            </div>
          )
        )}
        {rows.length === 0 && <p className="px-4 py-3 text-text-secondary">No bookmarks yet.</p>}
      </div>
    </div>
  )
}
