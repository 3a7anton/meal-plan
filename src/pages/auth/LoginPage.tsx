import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UtensilsCrossed, Clock } from 'lucide-react'
import { useAuthStore } from '../../store'
import { Card, CardContent, Button, Input } from '../../components/ui'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, isLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [isPendingApproval, setIsPendingApproval] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    setIsPendingApproval(false)
    const result = await signIn(data.email, data.password, data.rememberMe)

    if (result.error) {
      if (result.pendingApproval) {
        setIsPendingApproval(true)
      } else {
        setError(result.error.message)
        toast.error('Failed to sign in')
      }
    } else {
      toast.success('Welcome back!')
      setTimeout(() => {
        const currentProfile = useAuthStore.getState().profile
        if (currentProfile?.role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      }, 500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="h-14 w-14 bg-primary-600 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Office Meal Planner</h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        {/* Pending Approval Banner */}
        {isPendingApproval && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Account Pending Approval</p>
              <p className="text-sm text-amber-700 mt-1">
                Your account has been registered but is awaiting admin approval. 
                Please contact your administrator or check back later.
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && !isPendingApproval && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  {...register('rememberMe')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-600">
                  Remember me
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
