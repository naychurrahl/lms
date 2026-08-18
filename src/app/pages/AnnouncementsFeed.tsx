import { useEffect, useState } from 'react'
import { useOrganization } from '../context/OrganizationContext'
import { api } from '../utils/api'

interface Announcement {
  id: string
  title: string
  body: string
  publishDate: string
  status: string
}

/** screens.md: cross-course feed, newest first. */
export function AnnouncementsFeed() {
  const { organizationId } = useOrganization()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    api.get<Announcement[]>(`/organizations/${organizationId}/announcements`).then((all) => setAnnouncements(all.filter((a) => a.status === 'published')))
  }, [organizationId])

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <h1 className="text-heading-lg font-semibold text-text-primary">Announcements</h1>

      <div className="mt-6 space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-text-primary">{announcement.title}</h2>
              <span className="text-sm text-text-secondary">{new Date(announcement.publishDate).toLocaleDateString()}</span>
            </div>
            <p className="mt-2 text-text-secondary">{announcement.body}</p>
          </div>
        ))}
        {announcements.length === 0 && <p className="text-text-secondary">No announcements yet.</p>}
      </div>
    </div>
  )
}
