import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Calendar, Gift, Trophy, Check, Flame, 
  Coins, ArrowRight, Swords, Clock, Star, Zap
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useUIStore } from '../store'
import { playOpeningChime } from '../lib/audio'
import toast from 'react-hot-toast'

interface StreakData {
  current_streak: number
  last_claim_date: string | null
  total_claimed: number
}

interface QuestItem {
  id: string
  title_ar: string
  description_ar: string
  category: 'daily' | 'weekly' | 'achievement'
  target_type: string
  target_count: number
  reward_points: number
  icon: string
  progress: number
  is_claimed: boolean
}

const STREAK_REWARDS = [
  { day: 1, reward: 50, label: 'اليوم الأول' },
  { day: 2, reward: 75, label: 'اليوم الثاني' },
  { day: 3, reward: 100, label: 'اليوم الثالث' },
  { day: 4, reward: 150, label: 'اليوم الرابع' },
  { day: 5, reward: 200, label: 'اليوم الخامس' },
  { day: 6, reward: 250, label: 'اليوم السادس' },
  { day: 7, reward: 500, label: 'اليوم السابع (الجائزة الكبرى)' },
]

export function QuestsPage() {
  const { player, isAuthenticated, refreshPlayer } = useAuth()
  const { setLoginModalOpen } = useUIStore()

  const [streak, setStreak] = useState<StreakData>({ current_streak: 0, last_claim_date: null, total_claimed: 0 })
  const [quests, setQuests] = useState<QuestItem[]>([])
  const [activeCategory, setActiveCategory] = useState<'daily' | 'weekly'>('daily')
  const [loading, setLoading] = useState(true)
  const [isClaimingStreak, setIsClaimingStreak] = useState(false)
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null)

  const todayStr = new Date().toISOString().split('T')[0]
  const isAlreadyClaimedToday = streak.last_claim_date === todayStr

  useEffect(() => {
    loadData()
  }, [player?.id])

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Load streak if logged in
      if (player?.id) {
        const { data: streakData } = await supabase
          .from('player_streaks')
          .select('current_streak, last_claim_date, total_claimed')
          .eq('player_id', player.id)
          .maybeSingle()

        if (streakData) {
          setStreak(streakData)
        }
      }

      // 2. Load quests with real player progress via sync_player_quests RPC
      if (player?.id) {
        const { data: syncedQuests, error: syncError } = await supabase.rpc('sync_player_quests', {
          p_player_id: player.id,
        })

        if (!syncError && syncedQuests && Array.isArray(syncedQuests)) {
          setQuests(syncedQuests)
          return
        }
      }

      // Fallback if not logged in or sync fails
      const { data: questsData } = await supabase
        .from('quests')
        .select('*')
        .eq('is_active', true)
        .order('reward_points', { ascending: true })

      if (questsData) {
        setQuests(questsData.map(q => ({ ...q, progress: 0, is_claimed: false })))
      }
    } catch (err) {
      console.error('Error loading quests:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimStreak = async () => {
    if (!isAuthenticated || !player?.id) {
      setLoginModalOpen(true)
      return
    }

    if (isAlreadyClaimedToday) {
      toast.error('لقد استلمت مكافأة اليوم بالفعل! عد غداً للمكافأة التالية.')
      return
    }

    setIsClaimingStreak(true)
    try {
      const { data: result, error } = await supabase.rpc('claim_daily_streak', {
        p_player_id: player.id
      })

      if (error) throw new Error(error.message)
      if (!result?.success) throw new Error(result?.message || 'فشل استلام المكافأة')

      toast.success(`مبارك! حصلت على ${result.reward} نقطة! 🎁 (الستريك الحالي: ${result.current_streak} أيام)`)
      playOpeningChime('epic')
      refreshPlayer()
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء استلام المكافأة')
    } finally {
      setIsClaimingStreak(false)
    }
  }

  const handleClaimQuest = async (questId: string) => {
    if (!isAuthenticated || !player?.id) {
      setLoginModalOpen(true)
      return
    }

    setClaimingQuestId(questId)
    try {
      const { data: result, error } = await supabase.rpc('claim_quest', {
        p_player_id: player.id,
        p_quest_id: questId,
      })

      if (error) throw new Error(error.message)
      if (!result?.success) throw new Error(result?.message || 'فشل استلام مكافأة المهمة')

      toast.success(`مبارك! استلمت ${result.reward_points} نقطة إضافية! 🌟`)
      playOpeningChime('legendary')
      refreshPlayer()
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'فشل استلام المكافأة')
    } finally {
      setClaimingQuestId(null)
    }
  }

  const dailyQuests = quests.filter(q => q.category === 'daily')
  const weeklyQuests = quests.filter(q => q.category === 'weekly')
  const filteredQuests = activeCategory === 'daily' ? dailyQuests : weeklyQuests
  const readyDailyCount = dailyQuests.filter(q => q.progress >= q.target_count && !q.is_claimed).length
  const readyWeeklyCount = weeklyQuests.filter(q => q.progress >= q.target_count && !q.is_claimed).length

  const renderQuestIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame size={20} className="text-orange-400" />
      case 'Swords': return <Swords size={20} className="text-rose-400" />
      case 'Gift': return <Gift size={20} className="text-amber-400" />
      case 'Trophy': return <Trophy size={20} className="text-yellow-400" />
      case 'Clock': return <Clock size={20} className="text-blue-400" />
      case 'Star': return <Star size={20} className="text-amber-400" />
      case 'Zap': return <Zap size={20} className="text-purple-400" />
      default: return <Sparkles size={20} className="text-primary-400" />
    }
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-28 md:pb-20 px-3 sm:px-4 max-w-7xl mx-auto space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold">
          <Gift size={14} />
          المكافآت والمهام اليومية والأسبوعية
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white">المهام وتسجيل الدخول</h1>
        <p className="text-slate-400 text-sm">
          سجل دخولك يومياً لترقية ستريك المكافآت، وأكمل المهام لتحصل على آلاف النقاط المجانية لفتح الصناديق!
        </p>
      </div>

      {/* 7-Day Login Streak Board */}
      <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="text-orange-500 fill-orange-500" size={24} />
              <h2 className="text-2xl font-black text-white">سلسلة تسجيل الدخول (7 أيام)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              الستريك المتواصل حالياً: <strong className="text-amber-400 font-bold">{streak.current_streak} أيام</strong> • إجمالي الأيام المستلمة: <strong className="text-white">{streak.total_claimed}</strong>
            </p>
          </div>

          <button
            onClick={handleClaimStreak}
            disabled={isAlreadyClaimedToday || isClaimingStreak}
            className={`py-3 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              isAlreadyClaimedToday
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'btn-primary'
            }`}
          >
            {isAlreadyClaimedToday ? (
              <>
                <Check size={18} /> تم استلام مكافأة اليوم
              </>
            ) : (
              <>
                <Gift size={18} /> {isClaimingStreak ? 'جاري الاستلام...' : 'استلام مكافأة اليوم'}
              </>
            )}
          </button>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {STREAK_REWARDS.map((item) => {
            const isCompleted = streak.current_streak >= item.day
            const isToday = (streak.current_streak % 7) + 1 === item.day && !isAlreadyClaimedToday
            const isGrand = item.day === 7

            return (
              <motion.div
                key={item.day}
                whileHover={{ y: -4 }}
                className={`rounded-2xl p-4 flex flex-col items-center text-center relative border transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : isToday
                    ? 'bg-primary-950/40 border-primary-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                } ${isGrand ? 'ring-2 ring-amber-500/50' : ''}`}
              >
                {isGrand && (
                  <span className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase">
                    VIP كبرى
                  </span>
                )}

                <span className="text-[11px] font-bold mb-2">اليوم {item.day}</span>

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isGrand
                    ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {isCompleted ? <Check size={20} /> : isGrand ? <Trophy size={22} /> : <Coins size={20} />}
                </div>

                <span className="text-sm font-black text-amber-400">+{item.reward}</span>
                <span className="text-[10px] text-slate-500">نقطة</span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Quests Section */}
      <div className="space-y-6">
        {/* Category Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3 flex-wrap">
          <button
            onClick={() => setActiveCategory('daily')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 relative ${
              activeCategory === 'daily'
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock size={16} /> مهام يومية ({dailyQuests.length})
            {readyDailyCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-400 text-black font-black animate-bounce shadow">
                {readyDailyCount} جاهزة!
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveCategory('weekly')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 relative ${
              activeCategory === 'weekly'
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy size={16} /> مهام أسبوعية ({weeklyQuests.length})
            {readyWeeklyCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-400 text-black font-black animate-bounce shadow">
                {readyWeeklyCount} جاهزة!
              </span>
            )}
          </button>
        </div>

        {/* Quests List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuests.map((quest) => {
            const isReadyToClaim = quest.progress >= quest.target_count && !quest.is_claimed
            const pct = Math.min(100, Math.round((quest.progress / quest.target_count) * 100))

            return (
              <motion.div
                key={quest.id}
                whileHover={{ y: -3 }}
                className={`glass-card p-5 rounded-2xl border flex flex-col justify-between space-y-4 shadow-lg transition-all ${
                  isReadyToClaim 
                    ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-gradient-to-br from-amber-500/5 via-slate-900 to-slate-950' 
                    : 'border-slate-700/60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-inner">
                      {renderQuestIcon(quest.icon)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        {quest.title_ar}
                        {isReadyToClaim && (
                          <span className="px-1.5 py-0.5 text-[9px] rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black">
                            مكتملة!
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {quest.description_ar}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black flex-shrink-0">
                    <Coins size={14} /> +{quest.reward_points}
                  </div>
                </div>

                {/* Progress Bar & Claim Button */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>التقدم:</span>
                    <span className="font-bold text-white">
                      {Math.min(quest.progress, quest.target_count)} / {quest.target_count}
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="pt-2">
                    {quest.is_claimed ? (
                      <div className="w-full py-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                        <Check size={14} /> تم استلام المكافأة
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaimQuest(quest.id)}
                        disabled={!isReadyToClaim || claimingQuestId === quest.id}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isReadyToClaim
                            ? 'btn-primary shadow-lg animate-pulse'
                            : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-800'
                        }`}
                      >
                        {isReadyToClaim ? (
                          <>
                            <Gift size={14} /> {claimingQuestId === quest.id ? 'جاري الاستلام...' : 'استلام المكافأة'}
                          </>
                        ) : (
                          'قيد الإنجاز'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
