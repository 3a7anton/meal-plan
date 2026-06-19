import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/employee'
import { PageLoader } from './components/PageLoader'

// Auth Pages - lazy loaded
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))

// Employee Pages - lazy loaded
const DashboardPage = lazy(() => import('./pages/employee/DashboardPage'))
const MenuPage = lazy(() => import('./pages/employee/MenuPage'))
const BookingsPage = lazy(() => import('./pages/employee/BookingsPage'))
const ProfilePage = lazy(() => import('./pages/employee/ProfilePage'))

// Admin Pages - lazy loaded (these are heavy with charts/tables)
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const MenuManagementPage = lazy(() => import('./pages/admin/MenuManagementPage'))
const BookingManagementPage = lazy(() => import('./pages/admin/BookingManagementPage'))
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'))
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'))
const PaymentsPage = lazy(() => import('./pages/admin/PaymentsPage'))

// Shared Pages - lazy loaded
const MealHistoryPage = lazy(() => import('./pages/MealHistoryPage'))

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
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
            <Route path="/meal-history" element={<MealHistoryPage />} />
          </Route>

          {/* Admin Routes - Dashboard and Reports accessible to any admin */}
          <Route
            element={
              <ProtectedRoute requireAnyAdmin>
                <Layout isAdmin />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
          </Route>

          {/* Menu Management - Food Editors and Main Admins */}
          <Route
            element={
              <ProtectedRoute requireMealManagement>
                <Layout isAdmin />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/menu" element={<MenuManagementPage />} />
          </Route>

          {/* Booking Management - Main Admins and Admins only */}
          <Route
            element={
              <ProtectedRoute requireBookingManagement>
                <Layout isAdmin />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/bookings" element={<BookingManagementPage />} />
          </Route>

          {/* User Management - Main Admins and Admins only */}
          <Route
            element={
              <ProtectedRoute requireUserManagement>
                <Layout isAdmin />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/users" element={<UserManagementPage />} />
          </Route>

          {/* Payments - Finance Editors and Main Admins */}
          <Route
            element={
              <ProtectedRoute requireFinanceManagement>
                <Layout isAdmin />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/payments" element={<PaymentsPage />} />
          </Route>

          {/* Meal History - All authenticated users */}
          <Route
            element={
              <ProtectedRoute>
                <Layout isAdmin />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/meal-history" element={<MealHistoryPage />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      
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