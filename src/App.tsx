import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/context/auth"
import { Role } from "@/types/auth"
import { ProtectedRoute } from "@/routes/protected-route"
import { Toaster } from "@/components/ui/sonner"

// Layouts
import { AdminLayout } from "@/layouts/admin-layout"
import { UserLayout } from "@/layouts/user-layout"

// Auth
import { LoginPage } from "@/pages/auth/login"

// Admin — core pages
import { AdminDashboard } from "@/pages/admin/dashboard"

// Admin — User Management
import UsersPage from "@/pages/admin/user-management/users/users"
import { CreateUserPage } from "@/pages/admin/user-management/users/pages/create-user-page"
import { EditUserPage } from "@/pages/admin/user-management/users/pages/edit-user-page"
import { ViewUserPage } from "@/pages/admin/user-management/users/pages/view-user-page"
import DepartmentsPage from "@/pages/admin/user-management/departments/departments"
// Admin — Course Management
import LiveCoursesPage from "@/pages/admin/course-management/live-courses/live-courses"
import ResendLinksPage from "@/pages/admin/course-management/resend-links/resend-links"
import ViewCoursePage from "@/pages/admin/course-management/live-courses/pages/view-course-page"
import CourseFormPage from "@/pages/admin/course-management/live-courses/pages/course-form-page"
import OnlineCoursesPage from "@/pages/admin/course-management/online-courses/online-courses"
import ViewOnlineCoursePage from "@/pages/admin/course-management/online-courses/pages/view-online-course-page"
import OnlineCourseFormPage from "@/pages/admin/course-management/online-courses/pages/online-course-form-page"
import OnlineCourseAssignmentsPage from "@/pages/admin/course-management/online-courses/pages/online-course-assignments-page"
import AttendancePage from "@/pages/admin/course-management/attendance/attendance-page"

// Admin — Report Management
import ReportLiveCoursesPage from "@/pages/admin/report-management/live-courses/live-courses"
import ReportOnlineCoursesPage from "@/pages/admin/report-management/online-courses/online-courses"
import KpisPage from "@/pages/admin/report-management/kpis/kpis"

// Admin — Evaluation Management
import UserEvaluationPage from "@/pages/admin/evaluation-management/user-evaluation/user-evaluation"
import EvaluationConfigurationsPage from "@/pages/admin/evaluation-management/configurations/configurations"
import EvaluationNotificationsPage from "@/pages/admin/evaluation-management/notifications/notifications"
import EvaluationHistoryPage from "@/pages/admin/evaluation-management/history/history"

// Admin — Audio Management
import AudioManagementPage from "@/pages/admin/audio-management/audio/audio"
import { CreateAudioPage } from "@/pages/admin/audio-management/audio/pages/create-audio-page"
import { EditAudioPage } from "@/pages/admin/audio-management/audio/pages/edit-audio-page"
import { ViewAudioPage } from "@/pages/admin/audio-management/audio/pages/view-audio-page"
import AudioAssignmentsPage from "@/pages/admin/audio-management/assignments/assignments"
import AudioCategoriesPage from "@/pages/admin/audio-management/categories/categories"

// Admin — Video Management
import VideoManagementPage from "@/pages/admin/video-management/video/video"
import { CreateVideoPage } from "@/pages/admin/video-management/video/pages/create-video-page"
import { ViewVideoPage } from "@/pages/admin/video-management/video/pages/view-video-page"
import VideoCategoriesPage from "@/pages/admin/video-management/categories/categories"

// Admin — Blog Management
import BlogManagementPage from "@/pages/admin/blog-management/blog/blog"
import { BlogCreatePage } from "@/pages/admin/blog-management/pages/blog-create-page"
import { BlogEditPage } from "@/pages/admin/blog-management/pages/blog-edit-page"
import { BlogDetailPage } from "@/pages/admin/blog-management/pages/blog-detail-page"

// Admin — Quiz Management
import QuizzesPage, { CreateQuizPage, ViewQuizPage, EditQuizPage, ViewAttemptPage } from "@/pages/admin/quize-management/quizes/quizzes"
import QuizAssignmentsPage from "@/pages/admin/quize-management/quiz-assignments/quiz-assignments"

// Admin — Support
import FeedbackPage from "@/pages/admin/feedback/feedback"
import BugReportsPage from "@/pages/admin/bug-reports/bug-reports"

// User pages
import { UserDashboard } from "@/pages/user/dashboard"
import { UserCoursesPage } from "@/pages/user/courses/courses-page"
import { CourseDetailPage } from "@/pages/user/courses/pages/course-detail-page"
import { UserProgress } from "@/pages/user/progress"
import { UserSchedule } from "@/pages/user/schedule"

// User — Audio pages
import { UserAudioPage } from "@/pages/user/audio/index"
import { UserAudioDetailPage } from "@/pages/user/audio/audio-detail"

// User — Clocking / Attendance
import { UserClockingPage } from "@/pages/user/clocking/clocking-page"
import { UserEvaluationsPage } from "@/pages/user/evaluations/evaluations-page"

// User — Feedback
import { UserFeedbackPage } from "@/pages/user/feedback/user-feedback-page"

// User — Blog feed
import { UserBlogFeedPage } from "@/pages/user/blog/blog-feed-page"
import { UserBlogDetailPage } from "@/pages/user/blog/blog-detail-page"

// User — Online Courses
import { UserOnlineCoursesPage } from "@/pages/user/online-courses/online-courses-page"
import { OnlineCourseDetailPage } from "@/pages/user/online-courses/online-course-detail-page"
import { OnlineContentViewerPage } from "@/pages/user/online-courses/online-content-viewer-page"

// User — Quiz pages
import { MyQuizzesPage } from "@/pages/user/quiz/my-quizzes-page"
import { QuizDetailPage } from "@/pages/user/quiz/quiz-detail-page"
import { QuizTakePage } from "@/pages/user/quiz/quiz-take-page"
import { QuizResultPage } from "@/pages/user/quiz/quiz-result-page"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin — role-guarded */}
          <Route element={<ProtectedRoute requiredRole={Role.admin} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />

              {/* User Management */}
              <Route path="/admin/user-management/users" element={<UsersPage />} />
              <Route path="/admin/user-management/users/create" element={<CreateUserPage />} />
              <Route path="/admin/user-management/users/:id" element={<ViewUserPage />} />
              <Route path="/admin/user-management/users/edit/:id" element={<EditUserPage />} />
              <Route path="/admin/user-management/departments" element={<DepartmentsPage />} />

              {/* Course Management */}
              <Route path="/admin/course-management/live-courses" element={<LiveCoursesPage />} />
              <Route path="/admin/course-management/resend-links" element={<ResendLinksPage />} />
              <Route path="/admin/course-management/live-courses/create" element={<CourseFormPage />} />
              <Route path="/admin/course-management/live-courses/edit/:id" element={<CourseFormPage />} />
              <Route path="/admin/course-management/live-courses/:id" element={<ViewCoursePage />} />
              <Route path="/admin/course-management/online-courses" element={<OnlineCoursesPage />} />
              <Route path="/admin/course-management/online-courses/assignments" element={<OnlineCourseAssignmentsPage />} />
              <Route path="/admin/course-management/online-courses/create" element={<OnlineCourseFormPage />} />
              <Route path="/admin/course-management/online-courses/edit/:id" element={<OnlineCourseFormPage />} />
              <Route path="/admin/course-management/online-courses/:id" element={<ViewOnlineCoursePage />} />
              <Route path="/admin/course-management/attendance" element={<AttendancePage />} />

              {/* Report Management */}
              <Route path="/admin/report-management/live-courses" element={<ReportLiveCoursesPage />} />
              <Route path="/admin/report-management/online-courses" element={<ReportOnlineCoursesPage />} />
              <Route path="/admin/report-management/kpis" element={<KpisPage />} />

              {/* Evaluation Management */}
              <Route path="/admin/evaluation-management/user-evaluation" element={<UserEvaluationPage />} />
              <Route path="/admin/evaluation-management/configurations" element={<EvaluationConfigurationsPage />} />
              <Route path="/admin/evaluation-management/notifications" element={<EvaluationNotificationsPage />} />
              <Route path="/admin/evaluation-management/history" element={<EvaluationHistoryPage />} />

              {/* Audio Management */}
              <Route path="/admin/audio-management/audio" element={<AudioManagementPage />} />
              <Route path="/admin/audio-management/audio/create" element={<CreateAudioPage />} />
              <Route path="/admin/audio-management/audio/view/:id" element={<ViewAudioPage />} />
              <Route path="/admin/audio-management/audio/edit/:id" element={<EditAudioPage />} />
              <Route path="/admin/audio-management/assignments" element={<AudioAssignmentsPage />} />
              <Route path="/admin/audio-management/categories" element={<AudioCategoriesPage />} />

              {/* Video Management */}
              <Route path="/admin/video-management/video" element={<VideoManagementPage />} />
              <Route path="/admin/video-management/video/create" element={<CreateVideoPage />} />
              <Route path="/admin/video-management/video/:id" element={<ViewVideoPage />} />
              <Route path="/admin/video-management/categories" element={<VideoCategoriesPage />} />

              {/* Blog Management */}
              <Route path="/admin/blog-management/blog" element={<BlogManagementPage />} />
              <Route path="/admin/blog-management/blog/create" element={<BlogCreatePage />} />
              <Route path="/admin/blog-management/blog/edit/:id" element={<BlogEditPage />} />
              <Route path="/admin/blog-management/blog/:id" element={<BlogDetailPage />} />

              {/* Quiz Management */}
              <Route path="/admin/quiz-management/list-quizzes" element={<QuizzesPage />} />
              <Route path="/admin/quiz-management/quizzes/create" element={<CreateQuizPage />} />
              <Route path="/admin/quiz-management/quizzes/:id" element={<ViewQuizPage />} />
              <Route path="/admin/quiz-management/quizzes/:id/edit" element={<EditQuizPage />} />
              <Route path="/admin/quiz-management/quizzes/:id/attempts/:attemptId" element={<ViewAttemptPage />} />
              <Route path="/admin/quiz-management/assignments" element={<QuizAssignmentsPage />} />
              <Route path="/admin/quiz-management/quiz-assignments" element={<QuizAssignmentsPage />} />
              <Route path="/admin/quiz-management/assignments/list" element={<QuizAssignmentsPage />} />

              {/* Support */}
              <Route path="/admin/feedback" element={<FeedbackPage />} />
              <Route path="/admin/bug-reports" element={<BugReportsPage />} />
            </Route>
          </Route>

          {/* User — role-guarded */}
          <Route element={<ProtectedRoute requiredRole={Role.user} />}>
            <Route element={<UserLayout />}>
              <Route path="/user"          element={<UserDashboard />} />
              <Route path="/user/courses"  element={<UserCoursesPage />} />
              <Route path="/user/courses/:id" element={<CourseDetailPage />} />
              <Route path="/user/progress" element={<UserProgress />} />
              <Route path="/user/schedule" element={<UserSchedule />} />

              {/* Audio — list + detail/player */}
              <Route path="/user/audio"     element={<UserAudioPage />} />
              <Route path="/user/audio/:id" element={<UserAudioDetailPage />} />

              {/* Clocking / Attendance */}
              <Route path="/user/clocking" element={<UserClockingPage />} />

              {/* Evaluations */}
              <Route path="/user/evaluations" element={<UserEvaluationsPage />} />

              {/* Feedback */}
              <Route path="/user/feedback" element={<UserFeedbackPage />} />

              {/* Blog feed */}
              <Route path="/user/blog" element={<UserBlogFeedPage />} />
              <Route path="/user/blog/:slug" element={<UserBlogDetailPage />} />

              {/* Quiz pages */}
              <Route path="/user/quizzes" element={<MyQuizzesPage />} />
              <Route path="/user/quizzes/:id" element={<QuizDetailPage />} />
              <Route path="/user/quizzes/:id/take/:attemptId" element={<QuizTakePage />} />
              <Route path="/user/quizzes/:id/result/:attemptId" element={<QuizResultPage />} />

              {/* Online Courses */}
              <Route path="/user/online-courses" element={<UserOnlineCoursesPage />} />
              <Route path="/user/online-courses/:id" element={<OnlineCourseDetailPage />} />
              <Route path="/user/online-courses/:courseId/content/:contentId" element={<OnlineContentViewerPage />} />
            </Route>
          </Route>

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<RoleAwareFallback />} />
        </Routes>
        <Toaster richColors closeButton position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  )
}

function RoleAwareFallback() {
  const role = localStorage.getItem("auth_role")
  if (role === Role.admin) return <Navigate to="/admin" replace />
  if (role === Role.user) return <Navigate to="/user" replace />
  return <Navigate to="/login" replace />
}

export default App

