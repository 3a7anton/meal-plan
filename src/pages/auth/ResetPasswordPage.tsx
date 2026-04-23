import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UtensilsCrossed, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../../store'
import { Card, CardContent, Button, Input, LanguageSelector } from '../../components/ui'
import { useTranslation } from '../../hooks/useTranslation'
import toast from 'react-hot-toast'

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'passwordTooShort'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'passwordsDontMatch',
  path: ['confirmPassword'],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { verifyCodeAndResetPassword, isLoading } = useAuthStore()
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordForm) => {
    setError(null)
    const result = await verifyCodeAndResetPassword('', '', data.newPassword)

    if (result.error) {
      setError(result.error.message)
      toast.error(t('passwordResetFailed'))
    } else {
      toast.success(t('passwordResetSuccess'))
      navigate('/login')
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
          <h2 className="mt-4 text-3xl font-bold text-gray-900">{t('resetPasswordTitle')}</h2>
          <p className="mt-2 text-gray-600">{t('appName')}</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <Input
                label={t('newPassword')}
                type="password"
                placeholder="••••••••"
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />

              <Input
                label={t('confirmNewPassword')}
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                {t('resetPassword')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-600">
          <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500 flex items-center justify-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {t('resendLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPasswordPage
