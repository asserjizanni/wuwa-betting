import type { EventStatus } from '../types/database'

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatNumber(num: number | string | undefined | null): string {
  const n = typeof num === 'number' ? num : Number(num) || 0
  if (Math.abs(n) >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M'
  }
  if (Math.abs(n) >= 1000) {
    return (n / 1000).toFixed(1) + 'K'
  }
  return n.toLocaleString('en-US')
}

export function formatBalance(balance: number | string | undefined | null): string {
  const b = typeof balance === 'number' ? balance : Number(balance) || 0
  const sign = b < 0 ? '-' : ''
  return `${sign}$${Math.abs(b).toLocaleString('en-US')}`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ar-EG-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffSecs = Math.floor(Math.abs(diffMs) / 1000)
  const isPast = diffMs < 0

  if (diffSecs < 60) {
    return isPast ? 'منذ لحظات' : 'خلال لحظات'
  }
  if (diffSecs < 3600) {
    const mins = Math.floor(diffSecs / 60)
    return isPast ? `منذ ${mins} دقيقة` : `خلال ${mins} دقيقة`
  }
  if (diffSecs < 86400) {
    const hours = Math.floor(diffSecs / 3600)
    return isPast ? `منذ ${hours} ساعة` : `خلال ${hours} ساعة`
  }
  const days = Math.floor(diffSecs / 86400)
  return isPast ? `منذ ${days} يوم` : `خلال ${days} يوم`
}

export function getEventStatusLabel(status: EventStatus): string {
  const labels: Record<EventStatus, string> = {
    draft: 'مسودة',
    scheduled: 'مجدول',
    open: 'مفتوح للرهان',
    closed: 'مغلق',
    pending_result: 'بانتظار النتيجة',
    settling: 'جارٍ توزيع الأرباح ($)',
    completed: 'مكتمل',
    cancelled: 'ملغى',
  }
  return labels[status] || status
}

export function getEventStatusClass(status: EventStatus): string {
  const classes: Record<EventStatus, string> = {
    draft: 'badge-draft',
    scheduled: 'badge-scheduled',
    open: 'badge-open',
    closed: 'badge-closed',
    pending_result: 'badge-scheduled',
    settling: 'badge-scheduled',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
  }
  return classes[status] || 'badge-draft'
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function getImageUrl(path: string | null, bucket: string): string {
  if (!path) return ''
  
  // If already a full URL or local path, return as-is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return path
  
  // If local asset path without leading slash
  if (path.startsWith('characters/') || path.startsWith('elements/') || path.startsWith('assets/')) {
    return `/${path}`
  }
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  if (!supabaseUrl) return ''
  
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

export function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}_${random}.${ext}`
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB for characters, 10MB for events

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'نوع الملف غير مدعوم. يُسمح بـ JPG و PNG و WebP فقط' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'حجم الملف كبير جداً. الحد الأقصى 5MB' }
  }

  return { valid: true }
}

export function getRankIcon(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function formatWinRate(winRate: number): string {
  return `${winRate.toFixed(1)}%`
}

export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    initial_balance: 'رصيد ابتدائي',
    bet_deduction: 'خصم رهان',
    win_reward: 'مكافأة فوز',
    event_settlement: 'تسوية إيفنت',
    admin_adjustment: 'تعديل إداري',
    bet_refund: 'استرداد رهان',
    cancellation_refund: 'استرداد بسبب إلغاء',
  }
  return labels[type] || type
}

export function getBetStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'معلق',
    confirmed: 'مؤكد',
    won: 'فائز',
    lost: 'خاسر',
    refunded: 'مسترد',
    cancelled: 'ملغى',
  }
  return labels[status] || status
}

export function getBetStatusClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'badge-draft',
    confirmed: 'badge-scheduled',
    won: 'badge-open',
    lost: 'badge-closed',
    refunded: 'badge-completed',
    cancelled: 'badge-cancelled',
  }
  return classes[status] || 'badge-draft'
}
