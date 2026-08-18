import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { Button } from './ui/Button'
import { cn } from '../utils/cn'

/** Any one of these unlocks the Teaching section — screens.md scopes it to Instructor/TA/Content Author, and there's no "my role name" self-service endpoint, only permission keys. */
const TEACHING_PERMISSIONS = ['course.update', 'module.create', 'assessment.create', 'content_item.create', 'rubric.create']

function NavItem({ to, label, onNavigate }: { to: string; label: string; onNavigate: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg hover:text-text-primary',
          isActive && 'bg-bg text-text-primary'
        )
      }
    >
      {label}
    </NavLink>
  )
}

/**
 * The global chrome from information_architecture.md: org switcher (still a
 * single-Organization stand-in — see RedirectToActiveOrganization), nav
 * links per section, notification bell, profile menu. Below md, the nav
 * collapses behind a hamburger toggle instead of wrapping/overflowing.
 */
export function Layout() {
  const { user, logout } = useAuth()
  const { organizationId, can } = useOrganization()
  const base = `/organizations/${organizationId}`
  const canTeach = TEACHING_PERMISSIONS.some(can)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              className="rounded-md p-2 text-text-primary hover:bg-bg md:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
            <span className="font-semibold text-text-primary">LMS</span>
            <nav className="hidden items-center gap-1 md:flex">
              <NavItem to={`${base}/dashboard`} label="Dashboard" onNavigate={closeMenu} />
              <NavItem to={`${base}/catalog`} label="Catalog" onNavigate={closeMenu} />
              <NavItem to={`${base}/my-learning`} label="My Learning" onNavigate={closeMenu} />
              {canTeach && <NavItem to={`${base}/teaching/courses`} label="Teaching" onNavigate={closeMenu} />}
              <NavItem to={`${base}/messages`} label="Messages" onNavigate={closeMenu} />
              <NavItem to={`${base}/announcements`} label="Announcements" onNavigate={closeMenu} />
            </nav>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <NavLink to={`${base}/notifications`} className="text-text-secondary hover:text-text-primary" aria-label="Notifications">
              Notifications
            </NavLink>
            <NavLink to={`${base}/account/profile`} className="max-w-[16ch] truncate text-sm text-text-secondary hover:text-text-primary">
              {user?.email}
            </NavLink>
            <Button variant="ghost" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="mt-3 flex flex-col gap-1 border-t border-border pt-3 md:hidden">
            <NavItem to={`${base}/dashboard`} label="Dashboard" onNavigate={closeMenu} />
            <NavItem to={`${base}/catalog`} label="Catalog" onNavigate={closeMenu} />
            <NavItem to={`${base}/my-learning`} label="My Learning" onNavigate={closeMenu} />
            {canTeach && <NavItem to={`${base}/teaching/courses`} label="Teaching" onNavigate={closeMenu} />}
            <NavItem to={`${base}/messages`} label="Messages" onNavigate={closeMenu} />
            <NavItem to={`${base}/announcements`} label="Announcements" onNavigate={closeMenu} />
            <NavItem to={`${base}/notifications`} label="Notifications" onNavigate={closeMenu} />
            <NavItem to={`${base}/account/profile`} label={user?.email ?? 'Account'} onNavigate={closeMenu} />
            <Button variant="ghost" className="justify-start" onClick={() => void logout()}>
              Sign out
            </Button>
          </nav>
        )}
      </header>
      <main className="overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
