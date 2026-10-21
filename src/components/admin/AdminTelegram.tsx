import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Users, CheckCircle2, XCircle, Clock, RefreshCw,
  Bell, Eye, Image as ImageIcon, Sliders, ExternalLink,
  Smartphone, Terminal, AlertTriangle, ShieldCheck, Zap,
  Check, Flame, Skull, Sparkles, Box, Trophy, ShoppingBag,
  RotateCcw, Calendar, ChevronRight, Info
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner, ConfirmDialog, Modal } from '../shared/UI'
import toast from 'react-hot-toast'

interface TelegramStats {
  total_subscribers: number
  active_subscribers: number
  unsubscribed: number
  total_sent: number
  total_failed: number
  pending_notifications: number
  settings: {
    bosses_enabled: boolean
    cards_enabled: boolean
    box_cards_enabled: boolean
    boxes_enabled: boolean
    events_enabled: boolean
    shop_enabled: boolean
    announcements_enabled: boolean
    bot_active: boolean
  }
}

interface NotificationQueueItem {
  id: string
  event_type: string
  title: string
  message: string
  photo_url?: string | null
  button_text?: string | null
  button_url?: string | null
  target_category: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  scheduled_at: string
  processed_at?: string | null
  total_recipients: number
  success_count: number
  failure_count: number
  error_message?: string | null
  created_at: string
}

export function AdminTelegram() {
  const { admin } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'broadcast' | 'automations' | 'logs' | 'setup'>('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<TelegramStats | null>(null)
  const [logs, setLogs] = useState<NotificationQueueItem[]>([])

  // Broadcast Form
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [buttonText, setButtonText] = useState('🌐 زيارة الموقع')
  const [buttonUrl, setButtonUrl] = useState('https://wuwa-betting.netlify.app')
  const [targetCategory, setTargetCategory] = useState<string>('announcements')
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  // Retry state
  const [retryingId, setRetryingId] = useState<string | null>(null)

  // Filters for logs
  const [logFilterCategory, setLogFilterCategory] = useState<string>('all')
  const [logFilterStatus, setLogFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Stats via RPC
      const { data: statsData, error: statsErr } = await supabase.rpc('get_telegram_stats')
      if (statsErr) {
        console.warn('Could not fetch telegram stats RPC, fallback to direct query:', statsErr.message)
      } else if (statsData) {
        setStats(statsData as TelegramStats)
      }

      // 2. Fetch Notifications Queue Logs
      const { data: logsData, error: logsErr } = await supabase
        .from('telegram_notifications_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (logsErr) {
        console.warn('Could not fetch queue logs:', logsErr.message)
      } else if (logsData) {
        setLogs(logsData as NotificationQueueItem[])
      }
    } catch (err: any) {
      console.error('Error loading telegram admin data:', err)
      toast.error('حدث خطأ أثناء تحميل بيانات تلجرام')
    } finally {
      setLoading(false)
    }
  }

  // Handle Setting Toggle
  const handleToggleSetting = async (key: string, currentValue: boolean) => {
    if (!admin?.id) return
    const updatedSettings = {
      ...stats?.settings,
      [key]: !currentValue
    }

    // Optimistic UI update
    if (stats) {
      setStats({
        ...stats,
        settings: {
          ...stats.settings,
          [key]: !currentValue
        }
      })
    }

    try {
      const { data, error } = await supabase.rpc('admin_update_telegram_settings', {
        p_admin_id: admin.id,
        p_settings: updatedSettings
      })

      if (error) throw error
      toast.success('تم تحديث إعداد الإشعارات بنجاح! ⚙️')
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث الإعداد')
      await loadAllData()
    }
  }

  // Handle Broadcast Submission
  const handleSendBroadcast = async () => {
    if (!admin?.id) return
    if (!title.trim()) return toast.error('يرجى كتابة عنوان الإعلان')
    if (!message.trim()) return toast.error('يرجى كتابة نص الرسالة')

    let schedIso: string | null = null
    if (isScheduled && scheduledDate) {
      schedIso = new Date(scheduledDate).toISOString()
    }

    setIsSending(true)
    setConfirmModalOpen(false)

    try {
      const { data, error } = await supabase.rpc('admin_send_telegram_broadcast', {
        p_admin_id: admin.id,
        p_title: title.trim(),
        p_message: message.trim(),
        p_photo_url: photoUrl.trim() || null,
        p_button_text: buttonText.trim() || null,
        p_button_url: buttonUrl.trim() || null,
        p_target_category: targetCategory,
        p_scheduled_at: schedIso
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشل جدولة الإعلان')

      toast.success(data.message || 'تمت جدولة الإعلان بنجاح! 🚀')
      setTitle('')
      setMessage('')
      setPhotoUrl('')
      setIsScheduled(false)
      setScheduledDate('')
      setActiveTab('logs')
      await loadAllData()
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إرسال الإعلان')
    } finally {
      setIsSending(false)
    }
  }

  // Handle Retry Failed Messages
  const handleRetryNotification = async (notificationId: string) => {
    if (!admin?.id) return
    setRetryingId(notificationId)
    try {
      const { data, error } = await supabase.rpc('admin_retry_telegram_notification', {
        p_admin_id: admin.id,
        p_notification_id: notificationId
      })

      if (error) throw error
      toast.success('تمت إعادة إدراج الرسائل الفاشلة في طابور الإرسال! 🔄')
      await loadAllData()
    } catch (err: any) {
      toast.error(err.message || 'فشلت إعادة المحاولة')
    } finally {
      setRetryingId(null)
    }
  }

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchCat = logFilterCategory === 'all' || l.target_category === logFilterCategory || l.event_type === logFilterCategory
      const matchStat = logFilterStatus === 'all' || l.status === logFilterStatus
      return matchCat && matchStat
    })
  }, [logs, logFilterCategory, logFilterStatus])

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Send size={20} />
            </div>
            <h1 className="text-2xl font-black text-white">مركز إشعارات وبوت تلجرام</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              جاهز ومدمج
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">
            إدارة إشعارات بوت تلجرام، بث الإعلانات الجماعية للمشتركين، ومتابعة سجلات الوصول التلقائي للزعماء والبطاقات والصناديق.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            تحديث البيانات
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5"
          >
            <Terminal size={14} />
            تشغيل البوت في Termux
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 max-w-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users size={15} />
          لوحة الإحصائيات
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'broadcast'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Send size={15} />
          إرسال إعلان يدوي
        </button>

        <button
          onClick={() => setActiveTab('automations')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'automations'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders size={15} />
          الإشعارات التلقائية
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock size={15} />
          سجل الإرسال ({logs.length})
        </button>

        <button
          onClick={() => setActiveTab('setup')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'setup'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone size={15} />
          دليل Termux
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: OVERVIEW & STATS                                        */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="glass-card p-4 rounded-2xl border border-slate-700/60 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 flex-shrink-0">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">إجمالي المشتركين</p>
                <p className="text-xl font-black text-white">{stats?.total_subscribers || 0}</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-emerald-500/20 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[11px] text-emerald-300 font-semibold">اشتراكات فعالة</p>
                <p className="text-xl font-black text-emerald-400">{stats?.active_subscribers || 0}</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-700/60 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                <XCircle size={20} />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">أوقفوا الاشتراك</p>
                <p className="text-xl font-black text-slate-300">{stats?.unsubscribed || 0}</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-sky-500/20 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
                <Send size={20} />
              </div>
              <div>
                <p className="text-[11px] text-sky-300 font-semibold">رسائل مرسلة بنجاح</p>
                <p className="text-xl font-black text-sky-400">{stats?.total_sent || 0}</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-rose-500/20 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-[11px] text-rose-300 font-semibold">رسائل فاشلة</p>
                <p className="text-xl font-black text-rose-400">{stats?.total_failed || 0}</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-amber-500/20 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[11px] text-amber-300 font-semibold">إشعارات معلقة</p>
                <p className="text-xl font-black text-amber-400">{stats?.pending_notifications || 0}</p>
              </div>
            </div>
          </div>

          {/* Quick Info & Architecture Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-lg">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="text-amber-400" size={18} />
                نظام الإرسال المعزول والمستقل (Outbox Architecture)
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                يستخدم النظام جدول طابور ذكي <code className="text-primary-400 font-mono">telegram_notifications_queue</code> في Supabase. عندما يُنشئ أي مدير زعيماً أو بطاقة أو صندوقاً، يُسجل الحدث ذرياً، ويتولى خادم البوت في Termux التقاط الرسائل وإرسالها بمعدل آمن لتفادي حظر التلجرام.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('broadcast')}
                  className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                >
                  <Send size={14} /> إنشاء إعلان الآن
                </button>
                <button
                  onClick={() => setActiveTab('automations')}
                  className="btn-secondary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                >
                  <Sliders size={14} /> ضبط الفئات التلقائية
                </button>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-lg">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" size={18} />
                حماية البيانات والخصوصية
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 flex-shrink-0" />
                  لا يُطلب من اللاعبين إدخال كلمات مرورهم أو ربط حساباتهم بالتلجرام.
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 flex-shrink-0" />
                  يتم تخزين الرمز السري <code className="text-primary-400 font-mono">BOT_TOKEN</code> في سيرفر البوت المستقل فقط بعيداً عن المتصفح.
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 flex-shrink-0" />
                  يتم احترام رغبة كل مستخدم بتعطيل أي فئة إشعارات في أي وقت.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: MANUAL BROADCAST                                        */}
      {/* ============================================================== */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Side */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="text-primary-400" size={18} />
                إنشاء وبث إعلان جديد للمشتركين
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                أرسل تنبيهاً مخصصاً لجميع المشتركين أو لفئة محددة، مع دعم الصور والأزرار التفاعلية المباشرة.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">عنوان الإعلان *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: 🌟 تحديث ضخم في ساحة Solaris!"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">نص الرسالة *</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="اكتب تفاصيل الإعلان هنا... يدعم التنسيق النصي الواضح والأيقونات التعبيرية."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">رابط الصورة التوضيحية (اختياري)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={e => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/banner.jpg أو /characters/scar.webp"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500 text-left font-mono"
                    dir="ltr"
                  />
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                      title="مسح"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">نص الزر التفاعلي</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={e => setButtonText(e.target.value)}
                    placeholder="🌐 فتح الموقع"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">رابط الزر (URL)</label>
                  <input
                    type="url"
                    value={buttonUrl}
                    onChange={e => setButtonUrl(e.target.value)}
                    placeholder="https://wuwa-betting.netlify.app/events"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500 text-left font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">الفئة المستهدفة</label>
                <select
                  value={targetCategory}
                  onChange={e => setTargetCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value="announcements">📢 المشتركون في الإعلانات العامة (الافتراضي)</option>
                  <option value="all">🌟 جميع المشتركين بدون استثناء</option>
                  <option value="bosses">🐉 المشتركون في إشعارات الزعماء فقط</option>
                  <option value="cards">🃏 المشتركون في إشعارات البطاقات فقط</option>
                  <option value="boxes">📦 المشتركون في إشعارات الصناديق فقط</option>
                  <option value="events">⚔️ المشتركون في إشعارات الفعاليات فقط</option>
                  <option value="shop">🛒 المشتركون في إشعارات المتجر فقط</option>
                </select>
              </div>

              {/* Scheduling Checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={e => setIsScheduled(e.target.checked)}
                    className="rounded border-slate-700 text-primary-500 focus:ring-primary-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-300">جدولة الإرسال لوقت لاحق</span>
                </label>

                {isScheduled && (
                  <div className="mt-2.5">
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(true)}
                  disabled={isSending || !title.trim() || !message.trim()}
                  className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-glow-blue"
                >
                  <Send size={16} />
                  معاينة وتأكيد الإرسال
                </button>
              </div>
            </div>
          </div>

          {/* Live Telegram Preview Side */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Eye size={14} /> معاينة حية لشكل الرسالة في تلجرام:
              </span>
              <span className="text-[11px] text-slate-500">Telegram App Preview</span>
            </div>

            {/* Telegram Chat Mockup */}
            <div className="bg-[#18222d] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden text-right">
              {/* Telegram message bubble */}
              <div className="bg-[#212d3b] rounded-2xl p-3.5 max-w-sm ml-auto space-y-2.5 border border-white/5 shadow-md">
                {/* Photo if provided */}
                {photoUrl && (
                  <div className="rounded-xl overflow-hidden bg-black/40 max-h-48 flex items-center justify-center">
                    <img
                      src={photoUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}

                <div>
                  <h4 className="text-white font-bold text-sm leading-snug">
                    {title.trim() || 'عنوان الإعلان سيظهر هنا...'}
                  </h4>
                  <p className="text-slate-300 text-xs mt-1.5 whitespace-pre-wrap leading-relaxed">
                    {message.trim() || 'نص الرسالة والمعلومات التفصيلية ستظهر هنا بالتنسيق المرتب مع كامل الرموز التعبيرية.'}
                  </p>
                </div>

                {/* Inline button */}
                {buttonText && (
                  <div className="pt-1">
                    <div className="w-full py-2 px-3 rounded-xl bg-[#2b5278] hover:bg-[#34628f] text-white text-xs font-bold text-center shadow flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                      <span>{buttonText}</span>
                      <ExternalLink size={12} />
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 text-left font-mono pt-1">
                  {new Date().toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: AUTOMATION TOGGLES                                      */}
      {/* ============================================================== */}
      {activeTab === 'automations' && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="text-amber-400" size={18} />
              مفاتيح التحكم في الإشعارات التلقائية
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              حدد الأحداث التي ترغب في إرسال إشعار تلجرام فوري وتلقائي لها عند حفظها من لوحة الإدارة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Bosses */}
            <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                  <Skull size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">إشعارات الزعماء الأسطوريين</h4>
                  <p className="text-xs text-slate-400">إرسال إشعار فوري عند إضافة زعيم جديد للمنصة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('bosses_enabled', stats?.settings?.bosses_enabled ?? true)}
                className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center px-1 ${
                  stats?.settings?.bosses_enabled ? 'bg-primary-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                    stats?.settings?.bosses_enabled ? '-translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 2. Cards */}
            <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">إشعارات البطاقات الجديدة</h4>
                  <p className="text-xs text-slate-400">إرسال تنبيه عند نشر بطاقة جديدة في الخزينة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('cards_enabled', stats?.settings?.cards_enabled ?? true)}
                className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center px-1 ${
                  stats?.settings?.cards_enabled ? 'bg-primary-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                    stats?.settings?.cards_enabled ? '-translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 3. Box Cards Added */}
            <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Box size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">إضافة بطاقات إلى الصناديق</h4>
                  <p className="text-xs text-slate-400">إشعار مجمّع عند إضافة بطاقات جديدة إلى صندوق سحب</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('box_cards_enabled', stats?.settings?.box_cards_enabled ?? true)}
                className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center px-1 ${
                  stats?.settings?.box_cards_enabled ? 'bg-primary-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                    stats?.settings?.box_cards_enabled ? '-translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 4. New Boxes */}
            <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
                  <Box size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">إشعارات الصناديق الجديدة</h4>
                  <p className="text-xs text-slate-400">إرسال تنبيه عند إطلاق صندوق سحب جديد (Gacha)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('boxes_enabled', stats?.settings?.boxes_enabled ?? true)}
                className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center px-1 ${
                  stats?.settings?.boxes_enabled ? 'bg-primary-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                    stats?.settings?.boxes_enabled ? '-translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 5. Events */}
            <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <Flame size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">إشعارات النزالات والفعاليات</h4>
                  <p className="text-xs text-slate-400">إشعار عند إنشاء مواجهة وتحدٍ جديد للمراهنة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('events_enabled', stats?.settings?.events_enabled ?? true)}
                className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center px-1 ${
                  stats?.settings?.events_enabled ? 'bg-primary-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                    stats?.settings?.events_enabled ? '-translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 6. Shop & Cosmetics */}
            <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 flex-shrink-0">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">إشعارات المتجر والمكافآت</h4>
                  <p className="text-xs text-slate-400">تنبيه المشتركين عند إضافة عناصر ومقتنيات جديدة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('shop_enabled', stats?.settings?.shop_enabled ?? true)}
                className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center px-1 ${
                  stats?.settings?.shop_enabled ? 'bg-primary-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                    stats?.settings?.shop_enabled ? '-translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: NOTIFICATION LOGS & RETRY                               */}
      {/* ============================================================== */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="text-primary-400" size={18} />
                سجل مهام الإرسال في تلجرام
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                تتبع حالة كل إشعار، عدد المستلمين، نسب النجاح والفشل، وإمكانية إعادة محاولة الرسائل الفاشلة.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <select
                value={logFilterStatus}
                onChange={e => setLogFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300"
              >
                <option value="all">كل الحالات</option>
                <option value="completed">مكتمل بنجاح</option>
                <option value="pending">قيد الانتظار</option>
                <option value="processing">جاري المعالجة</option>
                <option value="failed">تعثر الإرسال</option>
              </select>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-bold">
              لا توجد سجلات مطابقة حتى الآن.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map(item => {
                const isFail = item.status === 'failed' || item.failure_count > 0
                return (
                  <div
                    key={item.id}
                    className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono font-bold text-primary-400 uppercase">
                          {item.event_type}
                        </span>
                        <h4 className="text-white font-bold text-sm">{item.title}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === 'completed' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 size={12} /> مكتمل
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Clock size={12} /> بالانتظار
                          </span>
                        )}
                        {item.status === 'processing' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                            <RefreshCw size={12} className="animate-spin" /> جاري الإرسال
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                            <XCircle size={12} /> تعثر
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <div className="flex items-center gap-4">
                        <span>🎯 المستهدفون: <strong className="text-white">{item.total_recipients}</strong></span>
                        <span>✅ نجح: <strong className="text-emerald-400">{item.success_count}</strong></span>
                        {item.failure_count > 0 && (
                          <span>❌ فشل: <strong className="text-rose-400">{item.failure_count}</strong></span>
                        )}
                        <span>🕒 {new Date(item.created_at).toLocaleString('ar-EG-u-nu-latn')}</span>
                      </div>

                      {item.failure_count > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRetryNotification(item.id)}
                          disabled={retryingId === item.id}
                          className="btn-secondary py-1.5 px-3 text-xs font-bold text-amber-400 hover:text-amber-300 border-amber-500/30 flex items-center gap-1.5 self-start sm:self-auto"
                        >
                          <RotateCcw size={13} className={retryingId === item.id ? 'animate-spin' : ''} />
                          إعادة إرسال للفاشلين فقط
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: SETUP & TERMUX RUNNER GUIDE                             */}
      {/* ============================================================== */}
      {activeTab === 'setup' && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="text-emerald-400" size={18} />
              دليل تشغيل واستضافة البوت في Termux (Android)
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              مجلد البوت <code className="text-primary-400 font-mono font-bold">telegram-bot/</code> مستقل بالكامل داخل المشروع، وجاهز للتشغيل على هاتفك عبر Termux أو أي خادم Node.js.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">الخطوة 1: تثبيت Node.js و Git في Termux</span>
                <span className="text-[10px] text-slate-500">Terminal Command</span>
              </div>
              <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-3 rounded-xl overflow-x-auto select-all" dir="ltr">
pkg update -y && pkg install git nodejs -y
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">الخطوة 2: الدخول لمجلد البوت وتثبيت الاعتماديات</span>
                <span className="text-[10px] text-slate-500">Terminal Command</span>
              </div>
              <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-3 rounded-xl overflow-x-auto select-all" dir="ltr">
cd wuwa-betting/telegram-bot
npm install
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">الخطوة 3: إعداد متغيرات البيئة (.env)</span>
                <span className="text-[10px] text-slate-500">Terminal Command</span>
              </div>
              <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-3 rounded-xl overflow-x-auto select-all" dir="ltr">
cp .env.example .env
nano .env
              </pre>
              <p className="text-[11px] text-slate-400">
                ضع رمز البوت <code className="text-amber-400 font-mono">TELEGRAM_BOT_TOKEN</code> الذي حصلت عليه من @BotFather ثم اضغط CTRL+X للحفظ.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">الخطوة 4: تشغيل البوت في الخلفية عبر PM2</span>
                <span className="text-[10px] text-slate-500">Terminal Command</span>
              </div>
              <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-3 rounded-xl overflow-x-auto select-all" dir="ltr">
npm install -g pm2
termux-wake-lock
pm2 start src/bot.js --name "wuwa-bot"
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Broadcast */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="تأكيد إرسال الإعلان عبر تلجرام"
      >
        <div className="space-y-4 text-right">
          <p className="text-sm text-slate-300">
            أنت على وشك إرسال الإعلان التالي إلى المشتركين في فئة: <strong className="text-amber-400">({targetCategory})</strong>.
          </p>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
            <p className="font-bold text-white">{title}</p>
            <p className="text-slate-400 line-clamp-3">{message}</p>
          </div>

          <p className="text-[11px] text-slate-400">
            سيتم إدراج المهمة فوراً في طابور الإرسال وسيقوم خادم البوت بتسليمها لكل المشتركين تباعاً وبشكل آمن.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
              className="btn-secondary py-2 px-4 text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSendBroadcast}
              disabled={isSending}
              className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5"
            >
              <Send size={14} />
              {isSending ? 'جاري الإرسال...' : 'تأكيد البث الآن'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
