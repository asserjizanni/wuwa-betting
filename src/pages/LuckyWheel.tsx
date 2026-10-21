import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Coins, Gift, Flame, Info, Clock, Trophy, 
  RotateCw, AlertCircle, CheckCircle2, ChevronRight, History, Award
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useUIStore } from '../store'
import { LuckyWheelCanvas } from '../components/wheel/LuckyWheelCanvas'
import { LuckyWheelWinModal } from '../components/wheel/LuckyWheelWinModal'
import {
  getPlayerLuckyWheelStatus,
  spinLuckyWheel,
  getPlayerSpinHistory,
  DEFAULT_LUCKY_PRIZES
} from '../lib/luckyWheelService'
import type { LuckyWheelPrize, PlayerLuckyWheelStatus, LuckyWheelSpinLog } from '../types/luckyWheel'
import { playWheelWinFanfare } from '../lib/audio'
import toast from 'react-hot-toast'

export function LuckyWheelPage() {
  const { player, isAuthenticated, refreshPlayer } = useAuth()
  const { setLoginModalOpen } = useUIStore()

  // Status & Data
  const [wheelStatus, setWheelStatus] = useState<PlayerLuckyWheelStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [spinHistory, setSpinHistory] = useState<LuckyWheelSpinLog[]>([])
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [rulesModalOpen, setRulesModalOpen] = useState(false)

  // Wheel Animation States
  const [isSpinning, setIsSpinning] = useState(false)
  const [targetIndex, setTargetIndex] = useState<number | null>(null)
  const [wonPrize, setWonPrize] = useState<LuckyWheelPrize | null>(null)
  const [winModalOpen, setWinModalOpen] = useState(false)
  const [rewardDetails, setRewardDetails] = useState<Record<string, any>>({})
  const [newBalance, setNewBalance] = useState<number | undefined>(undefined)

  // Countdown timer for next reset
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  // Load Status
  const loadStatus = async () => {
    try {
      const data = await getPlayerLuckyWheelStatus(player?.id)
      setWheelStatus(data)
    } catch (err) {
      console.error('Failed to load lucky wheel status:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load History
  const loadHistory = async () => {
    if (!player?.id) return
    const logs = await getPlayerSpinHistory(player.id)
    setSpinHistory(logs)
  }

  useEffect(() => {
    loadStatus()
    if (player?.id) {
      loadHistory()
    }
  }, [player?.id])

  // Countdown Interval
  useEffect(() => {
    if (!wheelStatus?.next_reset_at) return

    const calculateTimeLeft = () => {
      const target = new Date(wheelStatus.next_reset_at).getTime()
      const diff = Math.max(0, target - Date.now())

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds })

      // Auto-reload when timer hits zero
      if (diff === 0 && wheelStatus.spins_left === 0) {
        loadStatus()
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [wheelStatus?.next_reset_at, wheelStatus?.spins_left])

  // Active prizes for the wheel
  const activePrizes = useMemo(() => {
    if (wheelStatus?.prizes && wheelStatus.prizes.length > 0) {
      return wheelStatus.prizes
    }
    return DEFAULT_LUCKY_PRIZES
  }, [wheelStatus?.prizes])

  // Handle Spin Click
  const handleSpinClick = async () => {
    if (!isAuthenticated || !player?.id) {
      setLoginModalOpen(true)
      return
    }

    if (isSpinning) return

    if (!wheelStatus?.is_enabled) {
      toast.error('عجلة الحظ معطلة مؤقتاً بأمر الإدارة')
      return
    }

    if (wheelStatus.spins_left <= 0) {
      toast.error('استنفدت جميع محاولاتك في هذه الفترة! انتظر حتى ينتهي المؤقت.')
      return
    }

    setIsSpinning(true)

    try {
      // 1. Call server RPC to safely choose prize and deduct attempt
      const result = await spinLuckyWheel(player.id)

      if (!result.success || !result.prize) {
        throw new Error(result.message || 'حدث خطأ أثناء السحب')
      }

      // 2. Find matching prize in activePrizes list
      let chosenPrize = activePrizes.find(p => p.id === result.prize?.id)
      let segIdx = result.prize.segment_index

      if (!chosenPrize) {
        // Fallback by index or create from result
        segIdx = Math.max(0, Math.min(activePrizes.length - 1, segIdx ?? 0))
        chosenPrize = activePrizes[segIdx] || activePrizes[0]
      }

      setWonPrize(chosenPrize)
      setRewardDetails(result.reward_details || {})
      setNewBalance(result.player_new_balance)

      // 3. Trigger wheel animation towards this segment index
      setTargetIndex(segIdx)

      // Update remaining count in local state
      setWheelStatus(prev => prev ? {
        ...prev,
        spins_left: result.spins_left,
        next_reset_at: result.next_reset_at || prev.next_reset_at
      } : null)

    } catch (err: any) {
      setIsSpinning(false)
      toast.error(err.message || 'تعذر تشغيل العجلة، حاول مرة أخرى')
    }
  }

  // When wheel animation finishes
  const handleSpinEnd = () => {
    setIsSpinning(false)
    playWheelWinFanfare(wonPrize?.is_legendary || false)
    setWinModalOpen(true)
    refreshPlayer()
    loadHistory()
  }

  const formattedCountdown = `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-28 md:pb-20 px-3 sm:px-4 max-w-7xl mx-auto select-none">
      {/* Header Banner */}
      <div className="relative mb-8 sm:mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
          <Sparkles size={14} className="flex-shrink-0" />
          <span>عجلة حظ سولاريس اليومية</span>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-2 sm:mb-3">
          🎡 عجلة الحظ الكبرى
        </h1>
        <p className="text-slate-400 text-xs sm:text-base max-w-2xl mx-auto px-2">
          دوّر العجلة واحصل على دولارات ($) فورية، بطاقات ريزوناتور أسطورية، وألقاب نادرة تُزين ملفك الشخصي.
        </p>

        {/* Top Quick Status Bar */}
        <div className="mt-4 sm:mt-6 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-4 py-2 sm:px-6 sm:py-2.5 rounded-2xl glass-card border border-primary-500/30 shadow-lg text-xs sm:text-sm">
          {isAuthenticated && player ? (
            <>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Coins className="text-amber-400" size={16} />
                <span>رصيدك:</span>
                <span className="font-mono font-bold text-amber-400 number-ltr">
                  ${Number(player.balance || 0).toLocaleString('en-US')}
                </span>
              </div>
              <div className="w-px h-4 bg-slate-700 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-slate-300">
                <RotateCw className="text-primary-400" size={16} />
                <span>المحاولات المتبقية:</span>
                <span className="font-bold text-white px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400">
                  {wheelStatus?.spins_left ?? 1}
                </span>
              </div>
            </>
          ) : (
            <span className="text-slate-400">سجل الدخول للمشاركة ولف عجلة الحظ</span>
          )}

          <button
            onClick={() => setHistoryModalOpen(true)}
            className="mr-2 text-xs text-primary-400 hover:text-primary-300 font-bold flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors"
          >
            <History size={13} />
            <span>سجل جوائزي</span>
          </button>

          <button
            onClick={() => setRulesModalOpen(true)}
            className="text-xs text-slate-400 hover:text-white font-bold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors"
          >
            <Info size={13} />
            <span>الاحتمالات والقواعد</span>
          </button>
        </div>
      </div>

      {/* Main Wheel Arena Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
        
        {/* Left Side: Stats & Info Cards (lg:col-span-4) */}
        <div className="lg:col-span-4 order-2 lg:order-1 space-y-4">
          
          {/* Attempts & Cooldown Card */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-700/60 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <RotateCw size={16} className="text-primary-400" />
                <span>حالة المحاولات</span>
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                (wheelStatus?.spins_left ?? 0) > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {(wheelStatus?.spins_left ?? 0) > 0 ? 'جاهز للدوران' : 'في انتظار التجدد'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-400">محاولات الفترة:</span>
                <span className="font-bold text-white font-mono">
                  {wheelStatus?.spins_per_period ?? 1}
                </span>
              </div>

              {Number(wheelStatus?.extra_spins || 0) > 0 && (
                <div className="flex items-center justify-between text-xs sm:text-sm text-amber-300">
                  <span className="flex items-center gap-1">
                    <Gift size={13} /> محاولات إضافية من الإدارة:
                  </span>
                  <span className="font-bold font-mono">+{wheelStatus?.extra_spins}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-400">إجمالي سحوباتك:</span>
                <span className="font-bold text-white font-mono">
                  {wheelStatus?.total_spins_all_time ?? 0} مرة
                </span>
              </div>

              {/* Cooldown Timer Box */}
              <div className="pt-2 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-amber-400" />
                    <span>تجدد المحاولات القادمة:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-400 tracking-wider">
                    {formattedCountdown}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-primary-500 to-amber-400 h-full rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(100, Math.max(5, ((86400 - (timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds)) / 86400) * 100))}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Last Won Prize Card */}
          {wheelStatus?.last_prize && (
            <div className="glass-card rounded-3xl p-5 border border-primary-500/30 shadow-xl bg-gradient-to-br from-slate-900/90 to-primary-950/20">
              <div className="text-xs text-primary-400 font-bold mb-2 flex items-center gap-1.5">
                <Trophy size={14} />
                <span>آخر جائزة حصلت عليها</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-white">
                    {wheelStatus.last_prize.prize_name}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {new Date(wheelStatus.last_prize.created_at).toLocaleDateString('ar-EG', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-primary-500/20 border border-primary-500/40 flex items-center justify-center text-primary-300">
                  <Award size={20} />
                </div>
              </div>
            </div>
          )}

          {/* Highlights Info */}
          <div className="glass-card rounded-3xl p-4 border border-slate-800 text-xs text-slate-400 leading-relaxed space-y-1.5">
            <p className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>الجوائز النقدية تُضاف مباشرة وفوراً إلى رصيدك الرسمي.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold">✓</span>
              <span>البطاقات المسحوبة تذهب مباشرة إلى مجموعتك القتالية.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <span className="text-purple-400 font-bold">✓</span>
              <span>في حال الفوز بلقب تمتلكه مسبقاً، تحصل على تعويض نقدي فوري.</span>
            </p>
          </div>
        </div>

        {/* Center/Right: Interactive Wheel Canvas Arena (lg:col-span-8) */}
        <div className="lg:col-span-8 order-1 lg:order-2 flex flex-col items-center justify-center">
          
          <div className="relative p-2 sm:p-6 flex items-center justify-center">
            {/* Ambient Background Aura */}
            <div className="absolute inset-0 rounded-full blur-3xl bg-gradient-to-tr from-primary-600/20 via-pink-600/10 to-amber-500/20 -z-10" />

            {/* The Wheel Canvas */}
            <LuckyWheelCanvas
              prizes={activePrizes}
              isSpinning={isSpinning}
              targetIndex={targetIndex}
              onSpinEnd={handleSpinEnd}
              size={Math.min(460, typeof window !== 'undefined' ? window.innerWidth - 48 : 460)}
            />
          </div>

          {/* Spin Trigger Button */}
          <div className="mt-6 flex flex-col items-center w-full max-w-sm px-4">
            <button
              onClick={handleSpinClick}
              disabled={isSpinning || (isAuthenticated && (wheelStatus?.spins_left ?? 1) <= 0)}
              className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg transition-all shadow-2xl flex items-center justify-center gap-2 relative overflow-hidden group ${
                isSpinning
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : !isAuthenticated
                  ? 'btn-primary'
                  : (wheelStatus?.spins_left ?? 1) > 0
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black shadow-[0_0_30px_rgba(245,158,11,0.4)] scale-100 hover:scale-[1.02] active:scale-95'
                  : 'bg-slate-800/80 text-slate-400 cursor-not-allowed border border-slate-700/60'
              }`}
            >
              {isSpinning ? (
                <>
                  <RotateCw size={22} className="animate-spin text-primary-400" />
                  <span>العجلة تدور الآن...</span>
                </>
              ) : !isAuthenticated ? (
                <>
                  <Sparkles size={20} />
                  <span>تسجيل الدخول للمشاركة</span>
                </>
              ) : (wheelStatus?.spins_left ?? 1) > 0 ? (
                <>
                  <Sparkles size={22} className="text-slate-950 animate-pulse" />
                  <span>لَف العجلة الآن ({wheelStatus?.spins_left} محاولة)</span>
                </>
              ) : (
                <>
                  <Clock size={20} />
                  <span>نفدت المحاولات ({formattedCountdown})</span>
                </>
              )}
            </button>

            {isAuthenticated && (wheelStatus?.spins_left ?? 1) <= 0 && (
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                تتجدد المحاولات تلقائياً عند انتهاء مؤقت العد التنازلي أعلاه.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Win Celebration Modal */}
      <LuckyWheelWinModal
        isOpen={winModalOpen}
        onClose={() => setWinModalOpen(false)}
        prize={wonPrize}
        rewardDetails={rewardDetails}
        newBalance={newBalance}
      />

      {/* Rules & Odds Modal */}
      <AnimatePresence>
        {rulesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-lg w-full rounded-3xl p-6 border border-slate-700 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Info size={18} className="text-primary-400" />
                  <span>قواعد واحتمالات عجلة الحظ</span>
                </h3>
                <button
                  onClick={() => setRulesModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                <p className="leading-relaxed">
                  نظام عجلة الحظ في WuWa Betting يعمل بشفافية كاملة واختيار عشوائي آمن من الخادم.
                </p>

                <h4 className="font-bold text-white text-sm pt-2">جدول احتمالات الجوائز النشطة:</h4>
                <div className="space-y-2">
                  {activePrizes.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-bold text-white">{p.name}</span>
                        {p.is_legendary && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            أسطوري
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-primary-400 font-bold">
                        {p.probability_pct ? `${p.probability_pct}%` : `وزن: ${p.weight}`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                  <p>• يتم تحديد النتيجة من جهة الخادم ولا يمكن التلاعب بها من المتصفح.</p>
                  <p>• تُمنح المكافأة في نفس المعاملة الذرية لمنع السحب المزدوج أو الفقدان.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {historyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-lg w-full rounded-3xl p-6 border border-slate-700 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <History size={18} className="text-primary-400" />
                  <span>سجل جوائزي السابقة</span>
                </h3>
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {spinHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  لم تقم بتدوير العجلة بعد. دوّر العجلة الآن لتسجيل أولى جوائزك!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {spinHistory.map(log => (
                    <div
                      key={log.id}
                      className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between text-xs sm:text-sm"
                    >
                      <div>
                        <div className="font-bold text-white">{log.prize_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(log.created_at).toLocaleString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        مستلمة بنجاح ✓
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
