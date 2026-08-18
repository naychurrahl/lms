/**
 * Remembers which Organization the caller was last actively using, so a
 * session that expires deep in the app (or a bare, contextless visit to `/`)
 * has somewhere better than a generic sign-in to send them back to — there
 * is no single global sign-in page anymore, every entry point is
 * Organization-scoped (`/explore/:organizationId/sign-in`).
 */
const STORAGE_KEY = 'lms.lastOrganizationId'

export function rememberLastOrganization(organizationId: string): void {
  localStorage.setItem(STORAGE_KEY, organizationId)
}

export function getLastOrganization(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}
