import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { StatusPill } from '../components/ui/StatusPill'
import { api } from '../utils/api'

interface LearningPath {
  id: string
  title: string
  description: string | null
  status: string
}

interface LearningPathCourse {
  courseId: string
  displayOrder: number
  courseTitle: string
}

interface Enrollment {
  courseId: string
  status: string
}

/** screens.md: ordered list of member Courses with per-course enrollment state. */
export function LearningPathDetail() {
  const { pathId } = useParams<{ pathId: string }>()
  const { organizationId } = useOrganization()
  const { user } = useAuth()

  const [path, setPath] = useState<LearningPath | null>(null)
  const [courses, setCourses] = useState<LearningPathCourse[]>([])
  const [enrollmentByCourse, setEnrollmentByCourse] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    if (!pathId || !user) {
      return
    }
    api.get<LearningPath>(`/organizations/${organizationId}/learning-paths/${pathId}`).then(setPath)
    api.get<LearningPathCourse[]>(`/organizations/${organizationId}/learning-paths/${pathId}/courses`).then(setCourses)
    api
      .get<Enrollment[]>(`/organizations/${organizationId}/users/${user.id}/enrollments`)
      .then((enrollments) => setEnrollmentByCourse(new Map(enrollments.map((e) => [e.courseId, e.status]))))
  }, [organizationId, pathId, user])

  if (!path) {
    return null
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">{path.title}</h1>
      {path.description && <p className="mt-2 text-text-secondary">{path.description}</p>}

      <ol className="mt-6 divide-y divide-border rounded-md border border-border bg-surface">
        {courses
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((course, index) => (
            <li key={course.courseId} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary">{index + 1}.</span>
                <Link to={`/organizations/${organizationId}/catalog/${course.courseId}`} className="text-text-primary hover:underline">
                  {course.courseTitle}
                </Link>
              </div>
              <StatusPill status={enrollmentByCourse.get(course.courseId) ?? 'not_started'} />
            </li>
          ))}
        {courses.length === 0 && <li className="px-4 py-3 text-text-secondary">No courses in this path yet.</li>}
      </ol>
    </div>
  )
}
