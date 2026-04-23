import { useState, useRef, type ChangeEvent } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useTranslation } from '../../hooks/useTranslation'
import { getOptimizedImageUrl } from '../../lib/utils'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  currentUrl?: string | null
  onUpload: (url: string) => void
  userId: string
}

export function ImageUpload({ currentUrl, onUpload, userId }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('selectImageFile'))
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('fileSizeError'))
      return
    }

    setIsUploading(true)

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      onUpload(publicUrl)
      toast.success(t('imageUploaded'))
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(t('imageUploadFailed'))
      // Reset preview on error
      setPreview(currentUrl || null)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onUpload('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Preview */}
      <div className="relative">
        {preview ? (
          <div className="relative group">
            <img
              src={preview?.startsWith('blob:') ? preview : getOptimizedImageUrl(preview, 256, 256)}
              alt="Profile"
              className="h-32 w-32 rounded-full object-cover border-4 border-primary-100"
              width={128}
              height={128}
            />
            {!isUploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                aria-label="Remove profile photo"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="h-32 w-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
            <Upload className="h-10 w-10 text-gray-500" />
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex flex-col items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
          id="avatar-upload"
        />
        <label
          htmlFor="avatar-upload"
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
            transition-colors cursor-pointer
            ${isUploading 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
              : 'bg-primary-600 text-white hover:bg-primary-700'
            }
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('uploading')}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {preview ? t('changePhoto') : t('uploadPhoto')}
            </>
          )}
        </label>
        <p className="text-xs text-gray-500">
          {t('maxFileSize')} • JPG, PNG, GIF
        </p>
      </div>
    </div>
  )
}
