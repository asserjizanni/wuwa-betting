import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Swords, Shield, Heart, Flame, Zap, Sparkles, Volume2, 
  VolumeX, Trophy, Play, CheckCircle2, AlertCircle,
  HelpCircle, Clock, ShieldAlert, Award, Radio
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { playDuelClashSound, playLpDamageSound, playDuelVictoryFanfare } from '../../lib/audio'
import toast from 'react-hot-toast'

export interface WuWaDuelCard {
  id: string
  card_id?: string
  name: string
  element: 'Spectro' | 'Havoc' | 'Aero' | 'Electro' | 'Fusion' | 'Glacio' | string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | string
  atk: number
  def: number
  image_path: string
  type?: 'resonator' | 'support' | string
  skill?: string
}

export interface UnoManualDuelArenaProps {
  isOpen: boolean
  onClose: () => void
  challengeId: string
  currentUserId: string
  challengerName: string
  challengedName: string
  stake: number
  onDuelCompleted?: () => void
}

const ELEMENT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  Spectro: { bg: 'from-amber-600/40 to-yellow-900/60', border: 'border-amber-400', text: 'text-amber-300', glow: 'shadow-amber-500/50' },
  Havoc: { bg: 'from-rose-900/60 to-purple-950/80', border: 'border-rose-500', text: 'text-rose-300', glow: 'shadow-rose-500/50' },
  Aero: { bg: 'from-emerald-700/40 to-teal-950/70', border: 'border-emerald-400', text: 'text-emerald-300', glow: 'shadow-emerald-500/50' },
  Electro: { bg: 'from-purple-800/50 to-indigo-950/80', border: 'border-purple-400', text: 'text-purple-300', glow: 'shadow-purple-500/50' },
  Fusion: { bg: 'from-red-700/50 to-orange-950/80', border: 'border-orange-500', text: 'text-orange-300', glow: 'shadow-orange-500/50' },
  Glacio: { bg: 'from-cyan-700/40 to-blue-950/70', border: 'border-cyan-400', text: 'text-cyan-300', glow: 'shadow-cyan-500/50' },
}

export function UnoManualDuelArena({
  isOpen,
  onClose,
  challengeId,
  currentUserId,
  challengerName,
  challengedName,
  stake,
  onDuelCompleted,
}: UnoManualDuelArenaProps) {
  const [loading, setLoading] = useState<boolean>(true)
  const [isBothReady, setIsBothReady] = useState<boolean>(false)
  const [challengerReady, setChallengerReady] = useState<boolean>(false)
  const [challengedReady, setChallengedReady] = useState<boolean>(false)
  
  const [challengerId, setChallengerId] = useState<string | null>(null)
  const [challengedId, setChallengedId] = useState<string | null>(null)
  
  const [myHand, setMyHand] = useState<WuWaDuelCard[]>([])
  const [opponentHandCount, setOpponentHandCount] = useState<number>(5)
  const [tableCards, setTableCards] = useState<any[]>([])
  const [combatLog, setCombatLog] = useState<any[]>([])
  
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<string | null>(null)
  const [isPlayingCard, setIsPlayingCard] = useState<boolean>(false)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false)
  
  const [challengerLp, setChallengerLp] = useState<number>(1200)
  const [challengedLp, setChallengedLp] = useState<number>(1200)
  const [challengerShield, setChallengerShield] = useState<number>(0)
  const [challengedShield, setChallengedShield] = useState<number>(0)
  
  const [floatingDamage, setFloatingDamage] = useState<{ amount: number; text: string; isCrit?: boolean } | null>(null)
  const [duelWinner, setDuelWinner] = useState<string | null>(null)
  const [duelWinReason, setDuelWinReason] = useState<string | null>(null)
  const [isPassingTurn, setIsPassingTurn] = useState<boolean>(false)
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)

  const logRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  // Determine role based on actual current user id
  const isChallenger = challengerId ? currentUserId === challengerId : false
  const isMyTurn = currentTurnPlayerId === currentUserId

  const myName = isChallenger ? challengerName : challengedName
  const opponentName = isChallenger ? challengedName : challengerName
  const myLp = isChallenger ? challengerLp : challengedLp
  const opponentLp = isChallenger ? challengedLp : challengerLp
  const myShield = isChallenger ? challengerShield : challengedShield
  const opponentShield = isChallenger ? challengedShield : challengerShield

  // Initialize and check status
  useEffect(() => {
    if (isOpen && challengeId) {
      initDuelState()
    }
  }, [isOpen, challengeId])

  // Realtime subscription for opponent moves + client broadcast channel
  useEffect(() => {
    if (!isOpen || !challengeId) return

    const channel = supabase
      .channel(`pvp_duel_sync_${challengeId}`, {
        config: { broadcast: { self: false } },
      })
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pvp_challenges', filter: `id=eq.${challengeId}` },
        (payload: any) => {
          handleStateUpdate(payload.new)
        }
      )
      .on('broadcast', { event: 'card_played_action' }, (event: any) => {
        // Fast optimistic sync for opponent move
        if (event.payload) {
          if (soundEnabled) {
            playDuelClashSound()
            playLpDamageSound()
          }
          if (event.payload.damage) {
            setFloatingDamage({
              amount: event.payload.damage,
              text: `-${event.payload.damage} LP`,
              isCrit: event.payload.isCrit,
            })
            setTimeout(() => setFloatingDamage(null), 1800)
          }
        }
      })
      .on('broadcast', { event: 'turn_passed_action' }, (event: any) => {
        if (event.payload?.is_finished) {
          const winner = event.payload.winner_id === currentUserId ? `${myName} (أنت) 👑` : opponentName
          setDuelWinner(winner)
          if (event.payload.win_reason) setDuelWinReason(event.payload.win_reason)
          if (soundEnabled) playDuelVictoryFanfare()
          if (onDuelCompleted) onDuelCompleted()
        } else if (event.payload?.current_turn_player_id) {
          setCurrentTurnPlayerId(event.payload.current_turn_player_id)
        }
      })
      .on('broadcast', { event: 'duel_started' }, () => {
        setIsBothReady(true)
      })
      .subscribe((status: string) => {
        setIsLiveConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [isOpen, challengeId, soundEnabled])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [combatLog])

  const initDuelState = async () => {
    setLoading(true)
    try {
      // First get challenge details to know challenger_id and challenged_id
      const { data: chalRecord, error: chalErr } = await supabase
        .from('pvp_challenges')
        .select('*')
        .eq('id', challengeId)
        .single()

      if (chalErr) throw chalErr

      setChallengerId(chalRecord.challenger_id)
      setChallengedId(chalRecord.challenged_id)

      // Join/Initialize via backend RPC
      const { data, error } = await supabase.rpc('enter_wuwa_card_duel', {
        p_challenge_id: challengeId,
        p_player_id: currentUserId,
      })

      if (error) throw error

      if (data?.success) {
        setIsBothReady(data.both_ready)
        setChallengerReady(data.challenger_ready)
        setChallengedReady(data.challenged_ready)
        setCurrentTurnPlayerId(data.current_turn_player_id)

        const bs = data.battle_state || {}
        setChallengerLp(Number(bs.challenger?.hp ?? 1200))
        setChallengedLp(Number(bs.challenged?.hp ?? 1200))
        setChallengerShield(Number(bs.challenger?.shield ?? 0))
        setChallengedShield(Number(bs.challenged?.shield ?? 0))

        setTableCards(data.table_cards || [])
        setCombatLog(data.combat_log || [])

        const userIsChallenger = chalRecord.challenger_id === currentUserId
        const hand = userIsChallenger ? data.challenger_hand : data.challenged_hand
        const oppHand = userIsChallenger ? data.challenged_hand : data.challenger_hand
        setMyHand(hand || [])
        setOpponentHandCount((oppHand || []).length)
      }
    } catch (err: any) {
      toast.error(err?.message || 'فشل تجهيز غرفة مبارزة كروت WuWa')
    } finally {
      setLoading(false)
    }
  }

  const handleStateUpdate = (record: any) => {
    if (!record) return

    setIsBothReady(record.challenger_ready && record.challenged_ready)
    setChallengerReady(record.challenger_ready)
    setChallengedReady(record.challenged_ready)
    setCurrentTurnPlayerId(record.current_turn_player_id)

    const bs = record.battle_state || {}
    setChallengerLp(Number(bs.challenger?.hp ?? 1200))
    setChallengedLp(Number(bs.challenged?.hp ?? 1200))
    setChallengerShield(Number(bs.challenger?.shield ?? 0))
    setChallengedShield(Number(bs.challenged?.shield ?? 0))

    setTableCards(record.table_cards || [])
    setCombatLog(record.combat_log || [])

    const userIsChallenger = record.challenger_id === currentUserId
    const hand = userIsChallenger ? record.challenger_hand : record.challenged_hand
    const oppHand = userIsChallenger ? record.challenged_hand : record.challenger_hand
    if (hand) setMyHand(hand)
    if (oppHand) setOpponentHandCount(oppHand.length)

    if (record.status === 'completed' && record.winner_id) {
      const winner = record.winner_id === record.challenger_id ? challengerName : challengedName
      setDuelWinner(winner)
      if (soundEnabled) playDuelVictoryFanfare()
      if (onDuelCompleted) onDuelCompleted()
    }
  }

  // Play a WuWa resonator card manually onto the table
  const handlePlayCard = async (card: WuWaDuelCard, index: number) => {
    if (!isMyTurn) {
      toast.error('ليس دورك بعد! انتظر حركة الخصم ⏳')
      return
    }

    if (isPlayingCard) return
    setIsPlayingCard(true)
    setSelectedCardIndex(index)

    if (soundEnabled) playDuelClashSound()

    try {
      const { data, error } = await supabase.rpc('play_manual_card_turn', {
        p_challenge_id: challengeId,
        p_player_id: currentUserId,
        p_card_id: card.id,
      })

      if (error) throw error

      if (data?.success) {
        if (soundEnabled) playLpDamageSound()

        const bs = data.battle_state || {}
        setChallengerLp(Number(bs.challenger?.hp ?? 1200))
        setChallengedLp(Number(bs.challenged?.hp ?? 1200))
        setTableCards(data.table_cards || [])
        setCombatLog(data.combat_log || [])

        // Remove card from local hand
        setMyHand(prev => prev.filter(c => c.id !== card.id))
        setCurrentTurnPlayerId(data.current_turn_player_id)

        // Broadcast to opponent instantly
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'card_played_action',
            payload: {
              card,
              player_id: currentUserId,
              damage: card.atk,
            },
          })
        }

        if (data.is_finished) {
          const winner = data.winner_id === currentUserId ? 'أنت البطل 👑' : opponentName
          setDuelWinner(winner)
          if (soundEnabled) playDuelVictoryFanfare()
          toast.success(`انتهت المبارزة بفوز ${winner}! 🏆`)
          if (onDuelCompleted) onDuelCompleted()
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'فشل إلقاء البطاقة')
    } finally {
      setIsPlayingCard(false)
      setSelectedCardIndex(null)
    }
  }

  // Handle automatic or manual turn passing / ending when player is out of cards
  const handlePassOrEndTurn = async (forceEnd = false) => {
    if (isPassingTurn || duelWinner) return
    setIsPassingTurn(true)

    const opponentId = isChallenger ? challengedId : challengerId

    try {
      const { data, error } = await supabase.rpc('uno_pass_or_end_turn', {
        p_challenge_id: challengeId,
        p_player_id: currentUserId,
        p_force_end: forceEnd,
      })

      if (error) {
        console.warn('RPC uno_pass_or_end_turn warning, resolving with client-side fallback:', error)
        // If forceEnd or both hands empty, resolve winner directly
        if (forceEnd || (myHand.length === 0 && opponentHandCount === 0)) {
          resolveWinnerClientSide()
          return
        }
        // If it was my turn and I have 0 cards but opponent has cards, hand turn to opponent
        if (isMyTurn && myHand.length === 0 && opponentHandCount > 0 && opponentId) {
          setCurrentTurnPlayerId(opponentId)
          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'turn_passed_action',
              payload: { is_finished: false, current_turn_player_id: opponentId },
            })
          }
          toast('🔄 انتقل الدور تلقائياً إلى الخصم!', { icon: '👉' })
          return
        }
        throw error
      }

      if (data?.success) {
        if (data.is_finished) {
          const winner = data.winner_id === currentUserId ? `${myName} (أنت) 👑` : opponentName
          setDuelWinner(winner)
          if (data.win_reason) setDuelWinReason(data.win_reason)
          if (soundEnabled) playDuelVictoryFanfare()
          toast.success(`انتهت المبارزة! الفائز: ${winner} 🏆 (${data.win_reason || ''})`)
          if (onDuelCompleted) onDuelCompleted()
          // Broadcast victory
          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'turn_passed_action',
              payload: { is_finished: true, winner_id: data.winner_id, win_reason: data.win_reason },
            })
          }
        } else {
          const nextTurnId = data.current_turn_player_id
          if (nextTurnId) setCurrentTurnPlayerId(nextTurnId)
          if (data.message) {
            toast(data.message, { icon: nextTurnId === currentUserId ? '🎯' : '🔄' })
          }
          // Broadcast turn change
          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'turn_passed_action',
              payload: { is_finished: false, current_turn_player_id: nextTurnId },
            })
          }
        }
      }
    } catch (err: any) {
      console.error('Error passing/ending turn:', err)
      // Client-side fallback if both players are out of cards or forceEnd
      if (forceEnd || (myHand.length === 0 && opponentHandCount === 0)) {
        resolveWinnerClientSide()
      } else if (isMyTurn && myHand.length === 0 && opponentId) {
        setCurrentTurnPlayerId(opponentId)
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'turn_passed_action',
            payload: { is_finished: false, current_turn_player_id: opponentId },
          })
        }
        toast('🔄 انتقل الدور تلقائياً إلى الخصم', { icon: '👉' })
      } else {
        toast.error(err?.message || 'فشل تحديث حالة الدور')
      }
    } finally {
      setIsPassingTurn(false)
    }
  }

  // Client-side winner resolution: more cards in hand wins > higher LP wins > tie
  const resolveWinnerClientSide = () => {
    let winner: string
    let reason: string

    // 1. Check card count
    if (myHand.length > opponentHandCount) {
      winner = `${myName} (أنت) 👑`
      reason = `امتلاك بطاقات أكثر في اليد (${myHand.length} مقابل ${opponentHandCount})`
    } else if (opponentHandCount > myHand.length) {
      winner = opponentName
      reason = `امتلاك بطاقات أكثر في اليد (${opponentHandCount} مقابل ${myHand.length})`
    } else {
      // 2. Equal cards (e.g. both 0 cards) -> check LP
      if (myLp > opponentLp) {
        winner = `${myName} (أنت) 👑`
        reason = `أعلى نقاط حياة LP متبقية (${myLp} مقابل ${opponentLp} LP)`
      } else if (opponentLp > myLp) {
        winner = opponentName
        reason = `أعلى نقاط حياة LP متبقية (${opponentLp} مقابل ${myLp} LP)`
      } else {
        winner = `${myName} (أنت) 👑`
        reason = 'تعادل تام في النقاط والبطاقات'
      }
    }

    setDuelWinner(winner)
    setDuelWinReason(reason)
    if (soundEnabled) playDuelVictoryFanfare()
    toast.success(`انتهت المبارزة! الفائز: ${winner} 🏆 (${reason})`)
    if (onDuelCompleted) onDuelCompleted()

    // Broadcast victory
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'turn_passed_action',
        payload: {
          is_finished: true,
          winner_id: winner.includes('أنت') ? currentUserId : (isChallenger ? challengedId : challengerId),
          win_reason: reason,
        },
      })
    }
  }

  // Auto-pass turn if current player has 0 cards, or auto-end if both have 0 cards
  useEffect(() => {
    if (!isOpen || !isBothReady || duelWinner || isPassingTurn || loading) return

    // Both players exhausted all cards → end match immediately and decide winner
    if (myHand.length === 0 && opponentHandCount === 0) {
      const timer = setTimeout(() => {
        handlePassOrEndTurn(true)
      }, 800)
      return () => clearTimeout(timer)
    }

    // It's my turn but I have no cards and opponent has cards → auto-pass to opponent
    if (isMyTurn && myHand.length === 0 && opponentHandCount > 0) {
      toast('🔄 نفدت بطاقاتك! جارٍ تمرير الدور تلقائياً للخصم...', { duration: 1200 })
      const timer = setTimeout(() => {
        handlePassOrEndTurn(false)
      }, 1000)
      return () => clearTimeout(timer)
    }

    // Opponent has no cards but it's their turn and I have cards → pass to me
    if (!isMyTurn && opponentHandCount === 0 && myHand.length > 0) {
      const timer = setTimeout(() => {
        handlePassOrEndTurn(false)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isBothReady, duelWinner, isMyTurn, myHand.length, opponentHandCount, isPassingTurn, loading])

  if (!isOpen) return null

  const latestTableCard = tableCards.length > 0 ? tableCards[tableCards.length - 1] : null
  const latestCardData: WuWaDuelCard | null = latestTableCard?.card || null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-hidden" dir="rtl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-5xl h-[95vh] bg-[#070b14] border-2 border-amber-500/40 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden"
        >
          {/* Header Bar */}
          <div className="px-5 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-amber-700 flex items-center justify-center shadow-glow-amber">
                <Swords size={20} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-amber-300 text-sm sm:text-base">
                    ساحة مبارزة كروت Resonance WuWa التفاعلية
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    RESONANCE DUEL
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isLiveConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}>
                    <Radio size={11} className={isLiveConnected ? 'animate-pulse text-emerald-400' : ''} />
                    {isLiveConnected ? 'مباشر (LIVE)' : 'جارٍ الاتصال...'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  الجائزة الإجمالية: <span className="text-amber-400 font-bold">${stake * 2}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border transition-all ${
                  soundEnabled ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
                title="تشغيل/كتم الصوت"
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700 transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Waiting Room if not both ready */}
          {!isBothReady && !duelWinner ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-radial-gradient">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center animate-pulse shadow-glow-amber">
                <Clock size={36} className="text-amber-400" />
              </div>
              <div className="max-w-md space-y-2">
                <h2 className="text-2xl font-black text-white">بانتظار كلا المتحديين لدخول ساحة Resonance WuWa</h2>
                <p className="text-slate-400 text-xs sm:text-sm">
                  المبارزة تعتمد على تبادل الأدوار وإلقاء كروت Resonance الخاصة بك ثانية بثانية!
                </p>
              </div>

              {/* Ready Status Cards */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className={`p-4 rounded-2xl border text-center space-y-1 ${challengerReady ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  <span className="text-xs font-bold block">{challengerName}</span>
                  <span className="text-[11px] flex items-center justify-center gap-1">
                    {challengerReady ? <><CheckCircle2 size={13} /> متواجد وجاهز</> : <><Clock size={13} /> بانتظار الدخول</>}
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border text-center space-y-1 ${challengedReady ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  <span className="text-xs font-bold block">{challengedName}</span>
                  <span className="text-[11px] flex items-center justify-center gap-1">
                    {challengedReady ? <><CheckCircle2 size={13} /> متواجد وجاهز</> : <><Clock size={13} /> بانتظار الدخول</>}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={async () => {
                    setIsBothReady(true)
                    if (channelRef.current) {
                      channelRef.current.send({
                        type: 'broadcast',
                        event: 'duel_started',
                        payload: { ready: true }
                      })
                    }
                    try {
                      await supabase.from('pvp_challenges').update({
                        challenger_ready: true,
                        challenged_ready: true
                      }).eq('id', challengeId)
                    } catch (e) {
                      // ignore
                    }
                    toast.success('تم تأكيد الجاهزية! ألقِ بطاقتك ⚔️')
                  }}
                  className="btn-primary py-2.5 px-6 text-xs font-bold shadow-glow-amber"
                >
                  بدء المبارزة الآن ⚔️
                </button>
              </div>
            </div>
          ) : (
            /* Active WuWa Combat Table */
            <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0e1424] via-[#070b14] to-[#03050a] overflow-hidden">
              
              {/* Opponent Area (Top) */}
              <div className="flex items-center justify-between px-5 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-700 border border-red-400 flex items-center justify-center font-black text-white text-sm shadow-md">
                    {opponentName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">{opponentName}</span>
                    <span className="text-[10px] text-slate-400">كروت الخصم ({opponentHandCount} بطاقات في اليد)</span>
                  </div>
                </div>

                {/* Opponent Life Points & Shield */}
                <div className="flex items-center gap-3">
                  {opponentShield > 0 && (
                    <div className="bg-cyan-950/70 px-3 py-1 rounded-xl border border-cyan-500/40 flex items-center gap-1 text-cyan-300 font-mono text-xs font-black">
                      <Shield size={12} />
                      {opponentShield}
                    </div>
                  )}
                  <div className="text-left bg-black/70 px-4 py-1.5 rounded-xl border border-red-500/40">
                    <span className="text-[9px] font-black uppercase text-red-400 tracking-wider block">OPPONENT LP</span>
                    <strong className="font-mono text-base font-black text-red-300">
                      {opponentLp} <span className="text-[10px]">LP</span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* Opponent Face-down Hand with authentic WuWa Card Back */}
              <div className="flex justify-center -space-x-4 overflow-hidden py-1">
                {Array.from({ length: Math.min(5, opponentHandCount || 5) }).map((_, idx) => (
                  <motion.div
                    key={idx}
                    className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-gradient-to-b from-slate-900 via-slate-950 to-amber-950 border-2 border-amber-500/60 shadow-[0_4px_15px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center p-1 relative transform"
                    style={{ transform: `rotate(${(idx - 2) * 4}deg)` }}
                  >
                    <div className="w-full h-full rounded-lg border border-amber-400/30 flex flex-col items-center justify-center bg-black/40">
                      <img src="/logo.jpeg" alt="WuWa" className="w-7 h-7 sm:w-9 sm:h-9 object-cover rounded-full border border-amber-400 shadow-glow-amber mb-1" />
                      <span className="text-[8px] sm:text-[9px] font-black text-amber-300 tracking-wider uppercase font-mono">WUWA</span>
                      <span className="text-[7px] text-amber-400/70 uppercase">RESONANCE</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Center Table Surface (Active Combat Arena) */}
              <div className="my-auto relative flex flex-col items-center justify-center py-2">
                {/* Table Felt Circle */}
                <div className="w-80 h-44 sm:w-[440px] sm:h-52 rounded-[110px] bg-gradient-to-b from-emerald-950/40 via-slate-900/60 to-black border-4 border-amber-500/30 shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] flex items-center justify-center relative">
                  
                  {/* Floating Damage / Combat Alert */}
                  {floatingDamage && (
                    <motion.div
                      initial={{ y: 20, opacity: 0, scale: 0.5 }}
                      animate={{ y: -40, opacity: 1, scale: 1.2 }}
                      exit={{ opacity: 0 }}
                      className="absolute z-30 font-mono text-2xl font-black text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                    >
                      {floatingDamage.text}
                    </motion.div>
                  )}

                  {/* Active Center Card Display */}
                  {latestCardData ? (
                    <motion.div
                      key={latestTableCard?.played_at || 'card'}
                      initial={{ scale: 0.4, y: -40, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      transition={{ type: 'spring', damping: 15 }}
                      className="w-32 h-44 sm:w-36 sm:h-48 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-400 p-2 shadow-[0_0_35px_rgba(245,158,11,0.5)] flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-center text-[10px] font-black">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {latestCardData.element}
                        </span>
                        <span className="font-mono text-amber-400 font-bold">ATK {latestCardData.atk}</span>
                      </div>

                      <div className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-amber-500/30 my-1 bg-black">
                        <img
                          src={latestCardData.image_path || '/characters/rover-electro.webp'}
                          alt={latestCardData.name}
                          className="w-full h-full object-cover object-top"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                          <span className="text-[10px] font-black text-white leading-none truncate">{latestCardData.name}</span>
                        </div>
                      </div>

                      <div className="text-[9px] text-center font-bold text-amber-300 truncate">
                        {latestTableCard?.played_by_name}: {latestTableCard?.damage_dealt ? `-${latestTableCard.damage_dealt} LP` : latestCardData.skill || 'Resonance'}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center text-slate-500 text-xs">
                      <Sparkles size={28} className="mx-auto mb-1 opacity-50 animate-pulse text-amber-400" />
                      طاولة Resonance جاهزة لإلقاء البطاقات
                    </div>
                  )}
                </div>

                {/* Turn Alert Banner */}
                <div className="mt-2 flex flex-col items-center gap-2">
                  {myHand.length === 0 && opponentHandCount === 0 ? (
                    <div className="px-5 py-2 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-glow-amber animate-pulse">
                      <Trophy size={15} className="text-yellow-400" /> نفدت البطاقات لدى الطرفين! جارٍ حسم الفائز (بالبطاقات المتبقية أو أعلى LP)...
                    </div>
                  ) : isMyTurn ? (
                    myHand.length > 0 ? (
                      <div className="px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-500/30 border border-amber-400 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-glow-amber animate-bounce">
                        <Sparkles size={14} className="text-yellow-400" /> دورك الآن! اختر بطاقة Resonance من يدك في الأسفل وألقها في الساحة
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap justify-center">
                        <div className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-2 animate-pulse">
                          <Clock size={14} className="text-amber-400" /> نفدت بطاقاتك! جارٍ تمرير الدور للخصم ({opponentHandCount} بطاقات)...
                        </div>
                        <button
                          onClick={() => handlePassOrEndTurn(true)}
                          disabled={isPassingTurn}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-black text-xs flex items-center gap-1.5 shadow-glow-amber transition-all"
                        >
                          <Trophy size={13} /> إعلان الفائز وحسم المبارزة فوراً
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <div className="px-5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-medium text-xs flex items-center gap-2">
                        <Clock size={13} className="animate-spin text-amber-400" /> بانتظار حركة {opponentName}...
                      </div>
                      {opponentHandCount === 0 && (
                        <button
                          onClick={() => handlePassOrEndTurn(false)}
                          disabled={isPassingTurn}
                          className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 font-bold text-xs hover:bg-amber-500/30 transition-all flex items-center gap-1"
                        >
                          <Sparkles size={13} /> نفدت بطاقات الخصم - استعادة الدور
                        </button>
                      )}
                      {(myHand.length === 0 || opponentHandCount === 0) && (
                        <button
                          onClick={() => handlePassOrEndTurn(true)}
                          disabled={isPassingTurn}
                          className="px-3 py-1 rounded-xl bg-amber-500 text-black font-black text-xs hover:bg-yellow-400 transition-all flex items-center gap-1 shadow-md"
                        >
                          <Trophy size={13} /> حسم الفائز (بالبطاقات أو LP)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Player Life Points & Status (Bottom) */}
              <div className="flex items-center justify-between px-5 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-1 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 border border-blue-400 flex items-center justify-center font-black text-white text-sm shadow-md">
                    {myName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">{myName} (أنت)</span>
                    <span className="text-[10px] text-slate-400">يدك الحالية ({myHand.length} بطاقات Resonance)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {myShield > 0 && (
                    <div className="bg-cyan-950/70 px-3 py-1 rounded-xl border border-cyan-500/40 flex items-center gap-1 text-cyan-300 font-mono text-xs font-black">
                      <Shield size={12} />
                      {myShield}
                    </div>
                  )}
                  <div className="text-left bg-black/70 px-4 py-1.5 rounded-xl border border-blue-500/40">
                    <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider block">YOUR LP</span>
                    <strong className="font-mono text-base font-black text-blue-300">
                      {myLp} <span className="text-[10px]">LP</span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* Player Real WuWa Resonator Cards (Interactive Hand) */}
              <div className="flex justify-center -space-x-3 sm:-space-x-4 overflow-x-auto py-2 px-2 scrollbar-none">
                {myHand.map((card, idx) => {
                  const elemStyle = ELEMENT_COLORS[card.element] || ELEMENT_COLORS.Spectro
                  const isSelected = selectedCardIndex === idx
                  return (
                    <motion.div
                      key={card.id || idx}
                      whileHover={{ y: -24, scale: 1.1, zIndex: 35 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePlayCard(card, idx)}
                      className={`cursor-pointer w-28 h-40 sm:w-32 sm:h-44 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 ${elemStyle.border} p-2 text-white shadow-xl flex flex-col justify-between transition-all select-none flex-shrink-0 relative overflow-hidden ${
                        !isMyTurn ? 'opacity-65 cursor-not-allowed' : 'hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                      } ${isSelected ? 'ring-4 ring-amber-400' : ''}`}
                    >
                      {/* Top Bar: Element & ATK */}
                      <div className="flex justify-between items-center text-[10px] font-black z-10">
                        <span className={`px-1.5 py-0.5 rounded bg-black/60 border ${elemStyle.border} ${elemStyle.text}`}>
                          {card.element}
                        </span>
                        <span className="font-mono text-amber-400 font-black flex items-center gap-0.5">
                          ⚔️ {card.atk}
                        </span>
                      </div>

                      {/* Character Artwork */}
                      <div className="relative w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-white/10 my-1 bg-black/80">
                        <img
                          src={card.image_path || '/characters/rover-electro.webp'}
                          alt={card.name}
                          className="w-full h-full object-cover object-top hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                        <span className="absolute bottom-1 right-1 text-[10px] font-black text-white drop-shadow-md truncate max-w-[90%]">
                          {card.name}
                        </span>
                      </div>

                      {/* Card Bottom: Skill & DEF */}
                      <div className="flex justify-between items-center text-[9px] font-mono z-10">
                        <span className="text-[8px] text-slate-300 truncate max-w-[65%]">{card.skill || 'Resonance Strike'}</span>
                        <span className="text-cyan-300 font-bold">🛡️ {card.def}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Duel Victory Overlay if finished */}
              {duelWinner && (
                <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="p-8 rounded-3xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black max-w-sm border-2 border-yellow-200 shadow-2xl space-y-3">
                    <Trophy size={48} className="mx-auto" />
                    <h2 className="text-2xl font-black uppercase tracking-wider">VICTORY! 🏆</h2>
                    <p className="text-sm font-bold">
                      حسمت المعركة بفوز البطل <span className="underline">{duelWinner}</span> وحصل على الجائزة الإجمالية ${stake * 2}!
                    </p>
                    {duelWinReason && (
                      <div className="px-3 py-1 rounded-full bg-black/20 text-black text-xs font-black">
                        سبب الفوز: {duelWinReason}
                      </div>
                    )}
                    <button onClick={onClose} className="w-full py-3 rounded-xl bg-black text-amber-300 font-black text-sm hover:bg-slate-900 transition-all">
                      استلام الأرباح ($) والعودة
                    </button>
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
