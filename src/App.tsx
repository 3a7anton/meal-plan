import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/employee'

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'

// Employee Pages
import { DashboardPage } from './pages/employee/DashboardPage'
import { MenuPage } from './pages/employee/MenuPage'
import { BookingsPage } from './pages/employee/BookingsPage'
import { ProfilePage } from './pages/employee/ProfilePage'

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { MenuManagementPage } from './pages/admin/MenuManagementPage'
import { BookingManagementPage } from './pages/admin/BookingManagementPage'
import { UserManagementPage } from './pages/admin/UserManagementPage'
import { ReportsPage } from './pages/admin/ReportsPage'
import { PaymentsPage } from './pages/admin/PaymentsPage'

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Employee Routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Admin Routes */}
        <Route
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout isAdmin />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/menu" element={<MenuManagementPage />} />
          <Route path="/admin/bookings" element={<BookingManagementPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/payments" element={<PaymentsPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </BrowserRouter>
  )
}

export default App

// authorized by 3a7anton