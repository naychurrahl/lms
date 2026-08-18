import { useEffect, useState } from 'react'
import { useOrganization } from '../../context/OrganizationContext'
import { Button } from '../../components/ui/Button'
import { api } from '../../utils/api'

interface QuestionBank {
  id: string
  title: string
  description: string | null
}

interface Question {
  id: string
  prompt: string
  type: string
}

/** screens.md: reusable across Courses. A Question is authored under an Assessment Section elsewhere, then linked here by id for reuse ("Pull from Bank"). */
export function QuestionBanks() {
  const { organizationId } = useOrganization()
  const [banks, setBanks] = useState<QuestionBank[]>([])
  const [questionsByBank, setQuestionsByBank] = useState<Map<string, Question[]>>(new Map())
  const [newTitle, setNewTitle] = useState('')
  const [linkQuestionId, setLinkQuestionId] = useState<Map<string, string>>(new Map())

  function load(): void {
    api.get<QuestionBank[]>(`/organizations/${organizationId}/question-banks`).then(async (list) => {
      setBanks(list)
      const entries = await Promise.all(
        list.map(async (b) => [b.id, await api.get<Question[]>(`/organizations/${organizationId}/question-banks/${b.id}/questions`)] as const)
      )
      setQuestionsByBank(new Map(entries))
    })
  }

  useEffect(load, [organizationId])

  async function createBank(): Promise<void> {
    if (!newTitle.trim()) {
      return
    }
    await api.post(`/organizations/${organizationId}/question-banks`, { title: newTitle })
    setNewTitle('')
    load()
  }

  async function linkQuestion(bankId: string): Promise<void> {
    const questionId = linkQuestionId.get(bankId)?.trim()
    if (!questionId) {
      return
    }
    await api.post(`/organizations/${organizationId}/question-banks/${bankId}/questions`, { questionId })
    setLinkQuestionId((prev) => new Map(prev).set(bankId, ''))
    load()
  }

  async function unlinkQuestion(bankId: string, questionId: string): Promise<void> {
    await api.delete(`/organizations/${organizationId}/question-banks/${bankId}/questions/${questionId}`)
    load()
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Question Banks</h1>

      {banks.map((bank) => (
        <div key={bank.id} className="mt-4 rounded-md border border-border bg-surface p-4">
          <h2 className="font-medium text-text-primary">{bank.title}</h2>

          <ul className="mt-2 divide-y divide-border">
            {(questionsByBank.get(bank.id) ?? []).map((question) => (
              <li key={question.id} className="flex items-center justify-between py-2">
                <span className="text-text-primary">{question.prompt}</span>
                <Button variant="ghost" onClick={() => void unlinkQuestion(bank.id, question.id)}>Remove</Button>
              </li>
            ))}
            {(questionsByBank.get(bank.id) ?? []).length === 0 && <p className="py-2 text-text-secondary">No questions linked yet.</p>}
          </ul>

          <div className="mt-2 flex flex-wrap gap-2">
            <input
              value={linkQuestionId.get(bank.id) ?? ''}
              onChange={(e) => setLinkQuestionId((prev) => new Map(prev).set(bank.id, e.target.value))}
              placeholder="Question ID to link"
              className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
            />
            <Button variant="secondary" onClick={() => void linkQuestion(bank.id)}>Link</Button>
          </div>
        </div>
      ))}

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New question bank title"
          className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
        />
        <Button onClick={() => void createBank()}>Create Bank</Button>
      </div>
    </div>
  )
}
