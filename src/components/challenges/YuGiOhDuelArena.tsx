import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Swords, Trophy, Play, Pause, SkipForward, RotateCcw, 
  X, Shield, Zap, Sparkles, Heart, Flame, Volume2, VolumeX,
  FastForward, Award, FileText
} from 'lucide-react'
import { CardRenderer } from '../shared/CardRenderer'
import { playDuelClashSound, playLpDamageSound, playDuelVictoryFanfare } from '../../lib/audio'
import type { Card } from '../../types/database'

export interface DuelCardData {
  id?: string
  name: string
  image_path?: string
  element?: string
  rarity?: string
  atk: number
  def: number
  hp: number
  max_hp: number
}

export interface YuGiOhDuelArenaProps {
  isOpen: boolean
  onClose: () => void
  challengeTitle?: string
  stake: number
  winnerName: string | null
  winnerId?: string | null
  challenger: {
    id: string
    name: string
    card?: Partial<Card> | null
    cardName?: string
    cardImage?: string
    element?: string
    rarity?: string
    atk?: number
    def?: number
    hp?: number
    max_hp?: number
  }
  challenged: {
    id: string
    name: string
    card?: Partial<Card> | null
    cardName?: string
    cardImage?: string
    element?: string
    rarity?: string
    atk?: number
    def?: number
    hp?: number
    max_hp?: number
  }
  combatLog: any[]
  currentUserId?: string
}

export function YuGiOhDuelArena({
  isOpen,
  onClose,
  challengeTitle = 'ساحة المبارزة الكبرى — WuWa Resonance Arena',
  stake,
  winnerName,
  winnerId,
  challenger,
  challenged,
  combatLog,
  currentUserId,
}: YuGiOhDuelArenaProps) {
  const baseLp = 1200

  // Helper to normalize LP (scales any legacy 4000 LP log to 1200)
  const normalizeLp = (val?: number): number => {
    if (val === undefined || isNaN(val)) return baseLp
    if (val > 1200) return Math.max(0, Math.round((val / 4000) * 1200))
    return Math.max(0, Math.round(val))
  }

  // Safe extraction of turn logs
  const turns = useMemo(() => {
    if (!combatLog || !Array.isArray(combatLog) || combatLog.length === 0) {
      return []
    }
    return combatLog.map((item, idx) => {
      if (typeof item === 'string') {
        const cleanMsg = item.replace(/رنين/g, 'Resonance').replace(/4000\s*(نقطة|LP)/g, '1200 $1')
        return {
          turn: idx,
          message: cleanMsg,
          type: cleanMsg.includes('فوز') || cleanMsg.includes('انتصار') ? 'victory' : 'attack',
          phase: 'BATTLE_PHASE',
          actor: idx % 2 === 0 ? challenger.name : challenged.name,
          damage: 120,
          challenger_lp: Math.max(0, baseLp - (idx * 110)),
          challenged_lp: Math.max(0, baseLp - (idx * 140)),
        }
      }
      const rawMsg = item.message || item.text || 'اشتباك في ساحة Resonance'
      const cleanMsg = rawMsg.replace(/رنين/g, 'Resonance').replace(/4000\s*(نقطة|LP)/g, '1200 $1')
      const rawDmg = Number(item.damage || 0)
      const dmg = rawDmg > 300 ? Math.round(rawDmg / 8) : rawDmg

      return {
        turn: item.turn ?? idx,
        message: cleanMsg,
        type: item.type || 'attack',
        phase: item.phase || 'BATTLE_PHASE',
        actor: item.actor || (item.turn % 2 === 0 ? challenger.name : challenged.name),
        actor_card: item.actor_card,
        target: item.target,
        target_card: item.target_card,
        damage: dmg,
        counter_damage: Number(item.counter_damage || 0),
        is_crit: Boolean(item.is_crit),
        challenger_lp: item.challenger_lp !== undefined ? normalizeLp(Number(item.challenger_lp)) : undefined,
        challenged_lp: item.challenged_lp !== undefined ? normalizeLp(Number(item.challenged_lp)) : undefined,
      }
    })
  }, [combatLog, challenger.name, challenged.name])

  const maxStep = Math.max(0, turns.length - 1)
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [playSpeed, setPlaySpeed] = useState<number>(1)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const [floatingDamage, setFloatingDamage] = useState<{ amount: number; isCrit: boolean; target: 'challenger' | 'challenged' } | null>(null)

  const logContainerRef = useRef<HTMLDivElement>(null)

  // Reset when arena opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setIsPlaying(true)
      setFloatingDamage(null)
    }
  }, [isOpen])

  // Compute active stats based on currentStep
  const activeState = useMemo(() => {
    if (turns.length === 0) {
      return {
        challengerLp: challenger.hp ? normalizeLp(challenger.hp) : baseLp,
        challengedLp: challenged.hp ? normalizeLp(challenged.hp) : baseLp,
        currentLog: 'في انتظار بدء الجولة الأولى من مبارزة Resonance...',
        currentPhase: 'DUEL_START',
        activeAttacker: null,
      }
    }

    const currentTurnObj = turns[currentStep] || turns[0]
    const cLp = currentTurnObj.challenger_lp !== undefined ? currentTurnObj.challenger_lp : baseLp
    const dLp = currentTurnObj.challenged_lp !== undefined ? currentTurnObj.challenged_lp : baseLp

    return {
      challengerLp: cLp,
      challengedLp: dLp,
      currentLog: currentTurnObj.message,
      currentPhase: currentTurnObj.phase || 'BATTLE_PHASE',
      activeAttacker: currentTurnObj.actor === challenger.name ? 'challenger' : 'challenged',
      damage: currentTurnObj.damage,
      isCrit: currentTurnObj.is_crit,
      type: currentTurnObj.type,
    }
  }, [turns, currentStep, challenger, challenged])

  // Auto-play timer
  useEffect(() => {
    if (!isOpen || !isPlaying) return

    if (currentStep >= maxStep) {
      setIsPlaying(false)
      if (soundEnabled) playDuelVictoryFanfare()
      return
    }

    const intervalTime = playSpeed === 1 ? 1600 : 800
    const timer = setTimeout(() => {
      handleStepForward()
    }, intervalTime)

    return () => clearTimeout(timer)
  }, [isOpen, isPlaying, currentStep, maxStep, playSpeed])

  // Auto scroll log to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [currentStep])

  const handleStepForward = () => {
    if (currentStep < maxStep) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      const nextTurn = turns[nextStep]

      if (soundEnabled && nextTurn) {
        if (nextTurn.damage > 0 || nextTurn.counter_damage > 0) {
          playDuelClashSound()
          setTimeout(() => playLpDamageSound(), 120)
        }
      }

      if (nextTurn && (nextTurn.damage > 0 || nextTurn.counter_damage > 0)) {
        const isChallengerHit = nextTurn.actor === challenged.name || nextTurn.counter_damage > 0
        setFloatingDamage({
          amount: nextTurn.damage || nextTurn.counter_damage,
          isCrit: Boolean(nextTurn.is_crit),
          target: isChallengerHit ? 'challenger' : 'challenged',
        })
        setTimeout(() => setFloatingDamage(null), 900)
      }
    } else {
      setIsPlaying(false)
    }
  }

  const handleStepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setIsPlaying(false)
    }
  }

  const handleSkipToEnd = () => {
    setCurrentStep(maxStep)
    setIsPlaying(false)
    if (soundEnabled) playDuelVictoryFanfare()
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setIsPlaying(true)
  }

  if (!isOpen) return null

  // Participant cards with real card name (NOT player username)
  const challengerCardData: Partial<Card> = challenger.card || {
    name: challenger.cardName || 'Changli - Blazing Phoenix',
    element: (challenger.element as any) || 'Fusion',
    rarity: (challenger.rarity as any) || 'legendary',
    image_path: challenger.cardImage || '/characters/changli.webp',
    stats: {
      atk: challenger.atk || 180,
      def: challenger.def || 90,
      hp: baseLp,
    },
  }

  const challengedCardData: Partial<Card> = challenged.card || {
    name: challenged.cardName || 'Jiyan - Dragon of Midnight',
    element: (challenged.element as any) || 'Aero',
    rarity: (challenged.rarity as any) || 'epic',
    image_path: challenged.cardImage || '/characters/jiyan.webp',
    stats: {
      atk: challenged.atk || 180,
      def: challenged.def || 90,
      hp: baseLp,
    },
  }

  const isDuelFinished = currentStep >= maxStep
  const finalWinner = winnerName || (activeState.challengerLp > activeState.challengedLp ? challenger.name : challenged.name)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-hidden" dir="rtl">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-[#070712] border border-amber-500/40 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col max-h-[96vh]"
        >
          {/* Top Bar */}
          <div className="relative px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-glow-amber flex-shrink-0">
                <Swords size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-black text-amber-300 truncate">
                    ساحة مبارزة Resonance الكبرى
                  </h2>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    RESONANCE DUEL
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  الجائزة: <span className="text-amber-400 font-bold">{stake * 2} نقطة</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border transition-all ${
                  soundEnabled ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
                title={soundEnabled ? 'كتم المؤثرات الصوتية' : 'تفعيل المؤثرات الصوتية'}
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Main Field Body */}
          <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4">
            
            {/* Phase & Round Bar */}
            <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-slate-400 truncate">
                <span className="text-amber-400">المرحلة:</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px]">
                  {activeState.currentPhase === 'DUEL_START' ? 'مرحلة البداية (START)'
                    : activeState.currentPhase === 'BATTLE_PHASE' ? 'مرحلة الهجوم (BATTLE PHASE)'
                    : activeState.currentPhase === 'COUNTER_STEP' ? 'رد الضرر (COUNTER STEP)'
                    : activeState.currentPhase === 'VICTORY' ? 'حسم المبارزة (VICTORY)'
                    : activeState.currentPhase}
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                <span>الجولة:</span>
                <strong className="text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                  {currentStep + 1} / {Math.max(1, turns.length)}
                </strong>
              </div>
            </div>

            {/* Duel Mat: Responsive Grid (Side-by-side on both phone and PC) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 relative">
              
              {/* Floating Damage Alert */}
              {floatingDamage && (
                <div
                  className={`absolute top-1/2 z-30 pointer-events-none transform -translate-y-1/2 animate-bounce ${
                    floatingDamage.target === 'challenger' ? 'right-1/4' : 'left-1/4'
                  }`}
                >
                  <motion.div
                    initial={{ scale: 0.5, y: 10, opacity: 0 }}
                    animate={{ scale: 1.2, y: -20, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl font-black font-mono shadow-2xl text-xs sm:text-base flex items-center gap-1 ${
                      floatingDamage.isCrit
                        ? 'bg-red-600 text-yellow-200 border-2 border-yellow-300 shadow-glow-amber'
                        : 'bg-red-700/90 text-white border border-red-400'
                    }`}
                  >
                    <Flame size={14} />
                    -{floatingDamage.amount} LP!
                    {floatingDamage.isCrit && <span className="text-[9px] font-sans text-yellow-300">حرجة!</span>}
                  </motion.div>
                </div>
              )}

              {/* Challenger Zone */}
              <div
                className={`relative rounded-2xl p-2.5 sm:p-4 border transition-all duration-300 flex flex-col justify-between ${
                  activeState.activeAttacker === 'challenger'
                    ? 'bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border-blue-500/60 shadow-[0_0_25px_rgba(59,130,246,0.2)] ring-1 ring-blue-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                {/* Header with Player Profile & LP */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center font-black text-white text-xs sm:text-sm shadow-md flex-shrink-0">
                      {challenger.name[0]?.toUpperCase() || 'C'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] sm:text-xs font-black text-white truncate">{challenger.name}</span>
                        <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-bold flex-shrink-0">المتحدي</span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block truncate">{challengerCardData.name}</span>
                    </div>
                  </div>

                  {/* LP Counter */}
                  <div className="text-left bg-black/70 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl border border-blue-500/30 flex sm:block items-center justify-between flex-shrink-0">
                    <span className="text-[8px] sm:text-[9px] font-black uppercase text-blue-400 block mr-1 sm:mr-0">LIFE POINTS</span>
                    <strong className={`font-mono text-xs sm:text-base font-black ${activeState.challengerLp <= 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                      {Math.round(activeState.challengerLp)} <span className="text-[9px] text-blue-400">LP</span>
                    </strong>
                  </div>
                </div>

                {/* LP Health Bar (Max 1200) */}
                <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-900 border border-slate-800 p-0.5 mb-2 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300"
                    animate={{ width: `${Math.max(0, Math.min(100, (activeState.challengerLp / baseLp) * 100))}%` }}
                  />
                </div>

                {/* Card Display with Unobstructed Character Art */}
                <div className="flex flex-col items-center justify-center py-1">
                  <div className="w-full max-w-[160px] sm:max-w-[190px] h-36 sm:h-52 md:h-60 rounded-2xl overflow-hidden border border-blue-500/40 shadow-lg relative bg-black">
                    <img
                      src={challengerCardData.image_path || '/characters/changli.webp'}
                      alt={challengerCardData.name}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-85" />
                    <div className="absolute bottom-1 inset-x-1 p-1 text-center">
                      <span className="text-[10px] sm:text-xs font-black text-white block drop-shadow-md truncate">
                        {challengerCardData.name}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-mono text-amber-300 font-bold block">
                        ⚔️ {challenger.atk || 180} • 🛡️ {challenger.def || 90}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Challenged Zone */}
              <div
                className={`relative rounded-2xl p-2.5 sm:p-4 border transition-all duration-300 flex flex-col justify-between ${
                  activeState.activeAttacker === 'challenged'
                    ? 'bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.2)] ring-1 ring-red-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                {/* Header with Player Profile & LP */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center font-black text-white text-xs sm:text-sm shadow-md flex-shrink-0">
                      {challenged.name[0]?.toUpperCase() || 'O'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] sm:text-xs font-black text-white truncate">{challenged.name}</span>
                        <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded-full bg-red-500/20 text-red-300 font-bold flex-shrink-0">المنافس</span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block truncate">{challengedCardData.name}</span>
                    </div>
                  </div>

                  {/* LP Counter */}
                  <div className="text-left bg-black/70 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl border border-red-500/30 flex sm:block items-center justify-between flex-shrink-0">
                    <span className="text-[8px] sm:text-[9px] font-black uppercase text-red-400 block mr-1 sm:mr-0">LIFE POINTS</span>
                    <strong className={`font-mono text-xs sm:text-base font-black ${activeState.challengedLp <= 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                      {Math.round(activeState.challengedLp)} <span className="text-[9px] text-red-400">LP</span>
                    </strong>
                  </div>
                </div>

                {/* LP Health Bar (Max 1200) */}
                <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-900 border border-slate-800 p-0.5 mb-2 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300"
                    animate={{ width: `${Math.max(0, Math.min(100, (activeState.challengedLp / baseLp) * 100))}%` }}
                  />
                </div>

                {/* Card Display with Unobstructed Character Art */}
                <div className="flex flex-col items-center justify-center py-1">
                  <div className="w-full max-w-[160px] sm:max-w-[190px] h-36 sm:h-52 md:h-60 rounded-2xl overflow-hidden border border-red-500/40 shadow-lg relative bg-black">
                    <img
                      src={challengedCardData.image_path || '/characters/jiyan.webp'}
                      alt={challengedCardData.name}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-85" />
                    <div className="absolute bottom-1 inset-x-1 p-1 text-center">
                      <span className="text-[10px] sm:text-xs font-black text-white block drop-shadow-md truncate">
                        {challengedCardData.name}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-mono text-amber-300 font-bold block">
                        ⚔️ ATK {challenged.atk || 180} • 🛡️ DEF {challenged.def || 90}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Commentary Ticker */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-amber-500/30 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Sparkles size={16} className="animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black uppercase text-amber-400 block mb-0.5">
                  تعليق ساحة المعركة الحية
                </span>
                <p className="text-xs font-bold text-slate-100 leading-relaxed break-words">
                  {activeState.currentLog}
                </p>
              </div>
            </div>

            {/* Victory Banner */}
            {isDuelFinished && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black text-center border border-yellow-200 shadow-xl space-y-1.5"
              >
                <div className="inline-flex items-center gap-1.5 text-lg sm:text-xl font-black uppercase tracking-wider">
                  <Trophy size={22} />
                  DUEL VICTORY — انتصار ساحق!
                </div>
                <p className="text-xs sm:text-sm font-black text-slate-950">
                  توج البطل <span className="underline">{finalWinner}</span> فائزاً بالمواجهة وحصل على الجائزة {stake * 2} نقطة!
                </p>
              </motion.div>
            )}

            {/* Turn Log History */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-black text-slate-300 flex items-center gap-1.5">
                <FileText size={13} className="text-amber-400" />
                سجل أحداث وقائع المبارزة ({turns.length} جولة)
              </h4>
              <div
                ref={logContainerRef}
                className="p-3 rounded-xl bg-black/60 border border-slate-800 space-y-1.5 max-h-36 overflow-y-auto font-mono text-[10px] leading-relaxed"
              >
                {turns.slice(0, currentStep + 1).map((turnObj, idx) => {
                  const isCurrent = idx === currentStep
                  const text = turnObj.message || ''
                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border text-[10px] transition-all ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 font-bold'
                          : text.includes('فوز') || text.includes('انتصار')
                          ? 'bg-green-500/10 border-green-500/30 text-green-300 font-bold'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      {text}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Replay Controls Footer - Fully Responsive for Mobile & PC */}
          <div className="px-4 py-3 bg-slate-950/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handleRestart}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                title="إعادة"
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-black text-xs flex items-center gap-1.5 shadow-glow-amber transition-all"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? 'إيقاف' : 'تشغيل تلقائي'}
              </button>

              <button
                onClick={handleStepForward}
                disabled={currentStep >= maxStep}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 transition-all"
                title="التالي"
              >
                <SkipForward size={14} />
              </button>

              <button
                onClick={() => setPlaySpeed(playSpeed === 1 ? 2 : 1)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700 hover:text-white transition-all flex items-center gap-1"
                title="السرعة"
              >
                <FastForward size={12} />
                {playSpeed}x
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSkipToEnd}
                disabled={currentStep >= maxStep}
                className="btn-secondary text-[11px] py-2 px-3 font-bold disabled:opacity-40"
              >
                تخطي إلى النتيجة
              </button>
              <button
                onClick={onClose}
                className="btn-primary text-[11px] py-2 px-5 font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
