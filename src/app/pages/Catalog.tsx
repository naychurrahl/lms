import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useOrganization } from '../context/OrganizationContext'
import { StatusPill } from '../components/ui/StatusPill'
import { api } from '../utils/api'

interface Course {
  id: string
  title: string
  code: string
  description: string | null
  difficulty: string | null
  status: string
}

/** screens.md Wireframe 2 — the authenticated counterpart of PublicCatalog.tsx, scoped to one Organization's published Courses. */
export function Catalog() {
  const { organizationId } = useOrganization()
  const [courses, setCourses] = useState<Course[] | null>(null)

  useEffect(() => {
    api.get<Course[]>(`/organizations/${organizationId}/courses`).then((all) => setCourses(all.filter((c) => c.status === 'published')))
  }, [organizationId])

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Course Catalog</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses?.map((course) => (
          <Link
            key={course.id}
            to={`/organizations/${organizationId}/catalog/${course.id}`}
            className="block rounded-md border border-border bg-surface p-4 hover:border-primary"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-medium text-text-primary">{course.title}</h2>
              <StatusPill status={course.status} />
            </div>
            <p className="mt-1 text-sm text-text-secondary">{course.code}</p>
            {course.description && <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{course.description}</p>}
          </Link>
        ))}
        {courses?.length === 0 && <p className="text-text-secondary">No published courses yet.</p>}
      </div>
    </div>
  )
}
