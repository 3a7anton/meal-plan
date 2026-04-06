import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Phone, Building2, Lock, Save } from 'lucide-react'
import { useAuthStore } from '../../store'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, ImageUpload } from '../../components/ui'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  avatar_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

const emailSchema = z.object({
  newEmail: z.string().email('Please enter a valid email'),
})

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof profileSchema>
type EmailForm = z.infer<typeof emailSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const { profile, user, updateProfile } = useAuthStore()
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      department: profile?.department || '',
      avatar_url: profile?.avatar_url || '',
    },
  })

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: user?.email || '',
    },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const onSaveProfile = async (data: ProfileForm) => {
    setIsSavingProfile(true)
    console.log('Updating profile with data:', data)
    const result = await updateProfile({
      full_name: data.full_name,
      phone: data.phone || null,
      department: data.department || null,
      avatar_url: data.avatar_url || null,
    })

    if (result.error) {
      console.error('Profile update error:', result.error)
      toast.error(`Failed to update profile: ${result.error.message}`)
    } else {
      toast.success('Profile updated!')
    }
    setIsSavingProfile(false)
  }

  const onSaveEmail = async (data: EmailForm) => {
    setIsSavingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: data.newEmail })
      if (error) throw error
      toast.success('Email update initiated! Check your new email for confirmation.')
      emailForm.reset()
    } catch (err) {
      toast.error((err as Error).message || 'Failed to update email')
    } finally {
      setIsSavingEmail(false)
    }
  }

  const onSavePassword = async (data: PasswordForm) => {
    setIsSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: data.newPassword })
      if (error) throw error
      toast.success('Password updated!')
      passwordForm.reset()
    } catch (err) {
      toast.error((err as Error).message || 'Failed to update password')
    } finally {
      setIsSavingPassword(false)
    }
  }

  const avatarUrl = profileForm.watch('avatar_url') || profile?.avatar_url

  return (
    <div className="space-y-6 max-w-2xl mx-auto lg:mx-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500">Manage your personal information and account settings</p>
      </div>

      {/* Avatar Card with Upload */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ImageUpload
              currentUrl={avatarUrl}
              onUpload={(url) => profileForm.setValue('avatar_url', url)}
              userId={user?.id || ''}
            />
            <div className="text-center sm:text-left">
              <p className="font-semibold text-gray-900 text-lg">{profile?.full_name}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                profile?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-primary-100 text-primary-700'
              }`}>
                {profile?.role === 'admin' ? 'Admin' : 'Employee'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Full Name"
                  placeholder="Jane Doe"
                  error={profileForm.formState.errors.full_name?.message}
                  {...profileForm.register('full_name')}
                />
                <User className="absolute right-3 top-9 h-4 w-4 text-gray-400" />
              </div>
              <div className="relative">
                <Input
                  label="Phone Number"
                  placeholder="+880 1XX XXX XXXX"
                  error={profileForm.formState.errors.phone?.message}
                  {...profileForm.register('phone')}
                />
                <Phone className="absolute right-3 top-9 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <Input
                label="Department"
                placeholder="Engineering, HR, Finance..."
                error={profileForm.formState.errors.department?.message}
                {...profileForm.register('department')}
              />
              <Building2 className="absolute right-3 top-9 h-4 w-4 text-gray-400" />
            </div>

            {/* Hidden avatar_url field - updated by ImageUpload */}
            <input type="hidden" {...profileForm.register('avatar_url')} />

            {/* Current Email (read-only display) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Email</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{user?.email}</span>
              </div>
            </div>

            <Button type="submit" isLoading={isSavingProfile} className="flex items-center gap-2">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Email Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Change Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={emailForm.handleSubmit(onSaveEmail)} className="space-y-4">
            <Input
              label="New Email Address"
              type="email"
              placeholder="newemail@example.com"
              error={emailForm.formState.errors.newEmail?.message}
              {...emailForm.register('newEmail')}
            />
            <p className="text-sm text-gray-500">
              You'll receive a confirmation email at the new address to verify the change.
            </p>
            <Button type="submit" variant="secondary" isLoading={isSavingEmail} className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Update Email
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onSavePassword)} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword')}
            />
            <Button type="submit" variant="secondary" isLoading={isSavingPassword} className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
