import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UtensilsCrossed } from 'lucide-react'
import { useAuthStore } from '../../store'
import { Card, CardContent, Button, Input, Select, LanguageSelector } from '../../components/ui'
import { useTranslation } from '../../hooks/useTranslation'
import toast from 'react-hot-toast'

const registerSchema = z.object({
  fullName: z.string().min(2, 'nameTooShort'),
  email: z.string().email('invalidEmail'),
  phone: z.string().min(10, 'phoneRequired'),
  password: z.string().min(6, 'passwordTooShort'),
  confirmPassword: z.string(),
  department: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'passwordsDontMatch',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { signUp, isLoading } = useAuthStore()
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setError(null)
    const result = await signUp({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
      department: data.department,
    })

    if (result.error) {
      setError(result.error.message)
      toast.error(t('createAccountFailed'))
    } else {
      toast.success(t('accountCreated'))
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
          <h2 className="mt-4 text-3xl font-bold text-gray-900">{t('registerTitle')}</h2>
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
                label={t('fullName')}
                placeholder="John Doe"
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              <Input
                label={t('email')}
                type="email"
                placeholder="you@company.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label={t('phone')}
                type="tel"
                placeholder="+880 1XX XXX XXXX"
                error={errors.phone?.message}
                {...register('phone')}
              />

              <Select
                label={t('department')}
                options={[
                  { value: '', label: t('selectDepartment') },
                  { value: 'Academic Department', label: 'Academic Department' },
                  { value: 'Hifz Department', label: 'Hifz Department' },
                  { value: 'IT Department', label: 'IT Department' },
                  { value: 'HR', label: 'HR' },
                  { value: 'Finance', label: 'Finance' },
                  { value: 'Admission', label: 'Admission' },
                  { value: 'Admin', label: 'Admin' },
                ]}
                {...register('department')}
              />

              <Input
                label={t('password')}
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label={t('confirmPassword')}
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
                {t('signUp')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-600">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            {t('loginHere')}
          </Link>
        </p>
      </div>
    </div>
  )
}
