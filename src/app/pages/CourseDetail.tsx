import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { StatusPill } from '../components/ui/StatusPill'
import { Button } from '../components/ui/Button'
import { ApiError } from '../utils/apiBase'
import { api } from '../utils/api'

interface Course {
  id: string
  title: string
  code: string
  description: string | null
  difficulty: string | null
  durationMinutes: number | null
  status: string
}

interface Module {
  id: string
  title: string
  displayOrder: number
  status: string
}

interface Instructor {
  userId: string
  roleInCourse: string
  name: string
}

interface Enrollment {
  id: string
  courseId: string
  status: string
}

/** screens.md: syllabus/modules list, read-only, plus an Enroll CTA — pre-enrollment view of the same Course the Learner sees post-enrollment in the Course Player. */
export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>()
  const { organizationId } = useOrganization()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [myEnrollment, setMyEnrollment] = useState<Enrollment | null>(null)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId || !user) {
      return
    }
    api.get<Course>(`/organizations/${organizationId}/courses/${courseId}`).then(setCourse)
    api.get<Module[]>(`/organizations/${organizationId}/courses/${courseId}/modules`).then(setModules)
    api.get<Instructor[]>(`/organizations/${organizationId}/courses/${courseId}/instructors`).then(setInstructors)
    api
      .get<Enrollment[]>(`/organizations/${organizationId}/users/${user.id}/enrollments`)
      .then((enrollments) => setMyEnrollment(enrollments.find((e) => e.courseId === courseId) ?? null))
  }, [organizationId, courseId, user])

  async function handleEnroll(): Promise<void> {
    if (!courseId) {
      return
    }
    setError(null)
    setIsEnrolling(true)
    try {
      const enrollment = await api.post<Enrollment>(
        `/organizations/${organizationId}/enrollments`,
        { courseId },
        { idempotencyKey: crypto.randomUUID() }
      )
      setMyEnrollment(enrollment)
      navigate(`/organizations/${organizationId}/my-learning/${enrollment.id}/play`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsEnrolling(false)
    }
  }

  if (!course) {
    return null
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-heading-lg font-semibold text-text-primary">{course.title}</h1>
          <p className="mt-1 text-sm text-text-secondary">{course.code}</p>
        </div>
        <StatusPill status={course.status} />
      </div>

      {course.description && <p className="mt-4 text-text-secondary">{course.description}</p>}

      {instructors.length > 0 && (
        <p className="mt-4 text-sm text-text-secondary">
          Taught by {instructors.map((i) => i.name).join(', ')}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-4">
        {myEnrollment ? (
          <Link to={`/organizations/${organizationId}/my-learning/${myEnrollment.id}/play`}>
            <Button>Continue learning</Button>
          </Link>
        ) : (
          <Button onClick={() => void handleEnroll()} disabled={isEnrolling}>
            {isEnrolling ? 'Enrolling…' : 'Enroll'}
          </Button>
        )}
      </div>

      <h2 className="mt-8 text-heading-sm font-medium text-text-primary">Syllabus</h2>
      <ol className="mt-3 divide-y divide-border rounded-md border border-border bg-surface">
        {modules
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((module) => (
            <li key={module.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-text-primary">{module.title}</span>
              <StatusPill status={module.status} />
            </li>
          ))}
        {modules.length === 0 && <li className="px-4 py-3 text-text-secondary">No modules published yet.</li>}
      </ol>
    </div>
  )
}
