import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useOrganization } from '../context/OrganizationContext'
import { Button } from '../components/ui/Button'
import { api } from '../utils/api'

interface Conversation {
  id: string
  subject: string | null
}

/** screens.md: Conversations inbox — cross-course, all authenticated. */
export function Conversations() {
  const { organizationId } = useOrganization()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [participantId, setParticipantId] = useState('')
  const [subject, setSubject] = useState('')

  function load(): void {
    api.get<Conversation[]>(`/organizations/${organizationId}/conversations`).then(setConversations)
  }

  useEffect(load, [organizationId])

  async function startConversation(): Promise<void> {
    if (!participantId.trim()) {
      return
    }
    const conversation = await api.post<Conversation>(`/organizations/${organizationId}/conversations`, {
      subject: subject || null,
      participantUserIds: [participantId],
    })
    setConversations((prev) => [conversation, ...prev])
    setParticipantId('')
    setSubject('')
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Messages</h1>

      <div className="mt-6 divide-y divide-border rounded-md border border-border bg-surface">
        {conversations.map((conversation) => (
          <Link
            key={conversation.id}
            to={`/organizations/${organizationId}/messages/${conversation.id}`}
            className="block px-4 py-3 hover:bg-bg"
          >
            <span className="text-text-primary">{conversation.subject ?? 'No subject'}</span>
          </Link>
        ))}
        {conversations.length === 0 && <p className="px-4 py-3 text-text-secondary">No conversations yet.</p>}
      </div>

      <div className="mt-4 space-y-2 rounded-md border border-border bg-surface p-4">
        <p className="text-sm text-text-secondary">Start a conversation</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            placeholder="User ID"
            className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
            className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
          />
          <Button variant="secondary" onClick={() => void startConversation()}>Start</Button>
        </div>
      </div>
    </div>
  )
}
