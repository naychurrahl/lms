import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { useOrganization } from '../../context/OrganizationContext'
import { StatusPill } from '../../components/ui/StatusPill'
import { Button } from '../../components/ui/Button'
import { api } from '../../utils/api'

interface Course {
  id: string
  title: string
  code: string
  primaryInstructorId: string | null
  status: string
}

/**
 * screens.md: Courses "filtered to course_instructors" — there's no dedicated
 * "my courses" endpoint, so this filters the org's Course list by
 * primaryInstructorId client-side. Courses where this Instructor is only a
 * secondary/TA entry in course_instructors (not primary) won't show up here;
 * a dedicated endpoint would be needed to cover that case.
 */
export function MyCourses() {
  const { organizationId } = useOrganization()
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }
    api.get<Course[]>(`/organizations/${organizationId}/courses`).then((all) => setCourses(all.filter((c) => c.primaryInstructorId === user.id)))
  }, [organizationId, user])

  async function handleCreate(): Promise<void> {
    if (!title.trim() || !code.trim() || !user) {
      return
    }
    const course = await api.post<Course>(`/organizations/${organizationId}/courses`, { title, code, primaryInstructorId: user.id })
    setCourses((prev) => [...prev, course])
    setTitle('')
    setCode('')
    setIsCreating(false)
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-lg font-semibold text-text-primary">My Courses</h1>
        <Button onClick={() => setIsCreating((v) => !v)}>New Course</Button>
      </div>

      {isCreating && (
        <div className="mt-4 flex flex-col gap-2 rounded-md border border-border bg-surface p-4 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="text-sm text-text-secondary">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary" />
          </label>
          <label className="sm:w-32">
            <span className="text-sm text-text-secondary">Code</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text-primary" />
          </label>
          <Button onClick={() => void handleCreate()}>Create</Button>
        </div>
      )}

      <div className="mt-6 divide-y divide-border rounded-md border border-border bg-surface">
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/organizations/${organizationId}/teaching/courses/${course.id}/settings`}
            className="flex items-center justify-between px-4 py-3 hover:bg-bg"
          >
            <div>
              <p className="text-text-primary">{course.title}</p>
              <p className="text-sm text-text-secondary">{course.code}</p>
            </div>
            <StatusPill status={course.status} />
          </Link>
        ))}
        {courses.length === 0 && <p className="px-4 py-3 text-text-secondary">No courses yet.</p>}
      </div>
    </div>
  )
}
