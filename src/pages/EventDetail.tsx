import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Users, Flame, Clock, AlertCircle, Check,
  Loader2, X, TrendingUp, ChevronRight, Wallet
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useUIStore } from '../store'
import {
  formatDate, getEventStatusLabel, getEventStatusClass,
  calculatePercentage, getImageUrl, formatRelativeDate
} from '../lib/utils'
import { Modal, LoadingSpinner, EmptyState, CelebrationEffect, AnimatedNumber } from '../components/shared/UI'
import { CharacterImage } from '../components/shared/ImageUpload'
import type { EventWithCharacters, EventStats, Bet } from '../types/database'
import toast from 'react-hot-toast'

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { player, isAuthenticated, refreshPlayer } = useAuth()
  const { setLoginModalOpen } = useUIStore()
  
  const [event, setEvent] = useState<EventWithCharacters | null>(null)
  const [stats, setStats] = useState<EventStats | null>(null)
  const [myBet, setMyBet] = useState<Bet | null>(null)
  const [loading, setLoading] = useState(true)
  const [betModal, setBetModal] = useState(false)
  const [selectedChar, setSelectedChar] = useState<'a' | 'b' | null>(null)
  const [stakeInput, setStakeInput] = useState('')
  const [isPlacingBet, setIsPlacingBet] = useState(false)
  const [betError, setBetError] = useState('')
  const [showCelebration, setShowCelebration] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!id) return
    loadEvent()
    subscribeToRealtime()
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [id])

  useEffect(() => {
    if (id && player?.id) loadMyBet()
  }, [id, player?.id])

  const loadEvent = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          character_a:characters!events_character_a_id_fkey(*),
          character_b:characters!events_character_b_id_fkey(*),
          winner_character:characters!events_winner_character_id_fkey(*)
        `)
        .eq('id', id!)
        .single()

      if (error || !data) { navigate('/events'); return }
      setEvent(data as EventWithCharacters)
      loadStats()
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    const { data } = await supabase
      .from('event_stats')
      .select('*')
      .eq('event_id', id!)
      .single()
    if (data) setStats(data as EventStats)
  }

  const loadMyBet = async () => {
    if (!player?.id || !id) return
    const { data } = await supabase
      .from('bets')
      .select('*')
      .eq('event_id', id)
      .eq('player_id', player.id)
      .maybeSingle()
    if (data) setMyBet(data as Bet)
  }

  const subscribeToRealtime = () => {
    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current) } catch (_) {}
    }
    const channelId = `event-${id}-${Math.random().toString(36).substring(2, 8)}`
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bets', filter: `event_id=eq.${id}` },
        () => loadStats()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${id}` },
        (payload: any) => {
          setEvent((prev: EventWithCharacters | null) => prev ? { ...prev, ...(payload.new as EventWithCharacters) } : null)
          if ((payload.new as EventWithCharacters).status === 'completed') {
            setShowCelebration(true)
            setTimeout(() => setShowCelebration(false), 5000)
          }
        }
      )
      .subscribe()
    channelRef.current = channel
  }

  const openBetModal = (char: 'a' | 'b') => {
    if (!isAuthenticated) { setLoginModalOpen(true); return }
    if (!event || event.status !== 'open') return
    setSelectedChar(char)
    setStakeInput('')
    setBetError('')
    setBetModal(true)
  }

  const handlePlaceBet = async () => {
    if (!player?.id || !event || !selectedChar) return
    setBetError('')

    const stake = parseFloat(stakeInput)
    if (!stakeInput || isNaN(stake) || stake <= 0) {
      setBetError('أدخل مبلغاً صحيحاً أكبر من صفر')
      return
    }
    if (!Number.isInteger(stake)) {
      setBetError('يجب أن يكون المبلغ رقماً صحيحاً')
      return
    }
    if (event.max_bet_amount && stake > event.max_bet_amount) {
      setBetError(`الحد الأقصى للرهان هو ${event.max_bet_amount}$`)
      return
    }

    const charId = selectedChar === 'a' ? event.character_a_id : event.character_b_id

    setIsPlacingBet(true)
    try {
      const { data, error } = await supabase.rpc('place_bet', {
        p_player_id: player.id,
        p_event_id: event.id,
        p_character_id: charId,
        p_stake: stake,
      })

      if (error) throw new Error(error.message)
      if (!data?.success) throw new Error(data?.message || 'فشل تسجيل الرهان')

      toast.success(`تم تسجيل رهانك بنجاح! رصيدك الجديد: ${data.new_balance < 0 ? '-' : ''}$${Math.abs(data.new_balance || 0).toLocaleString('en-US')}`)
      setBetModal(false)
      await Promise.all([loadMyBet(), refreshPlayer(), loadStats()])
    } catch (err) {
      setBetError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setIsPlacingBet(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="جارٍ تحميل الإيفنت..." />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <EmptyState
          icon={<AlertCircle size={48} />}
          title="الإيفنت غير موجود"
          description="لم نتمكن من العثور على هذا الإيفنت"
          action={<button onClick={() => navigate('/events')} className="btn-primary">العودة للإيفنتات</button>}
        />
      </div>
    )
  }

  const charAStake = stats?.char_a_total_stake ?? 0
  const charBStake = stats?.char_b_total_stake ?? 0
  const totalStake = stats?.total_stake ?? 0
  const charAPercent = calculatePercentage(charAStake, totalStake)
  const charBPercent = calculatePercentage(charBStake, totalStake)

  const selectedCharObj = selectedChar === 'a' ? event.character_a : selectedChar === 'b' ? event.character_b : null
  const stakeNum = parseFloat(stakeInput) || 0
  const potentialPayout = stakeNum * event.multiplier
  const potentialProfit = potentialPayout - stakeNum

  const isEventOpen = event.status === 'open'
  const isCompleted = event.status === 'completed'
  
  const myCharIsFavorite = myBet?.selected_character_id === event.character_a_id
    ? 'a' : myBet?.selected_character_id === event.character_b_id ? 'b' : null

  return (
    <div className="min-h-screen pt-16">
      <CelebrationEffect show={showCelebration} />

      {/* Cover image */}
      {event.cover_image_path && (
        <div className="w-full h-48 md:h-64 overflow-hidden relative">
          <img
            src={getImageUrl(event.cover_image_path, 'event-covers')}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent, #050508)' }} />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Event header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className={`badge ${getEventStatusClass(event.status)}`}>
              {getEventStatusLabel(event.status)}
            </span>
            {event.multiplier && (
              <span className="badge" style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' }}>
                <Flame size={12} /> ×{event.multiplier} مضاعف
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black text-white mb-2">{event.title}</h1>
          {event.description && <p className="text-slate-400">{event.description}</p>}
          
          {/* Event timing */}
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
            {event.closes_at && isEventOpen && (
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-amber-400" />
                <span>ينتهي {formatRelativeDate(event.closes_at)}</span>
              </div>
            )}
            {event.settled_at && (
              <div className="flex items-center gap-1.5">
                <Check size={14} className="text-green-400" />
                <span>اكتمل {formatDate(event.settled_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Winner announcement */}
        {isCompleted && event.winner_character && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 rounded-2xl text-center victory-pulse"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.05))', border: '2px solid rgba(245,158,11,0.4)' }}
          >
            <Trophy size={40} className="mx-auto text-amber-400 mb-2" />
            <p className="text-sm text-amber-300 mb-1">الشخصية الفائزة</p>
            <p className="text-3xl font-black text-amber-400">{event.winner_character.name}</p>
            {myBet && (
              <div className="mt-3">
                {myBet.status === 'won' ? (
                  <p className="text-green-400 font-semibold">🎉 لقد فزت بـ ${myBet.potential_payout.toLocaleString('en-US')}!</p>
                ) : myBet.status === 'lost' ? (
                  <p className="text-red-400">خسرت هذا الرهان</p>
                ) : null}
              </div>
            )}
          </motion.div>
        )}

        {/* My bet badge */}
        {myBet && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <Check size={18} className="text-primary-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">
                راهنت بـ <span className="text-primary-400 number-ltr">${myBet.stake.toLocaleString('en-US')}</span> على{' '}
                <span className="text-primary-300">
                  {myCharIsFavorite === 'a' ? event.character_a.name : event.character_b.name}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                مكافأة محتملة: ${myBet.potential_payout.toLocaleString('en-US')} (×{myBet.multiplier_snapshot})
              </p>
            </div>
          </motion.div>
        )}

        {/* Characters VS Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Character A */}
          <CharacterBetCard
            character={event.character_a}
            percent={charAPercent}
            totalStake={charAStake}
            participants={stats?.char_a_participants ?? 0}
            isWinner={event.winner_character_id === event.character_a_id && isCompleted}
            myBet={myCharIsFavorite === 'a'}
            canBet={isEventOpen && !myBet}
            onSelect={() => openBetModal('a')}
            color="a"
          />

          {/* Center stats */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="text-4xl font-black text-slate-600">VS</div>
            
            <div className="w-full glass-card rounded-2xl p-4 space-y-2 text-center">
              <div>
                <p className="text-xs text-slate-500">إجمالي الرهانات</p>
                <p className="text-xl font-bold text-white number-ltr">${totalStake.toLocaleString('en-US')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">عدد المشاركين</p>
                <p className="text-lg font-bold text-primary-400 number-ltr">
                  <Users size={14} className="inline ml-1" />
                  {stats?.total_participants ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">مضاعف المكافأة</p>
                <p className="text-lg font-bold text-orange-400">×{event.multiplier}</p>
              </div>
            </div>

            {/* Progress bars */}
            <div className="w-full space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-primary-400 font-medium w-12">{charAPercent}%</span>
                <div className="flex-1 progress-bar">
                  <motion.div
                    className="progress-fill-a"
                    initial={{ width: 0 }}
                    animate={{ width: `${charAPercent}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs flex-row-reverse">
                <span className="text-orange-400 font-medium w-12 text-right">{charBPercent}%</span>
                <div className="flex-1 progress-bar">
                  <div className="relative h-full" style={{ transform: 'scaleX(-1)' }}>
                    <motion.div
                      className="progress-fill-b"
                      initial={{ width: 0 }}
                      animate={{ width: `${charBPercent}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-slate-600">توزيع رهانات الجمهور</p>
            </div>
          </div>

          {/* Character B */}
          <CharacterBetCard
            character={event.character_b}
            percent={charBPercent}
            totalStake={charBStake}
            participants={stats?.char_b_participants ?? 0}
            isWinner={event.winner_character_id === event.character_b_id && isCompleted}
            myBet={myCharIsFavorite === 'b'}
            canBet={isEventOpen && !myBet}
            onSelect={() => openBetModal('b')}
            color="b"
          />
        </div>
      </div>

      {/* Bet Confirmation Modal */}
      <Modal isOpen={betModal} onClose={() => !isPlacingBet && setBetModal(false)} title="تأكيد الرهان" size="sm">
        <div className="p-6 space-y-4">
          {selectedCharObj && (
            <>
              {/* Selected character preview */}
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}
              >
                <CharacterImage imagePath={selectedCharObj.image_path} name={selectedCharObj.name} size="sm" className="flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">الشخصية المختارة</p>
                  <p className="font-bold text-white">{selectedCharObj.name}</p>
                </div>
              </div>

              {/* Player balance */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                <span className="text-sm text-slate-400 flex items-center gap-1"><Wallet size={14} /> رصيدك الحالي</span>
                <span className={`font-bold number-ltr ${(player?.balance ?? 0) < 0 ? 'text-red-400' : 'text-white'}`}>
                  {(player?.balance ?? 0) < 0 ? '-' : ''}${Math.abs(player?.balance ?? 0).toLocaleString('en-US')}
                </span>
              </div>

              {/* Stake input */}
              <div>
                <label className="field-label">مبلغ الرهان ($)</label>
                <input
                  type="number"
                  value={stakeInput}
                  onChange={(e) => { setStakeInput(e.target.value); setBetError('') }}
                  placeholder="أدخل المبلغ..."
                  className="input-field text-center text-lg font-bold"
                  min="1"
                  max={event.max_bet_amount || undefined}
                  step="1"
                  autoFocus
                />
                {event.max_bet_amount && (
                  <p className="text-xs text-slate-600 mt-1">الحد الأقصى: ${event.max_bet_amount.toLocaleString('en-US')}</p>
                )}
              </div>

              {/* Potential payout */}
              {stakeNum > 0 && (
                <div className="p-3 rounded-xl space-y-2"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">المكافأة الإجمالية (×{event.multiplier})</span>
                    <span className="text-green-400 font-bold number-ltr">${potentialPayout.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">صافي الربح</span>
                    <span className="text-green-400 font-bold number-ltr">+${potentialProfit.toLocaleString('en-US')}</span>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400">
                  ⚠️ أنت على وشك المراهنة على <strong>{selectedCharObj.name}</strong>. لا يمكنك تغيير اختيارك بعد تأكيد الرهان.
                  {(player?.balance ?? 0) < stakeNum && stakeNum > 0 && (
                    <span className="block mt-1 text-slate-400">
                      ملاحظة: رصيدك سيصبح سالباً (${((player?.balance ?? 0) - stakeNum).toLocaleString('en-US')}). 
                      يمكنك المواصلة واستعادة الرصيد بالفوز في الإيفنتات.
                    </span>
                  )}
                </p>
              </div>

              {betError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{betError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handlePlaceBet}
                  disabled={isPlacingBet || !stakeInput}
                  className="btn-primary flex-1"
                >
                  {isPlacingBet ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {isPlacingBet ? 'جارٍ التسجيل...' : 'تأكيد الرهان'}
                </button>
                <button
                  onClick={() => setBetModal(false)}
                  disabled={isPlacingBet}
                  className="btn-secondary flex-1"
                >
                  إلغاء
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

// Character bet card
function CharacterBetCard({
  character, percent, totalStake, participants, isWinner, myBet, canBet, onSelect, color
}: {
  character: { id: string; name: string; image_path: string | null }
  percent: number
  totalStake: number
  participants: number
  isWinner: boolean
  myBet: boolean
  canBet: boolean
  onSelect: () => void
  color: 'a' | 'b'
}) {
  const colorA = 'rgba(99,102,241,0.3)'
  const colorB = 'rgba(249,115,22,0.3)'
  const borderColor = isWinner ? 'rgba(245,158,11,0.6)' : myBet ? (color === 'a' ? colorA : colorB) : 'rgba(99,102,241,0.15)'

  return (
    <motion.div
      whileHover={canBet ? { scale: 1.02, y: -4 } : {}}
      onClick={canBet ? onSelect : undefined}
      className={`glass-card rounded-2xl overflow-hidden ${canBet ? 'cursor-pointer' : ''}`}
      style={{ border: `2px solid ${borderColor}`, boxShadow: isWinner ? '0 0 30px rgba(245,158,11,0.3)' : '' }}
    >
      {/* Character image */}
      <div className="aspect-[3/4] relative">
        <CharacterImage imagePath={character.image_path} name={character.name} size="xl" className="rounded-none rounded-t-xl" />
        
        {isWinner && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-500/20 flex items-end p-3">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/80">
              <Trophy size={12} className="text-white" />
              <span className="text-xs text-white font-bold">فائز</span>
            </div>
          </div>
        )}
        
        {myBet && (
          <div className="absolute top-2 right-2">
            <div className="px-2 py-1 rounded-full bg-primary-500/90 text-xs text-white font-bold">رهانك</div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-white text-lg mb-3 text-center">{character.name}</h3>
        
        <div className="space-y-2 text-center text-sm">
          <div>
            <p className="text-slate-500 text-xs">إجمالي الرهانات</p>
            <p className="font-bold text-white number-ltr">${totalStake.toLocaleString('en-US')}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">المشاركون</p>
            <p className="font-semibold text-slate-300">{participants}</p>
          </div>
          <div className="pt-1">
            <div className="text-2xl font-black" style={{ color: color === 'a' ? '#818cf8' : '#fb923c' }}>
              {percent}%
            </div>
          </div>
        </div>

        {canBet && (
          <button className={`btn-${color === 'a' ? 'primary' : 'secondary'} w-full mt-4 text-sm`}
            style={color === 'b' ? { background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', border: '1px solid rgba(249,115,22,0.5)' } : {}}
          >
            اختر {character.name}
          </button>
        )}
      </div>
    </motion.div>
  )
}
