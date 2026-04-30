import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/context/auth"
import { Role } from "@/types/auth"
import { ProtectedRoute } from "@/routes/protected-route"

// Layouts
import { AdminLayout } from "@/layouts/admin-layout"
import { UserLayout } from "@/layouts/user-layout"

// Auth
import { LoginPage } from "@/pages/auth/login"

// Admin pages
import { AdminDashboard } from "@/pages/admin/dashboard"
import { AdminUsers } from "@/pages/admin/users"
import { AdminAnalytics } from "@/pages/admin/analytics"
import { AdminCourses } from "@/pages/admin/courses"
import { AdminSettings } from "@/pages/admin/settings"

// User pages
import { UserDashboard } from "@/pages/user/dashboard"
import { UserMyCourses } from "@/pages/user/my-courses"
import { UserProgress } from "@/pages/user/progress"
import { UserSchedule } from "@/pages/user/schedule"

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
              <Route path="/admin"           element={<AdminDashboard />} />
              <Route path="/admin/users"     element={<AdminUsers />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/courses"   element={<AdminCourses />} />
              <Route path="/admin/settings"  element={<AdminSettings />} />
            </Route>
          </Route>

          {/* User — role-guarded */}
          <Route element={<ProtectedRoute requiredRole={Role.user} />}>
            <Route element={<UserLayout />}>
              <Route path="/user"          element={<UserDashboard />} />
              <Route path="/user/courses"  element={<UserMyCourses />} />
              <Route path="/user/progress" element={<UserProgress />} />
              <Route path="/user/schedule" element={<UserSchedule />} />
            </Route>
          </Route>

          {/* Catch-all → login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

