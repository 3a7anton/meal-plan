import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UtensilsCrossed, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../../store'
import { Card, CardContent, Button, Input, LanguageSelector } from '../../components/ui'
import { useTranslation } from '../../hooks/useTranslation'
import toast from 'react-hot-toast'

const forgotPasswordSchema = z.object({
  email: z.string().email('invalidEmail'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const { sendPasswordResetCode, isLoading } = useAuthStore()
  const { t } = useTranslation()
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [email, setEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    const result = await sendPasswordResetCode(data.email)

    if (result.error) {
      toast.error(result.error.message)
    } else {
      setEmail(data.email)
      setIsCodeSent(true)
      toast.success(t('verificationCodeSent'))
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
          <h2 className="mt-4 text-3xl font-bold text-gray-900">{t('forgotPasswordTitle')}</h2>
          <p className="mt-2 text-gray-600">{t('appName')}</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isCodeSent ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">{t('checkYourEmail')}</p>
                  <p className="text-sm text-green-700 mt-1">
                    {t('resetLinkSentTo')} {email}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    {t('clickLinkToReset')}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label={t('email')}
                  type="email"
                  placeholder="you@company.com"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                >
                  {t('sendResetLink')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-600">
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 flex items-center justify-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {t('backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
