import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Flame, Clock, Trophy, Star, ChevronLeft, Gift, Zap, Users } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { useUIStore } from "../store"
import { supabase } from "../lib/supabase"
import toast from "react-hot-toast"

type SeasonalEvent = {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  type: "tournament" | "bonus_hunt" | "card_drop" | "challenge_week"
  reward: string
  rewardAmount: number
  rewardIcon: string
  isActive: boolean
  participants: number
  badge: string
  color: string
  gradient: string
}

const getEventTypLabel = (type: string) => {
  switch (type) {
    case 'tournament': return 'بطولة موسمية'
    case 'bonus_hunt': return 'صيد المكافآت'
    case 'card_drop': return 'إسقاط بطاقات'
    case 'challenge_week': return 'أسبوع التحديات'
    default: return 'حدث خاص'
  }
}

const getDaysLeft = (endDate: string) => {
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function SeasonalEventsPage() {
  const { player, isAuthenticated } = useAuth()
  const { setLoginModalOpen } = useUIStore()
  const [events, setEvents] = useState<SeasonalEvent[]>([])
  const [joinedEvents, setJoinedEvents] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("active")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('seasonal_events')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        setEvents(data.map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description || '',
          startDate: d.start_date || '2026-10-15',
          endDate: d.end_date || '2026-11-15',
          type: (d.event_type as any) || 'tournament',
          reward: d.rewards?.[0]?.title || 'مكافآت وجوائز حصرية',
          rewardAmount: d.rewards?.[0]?.amount || 1000,
          rewardIcon: '🏆',
          isActive: d.status === 'active',
          participants: d.max_participants ? Math.floor(d.max_participants * 0.4) : 150,
          badge: d.badge || '🌟',
          color: d.color || '#6366f1',
          gradient: 'from-indigo-900/40 to-blue-900/40',
        })))
      }
    } catch (err) {
      console.warn('Could not load seasonal events from DB:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = (eventId: string) => {
    if (!isAuthenticated) { setLoginModalOpen(true); return }
    setJoinedEvents(prev => new Set([...prev, eventId]))
    toast.success("تم الانضمام للحدث الموسمي! 🎉")
  }

  const activeEvents = events.filter(e => e.isActive)
  const upcomingEvents = events.filter(e => !e.isActive)
  const displayEvents = activeTab === "active" ? activeEvents : upcomingEvents

  return (
    <div className="min-h-screen pt-20 pb-28 md:pb-16 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center"><Calendar size={20} className="text-amber-400" /></div>
            الأحداث الموسمية
          </h1>
          <p className="text-slate-400 text-sm mt-1 mr-14">أحداث وبطولات موسمية حصرية بمكافآت ضخمة</p>
        </motion.div>

        {/* Active Event Banner */}
        {activeEvents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative overflow-hidden rounded-3xl p-6 border border-primary-500/30" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))" }}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
            </div>
            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{activeEvents[0].badge}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold animate-pulse">🔴 نشط الآن</span>
                    <span className="text-xs px-2 py-0.5 rounded-full text-slate-400 border border-slate-700">{getEventTypLabel(activeEvents[0].type)}</span>
                  </div>
                  <h2 className="text-xl font-black text-white mb-1">{activeEvents[0].title}</h2>
                  <p className="text-sm text-slate-400 mb-3">{activeEvents[0].description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4 flex-wrap">
                    <span className="flex items-center gap-1"><Clock size={12} />{getDaysLeft(activeEvents[0].endDate)} يوم متبقٍ</span>
                    <span className="flex items-center gap-1"><Users size={12} />{activeEvents[0].participants.toLocaleString("en-US")} مشارك</span>
                    <span className="flex items-center gap-1"><Gift size={12} className="text-amber-400" />{activeEvents[0].reward}</span>
                  </div>
                  <button onClick={() => handleJoin(activeEvents[0].id)} disabled={joinedEvents.has(activeEvents[0].id)} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                    {joinedEvents.has(activeEvents[0].id) ? "✓ منضم" : "انضم الآن"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "active", label: `نشطة الآن (${activeEvents.length})` },
            { key: "upcoming", label: `قادمة (${upcomingEvents.length})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)} className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all ${activeTab === key ? "bg-primary-500 text-white" : "glass-card text-slate-400 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayEvents.map((event, idx) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
              className={`glass-card rounded-2xl overflow-hidden border ${event.isActive ? "border-slate-600/80" : "border-slate-700/40 opacity-80"}`}>
              {/* Event Type Header */}
              <div className={`px-4 py-3 bg-gradient-to-r ${event.gradient} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{event.badge}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${event.color}30`, color: event.color }}>{getEventTypLabel(event.type)}</span>
                </div>
                {event.isActive && (
                  <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    {getDaysLeft(event.endDate)} يوم
                  </div>
                )}
                {!event.isActive && (
                  <span className="text-xs text-amber-400 font-medium flex items-center gap-1"><Clock size={11} />قريباً</span>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-black text-white text-base mb-1">{event.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{event.description}</p>
                </div>

                {/* Reward */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: `${event.color}10`, border: `1px solid ${event.color}30` }}>
                  <span className="text-lg">{event.rewardIcon}</span>
                  <div>
                    <p className="text-xs text-slate-400">المكافأة</p>
                    <p className="text-xs font-bold" style={{ color: event.color }}>{event.reward}</p>
                  </div>
                </div>

                {/* Participants */}
                {event.isActive && (
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Users size={11} />{event.participants.toLocaleString("en-US")} مشارك</span>
                    <span>{new Date(event.startDate).toLocaleDateString("ar-EG-u-nu-latn")} - {new Date(event.endDate).toLocaleDateString("ar-EG-u-nu-latn")}</span>
                  </div>
                )}

                <button onClick={() => handleJoin(event.id)} disabled={!event.isActive || joinedEvents.has(event.id)} className={`w-full py-2 rounded-xl text-sm font-bold transition-all ${event.isActive && !joinedEvents.has(event.id) ? "bg-primary-500/20 border border-primary-500/40 text-primary-400 hover:bg-primary-500/30" : "bg-slate-800/50 border border-slate-700 text-slate-500 cursor-not-allowed"}`}>
                  {joinedEvents.has(event.id) ? "✓ تم الانضمام" : event.isActive ? "انضم للحدث" : "قريباً"}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
