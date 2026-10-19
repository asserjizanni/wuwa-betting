import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Swords, Trophy, TrendingUp, Users, 
  Flame, ChevronLeft, Star, Zap, Package, 
  Sparkles, ShoppingBag, Gift, ArrowRight, Bell
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useUIStore } from '../store'
import { formatBalance, formatDate, getEventStatusClass, getEventStatusLabel, getImageUrl } from '../lib/utils'
import { StatCard, EmptyState, SkeletonCard, AnimatedNumber } from '../components/shared/UI'
import type { EventWithCharacters, LeaderboardEntry } from '../types/database'
import { CharacterImage } from '../components/shared/ImageUpload'

export function HomePage() {
  const { player, isAuthenticated } = useAuth()
  const { setLoginModalOpen } = useUIStore()
  const [openEvents, setOpenEvents] = useState<EventWithCharacters[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithCharacters[]>([])
  const [completedEvents, setCompletedEvents] = useState<EventWithCharacters[]>([])
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const selectFields = `
        *,
        character_a:characters!events_character_a_id_fkey(*),
        character_b:characters!events_character_b_id_fkey(*),
        winner_character:characters!events_winner_character_id_fkey(*)
      `

      const [openRes, upcomingRes, completedRes, leaderboardRes] = await Promise.all([
        supabase.from('events').select(selectFields).eq('status', 'open').order('opens_at', { ascending: true }).limit(6),
        supabase.from('events').select(selectFields).in('status', ['draft', 'scheduled']).order('opens_at', { ascending: true }).limit(4),
        supabase.from('events').select(selectFields).eq('status', 'completed').order('settled_at', { ascending: false }).limit(4),
        supabase.rpc('get_public_leaderboard', { p_limit: 10 }),
      ])

      if (openRes.data) setOpenEvents(openRes.data as EventWithCharacters[])
      if (upcomingRes.data) setUpcomingEvents(upcomingRes.data as EventWithCharacters[])
      if (completedRes.data) setCompletedEvents(completedRes.data as EventWithCharacters[])
      if (leaderboardRes.data) setTopPlayers(leaderboardRes.data as LeaderboardEntry[])
    } finally {
      setLoading(false)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {isAuthenticated && player ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
              >
                <Star size={14} className="text-amber-400" />
                مرحباً بعودتك، {player.username}!
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="glass-card rounded-2xl p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">رصيدك الحالي</p>
                  <p className={`text-xl font-black ${player.balance < 0 ? 'text-red-400' : 'text-white'}`}>
                    <AnimatedNumber value={player.balance} suffix=" نقطة" />
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">إجمالي الأرباح</p>
                  <p className="text-xl font-black text-green-400">
                    <AnimatedNumber value={player.total_winnings} suffix=" نقطة" />
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">رهانات فائزة</p>
                  <p className="text-xl font-black text-amber-400">
                    {player.winning_bets}/{player.total_bets}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
              >
                <Zap size={14} className="text-amber-400" />
                منصة توقعات Wuthering Waves التفاعلية
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
                <span className="gradient-text-primary">WuWa</span>
                <br />
                <span>Betting</span>
              </h1>
              
              <p className="text-lg text-slate-400 max-w-xl mx-auto">
                راهن على شخصياتك المفضلة، واكسب نقاطاً، وتصدّر لوحة المتصدرين!
                يحصل كل لاعب جديد على <span className="text-amber-400 font-bold">500 نقطة</span> مجاناً.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="btn-primary text-base px-8 py-4"
                >
                  <Swords size={20} />
                  دخول الساحة مجاناً
                </button>
                <Link to="/leaderboard" className="btn-secondary text-base px-8 py-4">
                  <Trophy size={20} />
                  لوحة المتصدرين
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-28 md:pb-16 space-y-8 sm:space-y-12">
        {/* Game Features Hub Grid */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-8 rounded-full bg-primary-400" />
            <h2 className="text-xl font-bold text-white">ميزات المنصة</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to="/boxes" className="glass-card p-4 rounded-2xl border border-slate-700/60 hover:border-amber-500/50 hover:bg-slate-900/60 transition-all group shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2.5 group-hover:scale-110 transition-transform"><Package size={20} /></div>
              <h3 className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">متجر الصناديق</h3>
              <p className="text-xs text-slate-400 mt-0.5">صناديق حظ بنظام Pity</p>
            </Link>
            <Link to="/collection" className="glass-card p-4 rounded-2xl border border-slate-700/60 hover:border-primary-500/50 hover:bg-slate-900/60 transition-all group shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center text-primary-400 mb-2.5 group-hover:scale-110 transition-transform"><Sparkles size={20} /></div>
              <h3 className="text-sm font-black text-white group-hover:text-primary-400 transition-colors">مجموعة بطاقاتي</h3>
              <p className="text-xs text-slate-400 mt-0.5">بطاقات 3D هولوجرام</p>
            </Link>
            <Link to="/market" className="glass-card p-4 rounded-2xl border border-slate-700/60 hover:border-purple-500/50 hover:bg-slate-900/60 transition-all group shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2.5 group-hover:scale-110 transition-transform"><ShoppingBag size={20} /></div>
              <h3 className="text-sm font-black text-white group-hover:text-purple-400 transition-colors">سوق التداول</h3>
              <p className="text-xs text-slate-400 mt-0.5">بيع وشراء بين اللاعبين</p>
            </Link>
            <Link to="/quests" className="glass-card p-4 rounded-2xl border border-slate-700/60 hover:border-emerald-500/50 hover:bg-slate-900/60 transition-all group shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2.5 group-hover:scale-110 transition-transform"><Gift size={20} /></div>
              <h3 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">المهام والمكافآت</h3>
              <p className="text-xs text-slate-400 mt-0.5">مهام يومية وأسبوعية</p>
            </Link>
            <Link to="/challenges" className="glass-card p-4 rounded-2xl border border-slate-700/60 hover:border-red-500/50 hover:bg-slate-900/60 transition-all group shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-2.5 group-hover:scale-110 transition-transform"><Swords size={20} /></div>
              <h3 className="text-sm font-black text-white group-hover:text-red-400 transition-colors">تحديات PvP</h3>
              <p className="text-xs text-slate-400 mt-0.5">تحدّ اللاعبين وراهن</p>
            </Link>
            <Link to="/guilds" className="glass-card p-4 rounded-2xl border border-slate-700/60 hover:border-blue-500/50 hover:bg-slate-900/60 transition-all group shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2.5 group-hover:scale-110 transition-transform"><Users size={20} /></div>
              <h3 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">الكلانات</h3>
              <p className="text-xs text-slate-400 mt-0.5">انضم وتنافس مع فريقك</p>
            </Link>
            <Link to="/evolution" className="glass-card p-4 rounded-2xl border border-slate-700/60 hover:border-amber-500/50 hover:bg-slate-900/60 transition-all group shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2.5 group-hover:scale-110 transition-transform"><Zap size={20} /></div>
              <h3 className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">تطوير البطاقات</h3>
              <p className="text-xs text-slate-400 mt-0.5">طوّر بطاقاتك 5 مستويات</p>
            </Link>
            <Link to="/notifications" className="glass-card p-4 rounded-2xl border border-slate-700/60 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all group shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2.5 group-hover:scale-110 transition-transform"><Bell size={20} /></div>
              <h3 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">الإشعارات</h3>
              <p className="text-xs text-slate-400 mt-0.5">تحديات ومكافآت جديدة</p>
            </Link>
          </div>
        </section>

        {/* Open Events */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 rounded-full bg-green-400" />
              <div>
                <h2 className="text-xl font-bold text-white">الإيفنتات المفتوحة</h2>
                <p className="text-sm text-slate-500">شارك الآن قبل انتهاء الوقت</p>
              </div>
              {openEvents.length > 0 && (
                <span className="badge badge-open">{openEvents.length}</span>
              )}
            </div>
            <Link to="/events" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              عرض الكل <ChevronLeft size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : openEvents.length === 0 ? (
            <EmptyState
              icon={<Swords size={48} />}
              title="لا توجد إيفنتات مفتوحة حالياً"
              description="ترقّب التحديات القادمة! سيتم إعلان الإيفنتات الجديدة قريباً."
            />
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {openEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </motion.div>
          )}
        </section>

        {/* Top 3 Leaderboard Preview */}
        {topPlayers.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 rounded-full bg-amber-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">المتصدرون</h2>
                  <p className="text-sm text-slate-500">أفضل اللاعبين هذا الموسم</p>
                </div>
              </div>
              <Link to="/leaderboard" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                جميع اللاعبين <ChevronLeft size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPlayers.slice(0, 3).map((p, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`glass-card rounded-2xl p-5 text-center ${idx === 0 ? 'border-amber-500/40' : ''}`}
                >
                  <div className="text-3xl mb-2">{['🥇', '🥈', '🥉'][idx]}</div>
                  <p className="font-bold text-white">{p.username}</p>
                  <p className="text-sm text-primary-400 font-bold mt-1">
                    {p.balance.toLocaleString('ar-EG')} نقطة
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {p.winning_bets} فوز من {p.total_bets}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 rounded-full bg-amber-400" />
              <div>
                <h2 className="text-xl font-bold text-white">الإيفنتات القادمة</h2>
                <p className="text-sm text-slate-500">استعد للتحديات القادمة</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} isUpcoming />
              ))}
            </div>
          </section>
        )}

        {/* Completed Events */}
        {completedEvents.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 rounded-full bg-slate-500" />
                <div>
                  <h2 className="text-xl font-bold text-white">الإيفنتات المكتملة</h2>
                  <p className="text-sm text-slate-500">سجل النتائج السابقة</p>
                </div>
              </div>
              <Link to="/history" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                عرض الكل <ChevronLeft size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// Event Card Component
function EventCard({ event, isUpcoming = false }: { event: EventWithCharacters; isUpcoming?: boolean }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
      <Link to={`/events/${event.id}`} className="block">
        <div className="glass-card-hover rounded-2xl overflow-hidden">
          {/* Cover image */}
          {event.cover_image_path && (
            <div className="h-24 overflow-hidden">
              <img
                src={getImageUrl(event.cover_image_path, 'event-covers')}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-bold text-white line-clamp-1">{event.title}</h3>
              <span className={`badge ${getEventStatusClass(event.status)} mr-2 flex-shrink-0`}>
                {getEventStatusLabel(event.status)}
              </span>
            </div>

            {/* Characters */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 flex items-center gap-2">
                <CharacterImage imagePath={event.character_a.image_path} name={event.character_a.name} size="sm" />
                <span className="text-xs font-medium text-slate-300 truncate">{event.character_a.name}</span>
              </div>
              <div className="text-slate-600 font-bold text-sm">ضد</div>
              <div className="flex-1 flex items-center gap-2 flex-row-reverse">
                <CharacterImage imagePath={event.character_b.image_path} name={event.character_b.name} size="sm" />
                <span className="text-xs font-medium text-slate-300 truncate">{event.character_b.name}</span>
              </div>
            </div>

            {/* Winner display for completed */}
            {event.status === 'completed' && event.winner_character && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Trophy size={12} className="text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">الفائز: {event.winner_character.name}</span>
              </div>
            )}

            {/* Multiplier */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
              <div className="flex items-center gap-1">
                <Flame size={12} className="text-orange-400" />
                <span className="text-xs text-slate-400">مضاعف ×{event.multiplier}</span>
              </div>
              {!isUpcoming && (
                <span className="text-xs text-primary-400 font-medium">عرض التفاصيل ←</span>
              )}
              {isUpcoming && (
                <span className="text-xs text-amber-400 font-medium">قريباً</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
