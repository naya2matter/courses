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
import DepartmentsPage from "@/pages/admin/user-management/departments/departments"
import ResendLinksPage from "@/pages/admin/user-management/resend-links/resend-links"

// Admin — Course Management
import LiveCoursesPage from "@/pages/admin/course-management/live-courses/live-courses"
import ViewCoursePage from "@/pages/admin/course-management/live-courses/pages/view-course-page"
import CourseFormPage from "@/pages/admin/course-management/live-courses/pages/course-form-page"
import OnlineCoursesPage from "@/pages/admin/course-management/online-courses/online-courses"
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
import VideoCategoriesPage from "@/pages/admin/video-management/categories/categories"

// Admin — Blog Management
import BlogManagementPage from "@/pages/admin/blog-management/blog/blog"

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
              <Route path="/admin/user-management/users/edit/:id" element={<EditUserPage />} />
              <Route path="/admin/user-management/departments" element={<DepartmentsPage />} />
              <Route path="/admin/user-management/resend-links" element={<ResendLinksPage />} />

              {/* Course Management */}
              <Route path="/admin/course-management/live-courses" element={<LiveCoursesPage />} />
              <Route path="/admin/course-management/live-courses/create" element={<CourseFormPage />} />
              <Route path="/admin/course-management/live-courses/edit/:id" element={<CourseFormPage />} />
              <Route path="/admin/course-management/live-courses/:id" element={<ViewCoursePage />} />
              <Route path="/admin/course-management/online-courses" element={<OnlineCoursesPage />} />
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
              <Route path="/admin/video-management/categories" element={<VideoCategoriesPage />} />

              {/* Blog Management */}
              <Route path="/admin/blog-management/blog" element={<BlogManagementPage />} />

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
            </Route>
          </Route>

          {/* Catch-all → login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster richColors closeButton position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

