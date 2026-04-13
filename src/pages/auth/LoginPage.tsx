import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UtensilsCrossed, Clock } from 'lucide-react'
import { useAuthStore } from '../../store'
import { Card, CardContent, Button, Input, LanguageSelector } from '../../components/ui'
import { useTranslation } from '../../hooks/useTranslation'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('invalidEmail'),
  password: z.string().min(6, 'passwordTooShort'),
  rememberMe: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, isLoading } = useAuthStore()
  const { t } = useTranslation()
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
        toast.error(t('signInFailed'))
      }
    } else {
      toast.success(t('welcomeBack'))
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
        {/* Language Selector - Top Right */}
        <div className="absolute top-4 right-4">
          <LanguageSelector variant="compact" />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="h-14 w-14 bg-primary-600 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">{t('appName')}</h2>
          <p className="mt-2 text-gray-600">{t('loginTitle')}</p>
        </div>

        {/* Pending Approval Banner */}
        {isPendingApproval && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">{t('pendingApproval')}</p>
              <p className="text-sm text-amber-700 mt-1">{t('pendingApprovalMsg')}</p>
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
                label={t('email')}
                type="email"
                placeholder="you@company.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label={t('password')}
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
                  {t('rememberMe')}
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                {t('signIn')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-600">
          {t('dontHaveAccount')}{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
            {t('registerHere')}
          </Link>
        </p>
      </div>
    </div>
  )
}
