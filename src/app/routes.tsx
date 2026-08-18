import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RedirectToActiveOrganization } from './components/RedirectToActiveOrganization'
import { OrganizationProvider } from './context/OrganizationContext'
import { OrgSignIn } from './pages/OrgSignIn'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { AcceptInvitation } from './pages/AcceptInvitation'
import { PublicCatalog } from './pages/PublicCatalog'
import { SelfRegister } from './pages/SelfRegister'
import { VerifyCertificate } from './pages/VerifyCertificate'
import { Dashboard } from './pages/Dashboard'
import { Catalog } from './pages/Catalog'
import { CourseDetail } from './pages/CourseDetail'
import { LearningPathDetail } from './pages/LearningPathDetail'
import { MyLearning } from './pages/MyLearning'
import { CoursePlayer } from './pages/CoursePlayer'
import { Bookmarks } from './pages/Bookmarks'
import { AssessmentAttempt } from './pages/AssessmentAttempt'
import { AssessmentResult } from './pages/AssessmentResult'
import { Achievements } from './pages/Achievements'
import { CertificateDetail } from './pages/CertificateDetail'
import { MyCourses } from './pages/teaching/MyCourses'
import { CourseBuilder } from './pages/teaching/CourseBuilder'
import { CourseSettings } from './pages/teaching/CourseSettings'
import { Roster } from './pages/teaching/Roster'
import { AssessmentBuilder } from './pages/teaching/AssessmentBuilder'
import { QuestionBanks } from './pages/teaching/QuestionBanks'
import { ContentLibrary } from './pages/teaching/ContentLibrary'
import { Rubrics } from './pages/teaching/Rubrics'
import { Gradebook } from './pages/teaching/Gradebook'
import { SubmissionGrading } from './pages/teaching/SubmissionGrading'
import { CourseDiscussions } from './pages/teaching/CourseDiscussions'
import { AnnouncementComposer } from './pages/teaching/AnnouncementComposer'
import { CourseAnalytics } from './pages/teaching/CourseAnalytics'
import { CourseDiscussion } from './pages/CourseDiscussion'
import { Conversations } from './pages/Conversations'
import { ConversationThread } from './pages/ConversationThread'
import { AnnouncementsFeed } from './pages/AnnouncementsFeed'
import { Profile } from './pages/account/Profile'
import { Security } from './pages/account/Security'
import { NotificationPreferences } from './pages/account/NotificationPreferences'
import { NotificationCenter } from './pages/NotificationCenter'
import { NotFound } from './pages/NotFound'

/**
 * information_architecture.md's Web Application tree, as routes. Org-scoped
 * sections nest under /organizations/:organizationId/..., matching
 * api_resources.md's URL convention exactly — the Organization is always
 * explicit in the path, never hidden session state. OrganizationProvider
 * loads the caller's permission set once per Organization; Layout (the
 * chrome) sits inside it so its nav can read that permission set, and every
 * screen below it can too.
 *
 * The Assessment Attempt route carries :courseId (screens.md's literal route
 * doesn't) so the chromeless attempt screen can link back into the right
 * Course Player without a flat "get assessment by id" endpoint existing.
 */
export const router = createBrowserRouter([
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password/:token', element: <ResetPassword /> },
  { path: '/invitations/:token', element: <AcceptInvitation /> },
  { path: '/explore/:organizationId', element: <PublicCatalog /> },
  { path: '/explore/:organizationId/sign-in', element: <OrgSignIn /> },
  { path: '/explore/:organizationId/sign-up', element: <SelfRegister /> },
  { path: '/verify', element: <VerifyCertificate /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Outlet />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RedirectToActiveOrganization /> },
      {
        // Chromeless — no Layout — so a timed attempt can't be navigated away from via global nav by accident.
        path: 'organizations/:organizationId/courses/:courseId/assessments/:assessmentId/attempt/:attemptId',
        element: (
          <OrganizationProvider>
            <AssessmentAttempt />
          </OrganizationProvider>
        ),
      },
      {
        path: 'organizations/:organizationId',
        element: (
          <OrganizationProvider>
            <Layout />
          </OrganizationProvider>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'catalog', element: <Catalog /> },
          { path: 'catalog/paths/:pathId', element: <LearningPathDetail /> },
          { path: 'catalog/:courseId', element: <CourseDetail /> },
          { path: 'my-learning', element: <MyLearning /> },
          { path: 'my-learning/bookmarks', element: <Bookmarks /> },
          { path: 'my-learning/:enrollmentId/play', element: <CoursePlayer /> },
          { path: 'courses/:courseId/assessments/:assessmentId/attempt/:attemptId/result', element: <AssessmentResult /> },
          { path: 'achievements', element: <Achievements /> },
          { path: 'achievements/certificates/:id', element: <CertificateDetail /> },
          { path: 'teaching/courses', element: <MyCourses /> },
          { path: 'teaching/question-banks', element: <QuestionBanks /> },
          { path: 'teaching/content', element: <ContentLibrary /> },
          { path: 'teaching/rubrics', element: <Rubrics /> },
          { path: 'teaching/courses/:courseId/builder', element: <CourseBuilder /> },
          { path: 'teaching/courses/:courseId/settings', element: <CourseSettings /> },
          { path: 'teaching/courses/:courseId/roster', element: <Roster /> },
          { path: 'teaching/courses/:courseId/analytics', element: <CourseAnalytics /> },
          { path: 'teaching/courses/:courseId/discussions', element: <CourseDiscussions /> },
          { path: 'teaching/courses/:courseId/announcements/new', element: <AnnouncementComposer /> },
          { path: 'teaching/courses/:courseId/assessments/:assessmentId', element: <AssessmentBuilder /> },
          { path: 'teaching/courses/:courseId/gradebook', element: <Gradebook /> },
          { path: 'teaching/courses/:courseId/gradebook/:submissionId', element: <SubmissionGrading /> },
          { path: 'courses/:courseId/discussions/:discussionId', element: <CourseDiscussion /> },
          { path: 'messages', element: <Conversations /> },
          { path: 'messages/:conversationId', element: <ConversationThread /> },
          { path: 'announcements', element: <AnnouncementsFeed /> },
          { path: 'account/profile', element: <Profile /> },
          { path: 'account/security', element: <Security /> },
          { path: 'account/notifications', element: <NotificationPreferences /> },
          { path: 'notifications', element: <NotificationCenter /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])
