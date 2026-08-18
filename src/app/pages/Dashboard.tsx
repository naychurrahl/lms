import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useCourseTitles } from '../hooks/useCourseTitles'
import { StatusPill } from '../components/ui/StatusPill'
import { api } from '../utils/api'

interface Enrollment {
  id: string
  courseId: string
  status: string
  progress: { completionPercentage: number } | null
}

interface Course {
  id: string
  title: string
  status: string
}

/**
 * screens.md Wireframe 1: same route for both variants, the caller's
 * permission set decides which renders — an Instructor/TA sees their
 * courses and ungraded-work counts, everyone else sees their enrollments.
 */
export function Dashboard() {
  const { user } = useAuth()
  const { organizationId, can, isLoading: permissionsLoading } = useOrganization()
  const isInstructor = can('course.update')

  const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null)
  const [courses, setCourses] = useState<Course[] | null>(null)
  const courseTitles = useCourseTitles(organizationId)

  useEffect(() => {
    if (permissionsLoading || !user) {
      return
    }
    if (isInstructor) {
      api.get<Course[]>(`/organizations/${organizationId}/courses`).then(setCourses)
    } else {
      api.get<Enrollment[]>(`/organizations/${organizationId}/users/${user.id}/enrollments`).then(setEnrollments)
    }
  }, [organizationId, user, isInstructor, permissionsLoading])

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Welcome back{user ? `, ${user.name}` : ''}.</h1>

      {isInstructor ? (
        <div className="mt-6">
          <h2 className="text-heading-sm font-medium text-text-primary">Your courses</h2>
          <div className="mt-3 divide-y divide-border rounded-md border border-border bg-surface">
            {courses?.map((course) => (
              <Link
                key={course.id}
                to={`/organizations/${organizationId}/teaching/courses/${course.id}/gradebook`}
                className="flex items-center justify-between px-4 py-3 hover:bg-bg"
              >
                <span className="text-text-primary">{course.title}</span>
                <StatusPill status={course.status} />
              </Link>
            ))}
            {courses?.length === 0 && <p className="px-4 py-3 text-text-secondary">No courses yet.</p>}
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <h2 className="text-heading-sm font-medium text-text-primary">Your enrollments</h2>
          <div className="mt-3 divide-y divide-border rounded-md border border-border bg-surface">
            {enrollments?.map((enrollment) => (
              <Link
                key={enrollment.id}
                to={`/organizations/${organizationId}/my-learning/${enrollment.id}/play`}
                className="flex items-center justify-between px-4 py-3 hover:bg-bg"
              >
                <span className="text-text-primary">{courseTitles.get(enrollment.courseId) ?? 'Course'}</span>
                <div className="flex items-center gap-3">
                  {enrollment.progress && (
                    <span className="text-sm text-text-secondary">{Math.round(enrollment.progress.completionPercentage)}%</span>
                  )}
                  <StatusPill status={enrollment.status} />
                </div>
              </Link>
            ))}
            {enrollments?.length === 0 && <p className="px-4 py-3 text-text-secondary">No enrollments yet — visit the Catalog to get started.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
