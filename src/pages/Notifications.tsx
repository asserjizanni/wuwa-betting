import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Bell, Gift, Trophy, Swords, Star, Check, CheckCheck, X, Zap, RefreshCw, Loader2 } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { useUIStore } from "../store"
import { supabase } from "../lib/supabase"
import toast from "react-hot-toast"

type Notification = {
  id: string
  type: "quest" | "challenge" | "market" | "gift" | "achievement" | "system"
  title: string
  message: string
  isRead: boolean
  createdAt: string
  icon: string
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "الآن"
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  return `منذ ${days} يوم`
}

export function NotificationsPage() {
  const { player, isAuthenticated } = useAuth()
  const { setLoginModalOpen } = useUIStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  useEffect(() => {
    if (player?.id) {
      loadNotifications()
    }
  }, [player?.id])

  const loadNotifications = async () => {
    if (!player?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('player_notifications')
        .select('*')
        .eq('player_id', player.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        setNotifications(data.map((n: any) => ({
          id: n.id,
          type: n.type || 'system',
          title: n.title,
          message: n.message,
          isRead: n.is_read,
          createdAt: n.created_at,
          icon: n.icon || '🔔'
        })))
      } else {
        // Starter notification
        setNotifications([{
          id: "sys-welcome",
          type: "system",
          title: "مرحباً بك في ساحة WuWa! 🌟",
          message: "تم تحديث أنظمة المنصة وتأمين الحسابات بكلمات المرور بنجاح.",
          isRead: false,
          createdAt: new Date().toISOString(),
          icon: "🌟"
        }])
      }
    } catch (err) {
      console.warn('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAllRead = async () => {
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })))
    if (player?.id) {
      await supabase
        .from('player_notifications')
        .update({ is_read: true })
        .eq('player_id', player.id)
    }
    toast.success("تم تحديد الكل كمقروء")
  }

  const markRead = async (id: string) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, isRead: true } : n))
    await supabase
      .from('player_notifications')
      .update({ is_read: true })
      .eq('id', id)
  }

  const deleteNotification = async (id: string) => {
    setNotifications(ns => ns.filter(n => n.id !== id))
    await supabase
      .from('player_notifications')
      .delete()
      .eq('id', id)
  }

  if (!isAuthenticated || !player) {
    return (
      <div className="min-h-screen pt-20 pb-28 md:pb-16 flex items-center justify-center px-4" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center glass-card rounded-3xl p-10 max-w-sm border border-slate-700/60">
          <div className="w-16 h-16 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-primary-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">سجّل دخولك أولاً</h2>
          <p className="text-slate-400 text-sm mb-6">يجب تسجيل الدخول لعرض الإشعارات الخاصة بك</p>
          <button onClick={() => setLoginModalOpen(true)} className="btn-primary w-full">دخول الساحة</button>
        </motion.div>
      </div>
    )
  }

  const filtered = filter === "unread" ? notifications.filter(n => !n.isRead) : notifications

  return (
    <div className="min-h-screen pt-20 pb-28 md:pb-16 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center">
                <Bell size={20} className="text-primary-400" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">{unreadCount}</span>}
              </div>
              مركز الإشعارات
            </h1>
            <p className="text-slate-400 text-sm mt-1">تنبيهات التحديات، مكافآت المهام، ورسائل الإدارة</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadNotifications} className="btn-secondary text-xs">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="btn-secondary text-xs flex items-center gap-1.5 whitespace-nowrap">
                <CheckCheck size={14} /> تحديد الكل كمقروء
              </button>
            )}
          </div>
        </motion.div>

        {/* Filter */}
        <div className="flex gap-2">
          <button onClick={() => setFilter("all")} className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${filter === "all" ? "bg-primary-500 text-white shadow-glow-blue" : "glass-card text-slate-400 hover:text-white"}`}>
            الكل ({notifications.length})
          </button>
          <button onClick={() => setFilter("unread")} className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${filter === "unread" ? "bg-primary-500 text-white shadow-glow-blue" : "glass-card text-slate-400 hover:text-white"}`}>
            غير مقروء ({unreadCount})
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="glass-card rounded-3xl p-16 text-center border border-slate-700/60">
            <Loader2 size={32} className="animate-spin text-primary-400 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">جارٍ جلب الإشعارات...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-slate-700/60">
            <Bell size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-bold">لا توجد إشعارات {filter === "unread" ? "غير مقروءة" : ""}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`glass-card rounded-2xl p-4 transition-all flex items-start gap-3.5 border ${
                  item.isRead ? "border-slate-800/80 opacity-80" : "border-primary-500/30 bg-primary-500/5"
                }`}
              >
                <span className="text-2xl p-2 rounded-xl bg-slate-800/80 border border-slate-700 flex-shrink-0">
                  {item.icon}
                </span>

                <div className="flex-1 min-w-0" onClick={() => !item.isRead && markRead(item.id)}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className={`font-bold text-sm ${item.isRead ? "text-slate-300" : "text-white"}`}>
                      {item.title}
                    </p>
                    <span className="text-[11px] text-slate-500 flex-shrink-0">{timeAgo(item.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed break-words">{item.message}</p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!item.isRead && (
                    <button
                      onClick={() => markRead(item.id)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-green-400 transition-colors"
                      title="تحديد كمقروء"
                    >
                      <Check size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(item.id)}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
                    title="حذف"
                  >
                    <X size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
