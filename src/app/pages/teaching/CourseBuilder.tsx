import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useOrganization } from '../../context/OrganizationContext'
import { StatusPill } from '../../components/ui/StatusPill'
import { Button } from '../../components/ui/Button'
import { api } from '../../utils/api'

interface Module {
  id: string
  title: string
  displayOrder: number
  status: string
}

interface Lesson {
  id: string
  moduleId: string
  title: string
  lessonType: string
  displayOrder: number
  status: string
}

interface Assessment {
  id: string
  title: string
  status: string
}

const LESSON_TYPES = ['video', 'document', 'audio', 'quiz', 'scorm', 'live_session', 'text']

/** screens.md Wireframe 6 — modules/lessons authoring, plus an entry point into per-Assessment builders. */
export function CourseBuilder() {
  const { courseId } = useParams<{ courseId: string }>()
  const { organizationId } = useOrganization()
  const [modules, setModules] = useState<Module[]>([])
  const [lessonsByModule, setLessonsByModule] = useState<Map<string, Lesson[]>>(new Map())
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [newLessonTitle, setNewLessonTitle] = useState<Map<string, string>>(new Map())
  const [newLessonType, setNewLessonType] = useState<Map<string, string>>(new Map())
  const [newAssessmentTitle, setNewAssessmentTitle] = useState('')

  function load(): void {
    if (!courseId) {
      return
    }
    api.get<Module[]>(`/organizations/${organizationId}/courses/${courseId}/modules`).then(async (mods) => {
      setModules(mods)
      const entries = await Promise.all(
        mods.map(async (m) => [m.id, await api.get<Lesson[]>(`/organizations/${organizationId}/modules/${m.id}/lessons`)] as const)
      )
      setLessonsByModule(new Map(entries))
    })
    api.get<Assessment[]>(`/organizations/${organizationId}/courses/${courseId}/assessments`).then(setAssessments)
  }

  useEffect(load, [organizationId, courseId])

  async function addModule(): Promise<void> {
    if (!newModuleTitle.trim() || !courseId) {
      return
    }
    await api.post(`/organizations/${organizationId}/courses/${courseId}/modules`, { title: newModuleTitle })
    setNewModuleTitle('')
    load()
  }

  async function publishModule(moduleId: string): Promise<void> {
    await api.post(`/organizations/${organizationId}/modules/${moduleId}/publish`)
    load()
  }

  async function addLesson(moduleId: string): Promise<void> {
    const title = newLessonTitle.get(moduleId)?.trim()
    const lessonType = newLessonType.get(moduleId) ?? 'text'
    if (!title) {
      return
    }
    await api.post(`/organizations/${organizationId}/modules/${moduleId}/lessons`, { title, lessonType })
    setNewLessonTitle((prev) => new Map(prev).set(moduleId, ''))
    load()
  }

  async function publishLesson(lessonId: string): Promise<void> {
    await api.post(`/organizations/${organizationId}/lessons/${lessonId}/publish`)
    load()
  }

  async function addAssessment(): Promise<void> {
    if (!newAssessmentTitle.trim() || !courseId) {
      return
    }
    const assessment = await api.post<Assessment>(`/organizations/${organizationId}/courses/${courseId}/assessments`, {
      title: newAssessmentTitle,
      type: 'quiz',
    })
    setAssessments((prev) => [...prev, assessment])
    setNewAssessmentTitle('')
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Course Builder</h1>

      {modules
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((module) => (
          <div key={module.id} className="mt-4 rounded-md border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-text-primary">{module.title}</h2>
              <div className="flex items-center gap-2">
                <StatusPill status={module.status} />
                {module.status === 'draft' && (
                  <Button variant="ghost" onClick={() => void publishModule(module.id)}>Publish</Button>
                )}
              </div>
            </div>

            <ul className="mt-3 divide-y divide-border">
              {(lessonsByModule.get(module.id) ?? [])
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((lesson) => (
                  <li key={lesson.id} className="flex items-center justify-between py-2">
                    <span className="text-text-primary">{lesson.title}</span>
                    <div className="flex items-center gap-2">
                      <StatusPill status={lesson.status} />
                      {lesson.status === 'draft' && (
                        <Button variant="ghost" onClick={() => void publishLesson(lesson.id)}>Publish</Button>
                      )}
                    </div>
                  </li>
                ))}
            </ul>

            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={newLessonTitle.get(module.id) ?? ''}
                onChange={(e) => setNewLessonTitle((prev) => new Map(prev).set(module.id, e.target.value))}
                placeholder="Lesson title"
                className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
              />
              <select
                value={newLessonType.get(module.id) ?? 'text'}
                onChange={(e) => setNewLessonType((prev) => new Map(prev).set(module.id, e.target.value))}
                className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
              >
                {LESSON_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Button variant="secondary" onClick={() => void addLesson(module.id)}>Add Lesson</Button>
            </div>
          </div>
        ))}

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          placeholder="New module title"
          className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
        />
        <Button onClick={() => void addModule()}>Add Module</Button>
      </div>

      <h2 className="mt-8 text-heading-sm font-medium text-text-primary">Assessments</h2>
      <div className="mt-3 divide-y divide-border rounded-md border border-border bg-surface">
        {assessments.map((assessment) => (
          <Link
            key={assessment.id}
            to={`/organizations/${organizationId}/teaching/courses/${courseId}/assessments/${assessment.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-bg"
          >
            <span className="text-text-primary">{assessment.title}</span>
            <StatusPill status={assessment.status} />
          </Link>
        ))}
        {assessments.length === 0 && <p className="px-4 py-3 text-text-secondary">No assessments yet.</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={newAssessmentTitle}
          onChange={(e) => setNewAssessmentTitle(e.target.value)}
          placeholder="New assessment title"
          className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
        />
        <Button variant="secondary" onClick={() => void addAssessment()}>Add Assessment</Button>
      </div>
    </div>
  )
}
