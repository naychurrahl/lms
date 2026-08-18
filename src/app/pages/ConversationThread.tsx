import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { Button } from '../components/ui/Button'
import { cn } from '../utils/cn'
import { api } from '../utils/api'

interface Message {
  id: string
  senderId: string
  body: string
  createdAt: string
  status: string
}

interface Participant {
  userId: string
  userName: string
}

/** screens.md: Conversation Thread — participant-only. */
export function ConversationThread() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const { organizationId } = useOrganization()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [draft, setDraft] = useState('')

  function load(): void {
    if (!conversationId) {
      return
    }
    api.get<Message[]>(`/organizations/${organizationId}/conversations/${conversationId}/messages`).then(setMessages)
    api.get<Participant[]>(`/organizations/${organizationId}/conversations/${conversationId}/participants`).then(setParticipants)
  }

  useEffect(load, [organizationId, conversationId])

  async function send(): Promise<void> {
    if (!draft.trim() || !conversationId) {
      return
    }
    await api.post(`/organizations/${organizationId}/conversations/${conversationId}/messages`, { body: draft })
    setDraft('')
    load()
  }

  const nameFor = (userId: string) => participants.find((p) => p.userId === userId)?.userName ?? userId

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-2xl flex-col p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">{participants.map((p) => p.userName).join(', ') || 'Conversation'}</h1>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={cn('max-w-[70%] rounded-md p-3', message.senderId === user?.id ? 'ml-auto bg-primary text-white' : 'bg-surface text-text-primary')}>
            {message.senderId !== user?.id && <p className="text-xs opacity-70">{nameFor(message.senderId)}</p>}
            <p>{message.body}</p>
          </div>
        ))}
        {messages.length === 0 && <p className="text-text-secondary">No messages yet.</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void send()}
          placeholder="Write a message…"
          className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-text-primary"
        />
        <Button onClick={() => void send()}>Send</Button>
      </div>
    </div>
  )
}
