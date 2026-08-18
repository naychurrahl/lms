import { useEffect, useState } from 'react'
import { api } from '../utils/api'

interface CourseSummary {
  id: string
  title: string
}

/**
 * Enrollments/Bookmarks/Certificates only embed a courseId (see LearningFunctions
 * map* methods — none join in the Course), so every screen that lists them
 * needs a courseId → title lookup. One fetch of the org's course list, shared
 * via this hook, beats an N+1 fetch per row.
 */
export function useCourseTitles(organizationId: string): Map<string, string> {
  const [titles, setTitles] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    api.get<CourseSummary[]>(`/organizations/${organizationId}/courses`).then((courses) => {
      setTitles(new Map(courses.map((course) => [course.id, course.title])))
    })
  }, [organizationId])

  return titles
}
