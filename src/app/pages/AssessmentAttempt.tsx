import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useOrganization } from '../context/OrganizationContext'
import { Button } from '../components/ui/Button'
import { api } from '../utils/api'

interface Attempt {
  id: string
  status: string
  expiresAt: string | null
}

interface Section {
  id: string
  title: string
  displayOrder: number
}

interface Question {
  id: string
  assessmentSectionId: string
  type: string
  prompt: string
  points: number
  displayOrder: number
}

interface Option {
  id: string
  label: string | null
  text: string
  displayOrder: number
}

type Answer = { selectedOptionId?: string; responseText?: string }

/** screens.md Wireframe 4 — chromeless: no Layout, so an exam can't be navigated away from by accident via global nav. */
export function AssessmentAttempt() {
  const { courseId, assessmentId, attemptId } = useParams<{ courseId: string; assessmentId: string; attemptId: string }>()
  const { organizationId } = useOrganization()
  const navigate = useNavigate()

  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [questionsBySection, setQuestionsBySection] = useState<Map<string, Question[]>>(new Map())
  const [optionsByQuestion, setOptionsByQuestion] = useState<Map<string, Option[]>>(new Map())
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map())
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!assessmentId || !attemptId) {
      return
    }
    api.get<Attempt>(`/organizations/${organizationId}/attempts/${attemptId}`).then(setAttempt)
    api.get<Section[]>(`/organizations/${organizationId}/assessments/${assessmentId}/sections`).then(async (secs) => {
      setSections(secs)
      const questionEntries = await Promise.all(
        secs.map(async (s) => [s.id, await api.get<Question[]>(`/organizations/${organizationId}/sections/${s.id}/questions`)] as const)
      )
      setQuestionsBySection(new Map(questionEntries))

      const allQuestions = questionEntries.flatMap(([, qs]) => qs)
      const optionEntries = await Promise.all(
        allQuestions
          .filter((q) => q.type === 'multiple_choice' || q.type === 'true_false')
          .map(async (q) => [q.id, await api.get<Option[]>(`/organizations/${organizationId}/questions/${q.id}/options`)] as const)
      )
      setOptionsByQuestion(new Map(optionEntries))
    })
  }, [organizationId, assessmentId, attemptId])

  function setAnswer(questionId: string, answer: Answer): void {
    setAnswers((prev) => new Map(prev).set(questionId, answer))
  }

  async function handleSubmit(): Promise<void> {
    if (!attemptId) {
      return
    }
    setIsSubmitting(true)
    try {
      await api.post(`/organizations/${organizationId}/attempts/${attemptId}/submit`, {
        answers: [...answers.entries()].map(([questionId, answer]) => ({ questionId, ...answer })),
      })
      navigate(`/organizations/${organizationId}/courses/${courseId}/assessments/${assessmentId}/attempt/${attemptId}/result`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!attempt) {
    return null
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-bg p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Assessment</h1>
      {attempt.expiresAt && <p className="mt-1 text-sm text-text-secondary">Time limit ends at {new Date(attempt.expiresAt).toLocaleTimeString()}</p>}

      {sections
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((section) => (
          <div key={section.id} className="mt-8">
            <h2 className="text-heading-sm font-medium text-text-primary">{section.title}</h2>
            {(questionsBySection.get(section.id) ?? [])
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((question) => (
                <div key={question.id} className="mt-4 rounded-md border border-border bg-surface p-4">
                  <p className="text-text-primary">{question.prompt}</p>
                  <p className="text-xs text-text-secondary">{question.points} pts</p>

                  {question.type === 'multiple_choice' || question.type === 'true_false' ? (
                    <div className="mt-3 space-y-2">
                      {(optionsByQuestion.get(question.id) ?? [])
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((option) => (
                          <label key={option.id} className="flex items-center gap-2 text-sm text-text-primary">
                            <input
                              type="radio"
                              name={question.id}
                              checked={answers.get(question.id)?.selectedOptionId === option.id}
                              onChange={() => setAnswer(question.id, { selectedOptionId: option.id })}
                            />
                            {option.text}
                          </label>
                        ))}
                    </div>
                  ) : (
                    <textarea
                      value={answers.get(question.id)?.responseText ?? ''}
                      onChange={(e) => setAnswer(question.id, { responseText: e.target.value })}
                      className="mt-3 w-full rounded-md border border-border bg-bg p-2 text-sm text-text-primary"
                      rows={3}
                    />
                  )}
                </div>
              ))}
          </div>
        ))}

      <Button onClick={() => void handleSubmit()} disabled={isSubmitting} className="mt-8 w-full">
        {isSubmitting ? 'Submitting…' : 'Submit'}
      </Button>
    </div>
  )
}
