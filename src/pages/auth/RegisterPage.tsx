import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UtensilsCrossed, GraduationCap, Briefcase } from 'lucide-react'
import { useAuthStore } from '../../store'
import { Card, CardContent, Button, Input, Select, LanguageSelector } from '../../components/ui'
import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

// ─── Schema ───────────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    role: z.enum(['employee', 'student']),
    fullName: z.string().min(2, 'nameTooShort'),
    email: z.string().email('invalidEmail'),
    phone: z.string().min(10, 'phoneRequired'),
    password: z.string().min(6, 'passwordTooShort'),
    confirmPassword: z.string(),
    department: z.string().optional(),
    studentId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordsDontMatch',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => data.role !== 'student' || (data.studentId && data.studentId.trim().length >= 3),
    {
      message: 'Student ID is required',
      path: ['studentId'],
    }
  )

type RegisterForm = z.infer<typeof registerSchema>

// ─── Role pill ────────────────────────────────────────────────────────────────

interface RolePillProps {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  description: string
  accentClass: string
}

function RolePill({ selected, onClick, icon, label, description, accentClass }: RolePillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left',
        selected
          ? `${accentClass} shadow-sm`
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      <div className={cn(
        'h-10 w-10 rounded-xl flex items-center justify-center transition-colors',
        selected ? 'bg-white/60' : 'bg-gray-100'
      )}>
        {icon}
      </div>
      <div className="text-center">
        <p className={cn('font-semibold text-sm', selected ? '' : 'text-gray-700')}>{label}</p>
        <p className={cn('text-xs mt-0.5', selected ? 'opacity-70' : 'text-gray-400')}>{description}</p>
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate()
  const { signUp, isLoading } = useAuthStore()
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'employee' },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterForm) => {
    setError(null)
    const result = await signUp({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
      department: data.department,
      role: data.role,
      studentId: data.role === 'student' ? data.studentId : undefined,
    })

    if (result.error) {
      setError(result.error.message)
      toast.error(t('createAccountFailed'))
    } else {
      toast.success(t('accountCreated'))
      navigate('/login')
    }
  }

  const isStudent = selectedRole === 'student'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Language Selector */}
        <div className="absolute top-4 right-4">
          <LanguageSelector variant="compact" />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className={cn(
              'h-14 w-14 rounded-xl flex items-center justify-center transition-colors duration-300',
              isStudent ? 'bg-amber-500' : 'bg-primary-600'
            )}>
              {isStudent
                ? <GraduationCap className="h-8 w-8 text-white" />
                : <UtensilsCrossed className="h-8 w-8 text-white" />
              }
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

              {/* ── Role Selector ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am registering as…
                </label>
                <div className="flex gap-3">
                  <RolePill
                    selected={selectedRole === 'employee'}
                    onClick={() => setValue('role', 'employee')}
                    icon={<Briefcase className={cn('h-5 w-5', selectedRole === 'employee' ? 'text-primary-700' : 'text-gray-500')} />}
                    label="Employee"
                    description="Staff member"
                    accentClass="border-primary-400 bg-primary-50 text-primary-700"
                  />
                  <RolePill
                    selected={selectedRole === 'student'}
                    onClick={() => setValue('role', 'student')}
                    icon={<GraduationCap className={cn('h-5 w-5', selectedRole === 'student' ? 'text-amber-700' : 'text-gray-500')} />}
                    label="Student"
                    description="Tiffin ordering"
                    accentClass="border-amber-400 bg-amber-50 text-amber-700"
                  />
                </div>
                {/* Hidden input to register the role field */}
                <input type="hidden" {...register('role')} />
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-400">Personal Details</span>
                </div>
              </div>

              {/* ── Common fields ── */}
              <Input
                label={t('fullName')}
                placeholder="Your full name"
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              <Input
                label={t('email')}
                type="email"
                placeholder="you@example.com"
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

              {/* ── Employee-only: Department ── */}
              {!isStudent && (
                <Select
                  label={t('department')}
                  options={[
                    { value: '',        label: t('selectDepartment') },
                    { value: 'School',  label: 'School' },
                    { value: 'Educare', label: 'Educare' },
                  ]}
                  error={errors.department?.message}
                  {...register('department')}
                />
              )}

              {/* ── Student-only: Student ID ── */}
              {isStudent && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Student Details</span>
                  </div>
                  <Input
                    label="Student ID"
                    placeholder="e.g. STU-2024-001"
                    error={errors.studentId?.message}
                    {...register('studentId')}
                  />
                  <p className="text-xs text-amber-700">
                    Your Student ID will be verified by admin before your account is activated.
                  </p>
                </div>
              )}

              {/* ── Password ── */}
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
                className={cn(
                  'w-full',
                  isStudent && 'bg-amber-500 hover:bg-amber-600 border-amber-500'
                )}
                isLoading={isLoading}
              >
                {isStudent ? 'Register as Student' : t('signUp')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-600">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login" className={cn(
            'font-medium hover:opacity-80',
            isStudent ? 'text-amber-600' : 'text-primary-600'
          )}>
            {t('loginHere')}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
