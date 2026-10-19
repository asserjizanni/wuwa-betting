import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell, Send, Users, Sparkles, Loader2, Check,
  Clock, RefreshCw, MessageSquare
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../shared/UI'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

interface SystemNotifRow {
  id: string
  title: string
  message: string
  icon: string
  target_type: string
  sent_at: string
  created_at: string
}

export function AdminNotifications() {
  const { admin } = useAuth()
  const [history, setHistory] = useState<SystemNotifRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  // Form
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [icon, setIcon] = useState('📢')
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all')

  const availableIcons = ['📢', '🎁', '⚔️', '⚡', '🌟', '🔔', '🏰', '💎', '🎉', '⚠️']

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      if (data) setHistory(data)
    } catch (err) {
      toast.error('حدث خطأ أثناء تحميل سجل الإشعارات')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return toast.error('أدخل عنوان الإشعار')
    if (!message.trim()) return toast.error('أدخل نص الإشعار')
    if (!admin?.id) return

    setIsSending(true)
    try {
      const { data, error } = await supabase.rpc('admin_send_notification', {
        p_admin_id: admin.id,
        p_title: title.trim(),
        p_message: message.trim(),
        p_icon: icon,
        p_target_type: targetType,
        p_target_player_ids: null
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشل إرسال الإشعار')

      toast.success(`تم بث الإشعار بنجاح إلى ${data.sent_to || 'جميع'} لاعب! 🎉`)
      setTitle('')
      setMessage('')
      await loadHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الإرسال')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Bell className="text-primary-400" />
          مركز الإشعارات والبثوث العامة
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          إرسال تنبيهات فورية ورسائل ترحيبية أو إعلانات مسابقات لجميع اللاعبين مباشرة في حساباتهم.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Form */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl p-6 border border-slate-700/60 sticky top-6">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Send size={16} className="text-primary-400" />
              بث إشعار جديد
            </h2>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="field-label text-xs font-bold text-slate-300 mb-1.5">
                  اختر أيقونة الإشعار
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableIcons.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        icon === ic
                          ? 'bg-primary-500 scale-110 shadow-glow-blue border border-primary-400'
                          : 'bg-slate-800/80 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label text-xs font-bold text-slate-300 mb-1">
                  عنوان الإشعار *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: بطولة عطلة نهاية الأسبوع بدأت!"
                  className="input-field text-sm"
                  required
                />
              </div>

              <div>
                <label className="field-label text-xs font-bold text-slate-300 mb-1">
                  نص الرسالة *
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="اكتب تفاصيل الإعلان أو المكافأة..."
                  className="input-field text-xs h-28 resize-none"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs flex items-center gap-2">
                <Users size={16} className="flex-shrink-0" />
                <span>سيصل هذا الإشعار فورياً لجميع حسابات اللاعبين النشطة.</span>
              </div>

              <button
                type="submit"
                disabled={isSending || !title.trim() || !message.trim()}
                className="btn-primary w-full py-3 text-xs font-bold gap-2 shadow-lg"
              >
                {isSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {isSending ? 'جارٍ البث للجميع...' : 'إرسال الإشعار لجميع اللاعبين'}
              </button>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-6 border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                سجل الإشعارات المرسلة سابقاً ({history.length})
              </h2>
              <button onClick={loadHistory} className="btn-secondary text-xs">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner text="جارٍ جلب السجل..." />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={40} className="mx-auto text-slate-600 mb-2" />
                <p className="text-slate-400 text-xs">لم يتم إرسال أي إشعارات عامة بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3.5"
                  >
                    <span className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800 flex-shrink-0">
                      {item.icon || '📢'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-white text-sm truncate">{item.title}</h3>
                        <span className="text-[11px] text-slate-500 flex-shrink-0">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed break-words">
                        {item.message}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
