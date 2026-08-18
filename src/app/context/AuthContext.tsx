import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../utils/api'
import { setAccessToken } from '../utils/apiBase'

export interface CurrentUser {
  id: string
  name: string
  email: string
  username: string | null
  status: string
  organizationIds: string[]
}

interface AuthContextValue {
  user: CurrentUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<CurrentUser>
  register: (
    organizationId: string,
    name: string,
    email: string,
    password: string,
    roleKind: 'student' | 'lecturer'
  ) => Promise<{ pendingLecturerApproval: boolean }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// authentication.md's HttpOnly/Secure/SameSite cookie is now set by the
// backend on every login (Auth::issueSessionCookie()) and sent automatically
// by the browser (api.ts's `credentials: 'include'`) — but it only reaches
// the server when frontend and backend share a registrable domain, which
// local dev's mismatched hostnames don't. localStorage + the Authorization
// header stay as the fallback that actually works there (and for Mobile/API
// consumers, who use the header by design either way).
const TOKEN_STORAGE_KEY = 'lms.accessToken'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!stored) {
      setIsLoading(false)
      return
    }

    setAccessToken(stored)
    api
      .get<CurrentUser>('/me')
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setAccessToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string): Promise<CurrentUser> {
    const session = await api.post<{ accessToken: string; expiresIn: number }>('/auth/login', { email, password })

    localStorage.setItem(TOKEN_STORAGE_KEY, session.accessToken)
    setAccessToken(session.accessToken)
    const currentUser = await api.get<CurrentUser>('/me')
    setUser(currentUser)

    return currentUser
  }

  async function register(
    organizationId: string,
    name: string,
    email: string,
    password: string,
    roleKind: 'student' | 'lecturer'
  ): Promise<{ pendingLecturerApproval: boolean }> {
    const session = await api.post<{ accessToken: string; expiresIn: number; pendingLecturerApproval: boolean }>(
      `/organizations/${organizationId}/registrations`,
      { name, email, password, roleKind }
    )

    localStorage.setItem(TOKEN_STORAGE_KEY, session.accessToken)
    setAccessToken(session.accessToken)
    setUser(await api.get<CurrentUser>('/me'))

    return { pendingLecturerApproval: session.pendingLecturerApproval }
  }

  async function logout(): Promise<void> {
    await api.post('/auth/logout').catch(() => undefined)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setAccessToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
