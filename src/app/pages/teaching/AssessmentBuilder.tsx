import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useOrganization } from '../../context/OrganizationContext'
import { StatusPill } from '../../components/ui/StatusPill'
import { Button } from '../../components/ui/Button'
import { api } from '../../utils/api'

interface Assessment {
  id: string
  title: string
  status: string
}

interface Section {
  id: string
  title: string
  displayOrder: number
}

interface Question {
  id: string
  type: string
  prompt: string
  points: number
  status: string
  version: number
}

interface Option {
  id: string
  text: string
  isCorrect: boolean
}

const QUESTION_TYPES = ['multiple_choice', 'true_false', 'short_answer', 'essay', 'matching']

/** screens.md: section/question authoring; a real "Pull from Bank" flow (surfacing Question Bank items) is a reasonable follow-up once this baseline authoring path is in place. */
export function AssessmentBuilder() {
  const { courseId, assessmentId } = useParams<{ courseId: string; assessmentId: string }>()
  const { organizationId } = useOrganization()

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [questionsBySection, setQuestionsBySection] = useState<Map<string, Question[]>>(new Map())
  const [optionsByQuestion, setOptionsByQuestion] = useState<Map<string, Option[]>>(new Map())
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newQuestion, setNewQuestion] = useState<Map<string, { prompt: string; type: string }>>(new Map())
  const [newOptionText, setNewOptionText] = useState<Map<string, string>>(new Map())

  function load(): void {
    if (!courseId || !assessmentId) {
      return
    }
    api.get<Assessment>(`/organizations/${organizationId}/courses/${courseId}/assessments/${assessmentId}`).then(setAssessment)
    api.get<Section[]>(`/organizations/${organizationId}/assessments/${assessmentId}/sections`).then(async (secs) => {
      setSections(secs)
      const qEntries = await Promise.all(
        secs.map(async (s) => [s.id, await api.get<Question[]>(`/organizations/${organizationId}/sections/${s.id}/questions`)] as const)
      )
      setQuestionsBySection(new Map(qEntries))
      const oEntries = await Promise.all(
        qEntries.flatMap(([, qs]) => qs).map(async (q) => [q.id, await api.get<Option[]>(`/organizations/${organizationId}/questions/${q.id}/options`)] as const)
      )
      setOptionsByQuestion(new Map(oEntries))
    })
  }

  useEffect(load, [organizationId, courseId, assessmentId])

  async function publish(): Promise<void> {
    if (!courseId || !assessmentId) {
      return
    }
    const updated = await api.post<Assessment>(`/organizations/${organizationId}/courses/${courseId}/assessments/${assessmentId}/publish`)
    setAssessment(updated)
  }

  async function addSection(): Promise<void> {
    if (!newSectionTitle.trim() || !assessmentId) {
      return
    }
    await api.post(`/organizations/${organizationId}/assessments/${assessmentId}/sections`, { title: newSectionTitle, displayOrder: sections.length + 1 })
    setNewSectionTitle('')
    load()
  }

  async function addQuestion(sectionId: string): Promise<void> {
    const draft = newQuestion.get(sectionId)
    if (!draft?.prompt.trim()) {
      return
    }
    await api.post(`/organizations/${organizationId}/sections/${sectionId}/questions`, {
      type: draft.type,
      prompt: draft.prompt,
      points: 1,
      displayOrder: (questionsBySection.get(sectionId)?.length ?? 0) + 1,
    })
    setNewQuestion((prev) => new Map(prev).set(sectionId, { prompt: '', type: draft.type }))
    load()
  }

  async function activateQuestion(question: Question): Promise<void> {
    await api.patch(`/organizations/${organizationId}/questions/${question.id}`, { status: 'active' }, { ifMatch: question.version })
    load()
  }

  async function addOption(questionId: string): Promise<void> {
    const text = newOptionText.get(questionId)?.trim()
    if (!text) {
      return
    }
    const existing = optionsByQuestion.get(questionId) ?? []
    await api.post(`/organizations/${organizationId}/questions/${questionId}/options`, { text, isCorrect: false, displayOrder: existing.length + 1 })
    setNewOptionText((prev) => new Map(prev).set(questionId, ''))
    load()
  }

  if (!assessment) {
    return null
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-lg font-semibold text-text-primary">{assessment.title}</h1>
        <div className="flex items-center gap-2">
          <StatusPill status={assessment.status} />
          {assessment.status === 'draft' && <Button onClick={() => void publish()}>Publish</Button>}
        </div>
      </div>

      {sections
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((section) => (
          <div key={section.id} className="mt-4 rounded-md border border-border bg-surface p-4">
            <h2 className="font-medium text-text-primary">{section.title}</h2>

            {(questionsBySection.get(section.id) ?? []).map((question) => (
              <div key={question.id} className="mt-3 rounded-md border border-border bg-bg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-text-primary">{question.prompt}</p>
                  <div className="flex items-center gap-2">
                    <StatusPill status={question.status} />
                    {question.status === 'draft' && (
                      <Button variant="ghost" onClick={() => void activateQuestion(question)}>Activate</Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-text-secondary">{question.type}</p>

                {(question.type === 'multiple_choice' || question.type === 'true_false') && (
                  <div className="mt-2 space-y-1">
                    {(optionsByQuestion.get(question.id) ?? []).map((option) => (
                      <p key={option.id} className="text-sm text-text-secondary">
                        {option.isCorrect ? '✓' : '·'} {option.text}
                      </p>
                    ))}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input
                        value={newOptionText.get(question.id) ?? ''}
                        onChange={(e) => setNewOptionText((prev) => new Map(prev).set(question.id, e.target.value))}
                        placeholder="Option text"
                        className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
                      />
                      <Button variant="secondary" onClick={() => void addOption(question.id)}>Add Option</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={newQuestion.get(section.id)?.prompt ?? ''}
                onChange={(e) => setNewQuestion((prev) => new Map(prev).set(section.id, { prompt: e.target.value, type: prev.get(section.id)?.type ?? 'multiple_choice' }))}
                placeholder="Question prompt"
                className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
              />
              <select
                value={newQuestion.get(section.id)?.type ?? 'multiple_choice'}
                onChange={(e) => setNewQuestion((prev) => new Map(prev).set(section.id, { prompt: prev.get(section.id)?.prompt ?? '', type: e.target.value }))}
                className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Button variant="secondary" onClick={() => void addQuestion(section.id)}>Add Question</Button>
            </div>
          </div>
        ))}

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          placeholder="New section title"
          className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
        />
        <Button onClick={() => void addSection()}>Add Section</Button>
      </div>
    </div>
  )
}
