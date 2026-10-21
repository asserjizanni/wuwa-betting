import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

// ============================================================
// Modal Component
// ============================================================
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlay?: boolean
}

export function Modal({ isOpen, onClose, title, children, size = 'md', closeOnOverlay = true }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeOnOverlay ? onClose : undefined}
        >
          <motion.div
            className={`modal-content ${sizeClasses[size]} w-full`}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================
// Confirm Dialog
// ============================================================
interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'success'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const colors = {
    danger: 'text-red-400',
    warning: 'text-amber-400',
    success: 'text-green-400',
  }

  const btnClasses = {
    danger: 'btn-danger',
    warning: 'btn-primary',
    success: 'btn-success',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6">
        <div className={`mb-4 ${colors[variant]}`}>
          {variant === 'danger' && <AlertCircle size={40} />}
          {variant === 'warning' && <AlertTriangle size={40} />}
          {variant === 'success' && <CheckCircle2 size={40} />}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`${btnClasses[variant]} flex-1`}
          >
            {isLoading ? 'جارٍ التنفيذ...' : confirmLabel}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary flex-1"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// Loading Spinner
// ============================================================
export function LoadingSpinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const sizes = { sm: 16, md: 24, lg: 40 }
  
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        className="rounded-full border-2 border-primary-500/30 border-t-primary-500"
        style={{ width: sizes[size], height: sizes[size] }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && <p className="text-sm text-slate-400">{text}</p>}
    </div>
  )
}

// ============================================================
// Skeleton Loader
// ============================================================
export function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="shimmer h-6 w-3/4 rounded-lg" />
      <div className="shimmer h-4 w-1/2 rounded-lg" />
      <div className="shimmer h-4 w-2/3 rounded-lg" />
    </div>
  )
}

// ============================================================
// Empty State
// ============================================================
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="empty-state"
    >
      {icon && (
        <div className="w-20 h-20 mb-4 text-slate-600 flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}

// ============================================================
// Animated Counter
// ============================================================
export function AnimatedNumber({ value, prefix = '', suffix = '' }: { 
  value?: number | string | null
  prefix?: string
  suffix?: string
}) {
  const numericTarget = typeof value === 'number' ? (isNaN(value) ? 0 : value) : Number(value) || 0
  const [displayed, setDisplayed] = useState(numericTarget)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (numericTarget === displayed) return
    
    setIsAnimating(true)
    const diff = numericTarget - displayed
    const steps = 20
    const stepValue = diff / steps
    let current = displayed
    let step = 0

    const timer = setInterval(() => {
      step++
      current += stepValue
      if (step >= steps) {
        setDisplayed(numericTarget)
        setIsAnimating(false)
        clearInterval(timer)
      } else {
        setDisplayed(Math.round(current))
      }
    }, 20)

    return () => clearInterval(timer)
  }, [numericTarget])

  const safeValue = typeof displayed === 'number' && !isNaN(displayed) ? displayed : 0

  return (
    <motion.span
      animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.3 }}
      className="number-ltr"
    >
      {prefix}{safeValue.toLocaleString('en-US')}{suffix}
    </motion.span>
  )
}

// ============================================================
// Stats Card
// ============================================================
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'gold' | 'red' | 'purple'
}

export function StatCard({ title, value, icon, trend, color = 'blue' }: StatCardProps) {
  const colors = {
    blue: 'from-primary-500/20 to-primary-600/10 border-primary-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    gold: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  }

  const iconColors = {
    blue: 'text-primary-400',
    green: 'text-green-400',
    gold: 'text-amber-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative overflow-hidden glass-card rounded-2xl p-5 bg-gradient-to-br ${colors[color]}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white number-ltr">{value}</p>
          {trend && (
            <p className={`text-xs ${trend.value > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={`${iconColors[color]} opacity-80`}>
          {icon}
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10 blur-xl bg-current" />
    </motion.div>
  )
}

// ============================================================
// Celebration Effect
// ============================================================
export function CelebrationEffect({ show }: { show: boolean }) {
  if (!show) return null

  const confetti = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: ['#6366f1', '#f59e0b', '#10b981', '#f97316', '#a855f7'][Math.floor(Math.random() * 5)],
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map(c => (
        <motion.div
          key={c.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{ left: `${c.x}%`, top: '-20px', backgroundColor: c.color }}
          animate={{
            y: ['0vh', '110vh'],
            rotate: [0, 720],
            opacity: [1, 0],
          }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  )
}
