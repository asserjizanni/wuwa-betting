import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Eye, Loader2, ImageOff, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { generateFileName, validateImageFile, getImageUrl } from '../../lib/utils'
import { useAuthStore } from '../../store'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  bucket: 'character-images' | 'event-covers' | 'card-images'
  currentPath?: string | null
  onUploaded: (path: string) => void
  label?: string
  aspectRatio?: 'square' | 'wide'
}

export function ImageUpload({ 
  bucket, 
  currentPath, 
  onUploaded, 
  label = 'رفع صورة',
  aspectRatio = 'square'
}: ImageUploadProps) {
  const admin = useAuthStore(state => state.admin)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(
    currentPath ? getImageUrl(currentPath, bucket) : null
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPreview(currentPath ? getImageUrl(currentPath, bucket) : null)
  }, [currentPath, bucket])

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'خطأ في الملف')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const fileName = generateFileName(file.name)
      const filePath = `${fileName}`

      // Delete old file if exists
      if (currentPath) {
        await supabase.storage.from(bucket).remove([currentPath])
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      setUploadProgress(100)
      onUploaded(filePath)
      toast.success('تم رفع الصورة بنجاح')
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الصورة'
      setError(errMsg)
      setPreview(currentPath ? getImageUrl(currentPath, bucket) : null)
      toast.error('فشل رفع الصورة: ' + errMsg)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [bucket, currentPath, onUploaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  if (!admin) return null

  return (
    <div className="space-y-3">
      {label && <label className="field-label">{label}</label>}
      
      {/* Upload area */}
      <div
        className={`relative rounded-xl border-2 border-dashed transition-all duration-300 ${
          isDragging
            ? 'border-primary-400 bg-primary-500/10'
            : 'border-slate-600 hover:border-primary-500/50 hover:bg-primary-500/5'
        } ${aspectRatio === 'square' ? 'aspect-square max-w-[200px]' : 'h-40 w-full'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* Preview image */}
        {preview ? (
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <img
              src={preview}
              alt="معاينة"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <label className="cursor-pointer btn-primary text-xs px-3 py-1.5">
                <Upload size={14} />
                تغيير
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleInputChange}
                  disabled={isUploading}
                />
              </label>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-primary-400" />
                <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs text-slate-300">جارٍ الرفع...</span>
              </div>
            )}
            {!isUploading && preview && (
              <div className="absolute top-1 left-1">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer">
            {isUploading ? (
              <>
                <Loader2 size={28} className="animate-spin text-primary-400" />
                <span className="text-xs text-slate-400">جارٍ الرفع...</span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
                  <Upload size={18} className="text-slate-400" />
                </div>
                <span className="text-xs text-slate-400 text-center px-2">
                  اسحب الصورة هنا أو انقر للاختيار
                </span>
                <span className="text-xs text-slate-600">JPG، PNG، WebP - حتى 5MB</span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleInputChange}
              disabled={isUploading}
            />
          </label>
        )}
      </div>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 flex items-center gap-1"
        >
          <X size={12} />
          {error}
        </motion.p>
      )}
    </div>
  )
}

// Character image display (with fallback)
export function CharacterImage({ 
  imagePath, 
  name,
  className = '',
  size = 'md'
}: { 
  imagePath?: string | null
  name: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const [imgError, setImgError] = useState(false)
  
  const imageUrl = imagePath && !imgError ? getImageUrl(imagePath, 'character-images') : null

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-full h-full',
  }

  if (!imageUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-800/50 rounded-xl ${sizeClasses[size]} ${className}`}>
        <ImageOff size={size === 'xl' ? 40 : 20} className="text-slate-600" />
        {size !== 'sm' && (
          <span className="text-xs text-slate-600 mt-1 text-center px-1 line-clamp-2">{name}</span>
        )}
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className={`object-cover rounded-xl ${sizeClasses[size]} ${className}`}
      onError={() => setImgError(true)}
    />
  )
}
