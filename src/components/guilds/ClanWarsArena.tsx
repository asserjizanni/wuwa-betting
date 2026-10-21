import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords, Shield, Trophy, Users, Flame, Star,
  X, Play, Loader2, Eye, Radio, Zap, Crown,
  ChevronRight, AlertCircle, RefreshCw, Wifi, WifiOff,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { playDuelClashSound, playDuelVictoryFanfare } from '../../lib/audio'
import toast from 'react-hot-toast'

export type ClanBattleMode = '2v2' | '4v4' | '5v5'

export interface ClanBattleMatch {
  round: number
  player_a: { id?: string; username: string; card_name?: string; card_image?: string; atk?: number; def?: number }
  player_b: { id?: string; username: string; card_name?: string; card_image?: string; atk?: number; def?: number }
  status: 'pending' | 'completed'
  winner_side?: 'A' | 'B'
  winner_name?: string
  duel_score?: string
}

export interface ClanBattle {
  id: string
  clan_a_id: string
  clan_b_id: string
  clan_a_name: string
  clan_b_name: string
  clan_a_tag: string
  clan_b_tag: string
  mode: ClanBattleMode
  status: 'pending' | 'active' | 'completed'
  stake_per_player: number
  total_prize: number
  clan_a_score: number
  clan_b_score: number
  winner_clan_id?: string | null
  matches: ClanBattleMatch[]
  created_at?: string
}

export interface ClanWarsArenaProps {
  isOpen: boolean
  onClose: () => void
  myClanId?: string | null
  myClanName?: string
  currentUserId?: string
}

interface TickerEvent {
  id: string
  icon: string
  text: string
  color: string
  ts: number
}

// ─── helpers ────────────────────────────────────────────────
function normBattle(data: any): ClanBattle {
  return {
    id: data.id,
    clan_a_id: data.clan_a_id,
    clan_b_id: data.clan_b_id,
    clan_a_name: data.clan_a?.name || data.clan_a_name || 'كلان A',
    clan_b_name: data.clan_b?.name || data.clan_b_name || 'كلان B',
    clan_a_tag: data.clan_a?.tag  || data.clan_a_tag  || 'CLA',
    clan_b_tag: data.clan_b?.tag  || data.clan_b_tag  || 'CLB',
    mode: data.mode,
    status: data.status,
    stake_per_player: Number(data.stake_per_player),
    total_prize: Number(data.total_prize),
    clan_a_score: Number(data.clan_a_score ?? 0),
    clan_b_score: Number(data.clan_b_score ?? 0),
    winner_clan_id: data.winner_clan_id,
    matches: data.matches || [],
    created_at: data.created_at,
  }
}

// ─── component ──────────────────────────────────────────────
export function ClanWarsArena({
  isOpen,
  onClose,
  myClanId,
  myClanName = 'كلاني',
  currentUserId,
}: ClanWarsArenaProps) {
  const [activeTab, setActiveTab]           = useState<'mine' | 'spectate'>('mine')
  const [selectedMode, setSelectedMode]     = useState<ClanBattleMode>('2v2')
  const [stakePerPlayer, setStakePerPlayer] = useState<number>(100)
  const [enemyClanId, setEnemyClanId]       = useState<string>('')
  const [availableClans, setAvailableClans] = useState<any[]>([])

  const [activeBattle, setActiveBattle]     = useState<ClanBattle | null>(null)
  const [allBattles, setAllBattles]         = useState<ClanBattle[]>([])
  const [spectating, setSpectating]         = useState<ClanBattle | null>(null)

  const [loading, setLoading]               = useState<boolean>(false)
  const [resolvingRound, setResolvingRound] = useState<number | null>(null)
  const [realtimeOk, setRealtimeOk]         = useState<boolean>(false)

  // Ticker
  const [ticker, setTicker] = useState<TickerEvent[]>([])
  const tickerRef = useRef<HTMLDivElement>(null)

  // Supabase channels
  const myBattleChannel  = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const allBattlesChannel = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // ── push a ticker event ──
  const pushTicker = useCallback((icon: string, text: string, color = 'text-slate-300') => {
    setTicker(prev => [
      { id: Math.random().toString(36).slice(2), icon, text, color, ts: Date.now() },
      ...prev.slice(0, 49),
    ])
    setTimeout(() => tickerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }, [])

  // ── initial loads ──
  useEffect(() => {
    if (!isOpen) return
    loadEnemyClans()
    if (myClanId) loadMyBattle()
    loadAllActiveBattles()
    subscribeMyBattle()
    subscribeAllBattles()
    return () => {
      if (myBattleChannel.current)  supabase.removeChannel(myBattleChannel.current)
      if (allBattlesChannel.current) supabase.removeChannel(allBattlesChannel.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, myClanId])

  // ── load helpers ──
  const loadEnemyClans = async () => {
    try {
      const { data } = await supabase
        .from('guilds')
        .select('id, name, tag, level, badge, color')
        .eq('is_active', true)
        .neq('id', myClanId || '00000000-0000-0000-0000-000000000000')
        .limit(20)
      if (data?.length) { setAvailableClans(data); setEnemyClanId(data[0].id) }
    } catch { /* silent */ }
  }

  const loadMyBattle = async () => {
    if (!myClanId) return
    try {
      const { data } = await supabase
        .from('clan_battles')
        .select(`*, clan_a:clan_a_id(id,name,tag), clan_b:clan_b_id(id,name,tag)`)
        .or(`clan_a_id.eq.${myClanId},clan_b_id.eq.${myClanId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) setActiveBattle(normBattle(data))
    } catch { /* silent */ }
  }

  const loadAllActiveBattles = async () => {
    try {
      const { data } = await supabase
        .from('clan_battles')
        .select(`*, clan_a:clan_a_id(id,name,tag), clan_b:clan_b_id(id,name,tag)`)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false })
        .limit(15)
      if (data) {
        const normed = data.map(normBattle)
        setAllBattles(normed)
        if (normed.length > 0 && !spectating) setSpectating(normed[0])
      }
    } catch { /* silent */ }
  }

  // ── real-time: my battle ──
  const subscribeMyBattle = () => {
    if (myBattleChannel.current) {
      try { supabase.removeChannel(myBattleChannel.current) } catch { /* */ }
    }
    if (!myClanId) return

    const channel = supabase
      .channel(`clan-wars-mine-${myClanId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'clan_battles',
        filter: `clan_a_id=eq.${myClanId}`,
      }, (payload: any) => handleMyBattleUpdate(payload.new))
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'clan_battles',
        filter: `clan_b_id=eq.${myClanId}`,
      }, (payload: any) => handleMyBattleUpdate(payload.new))
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'clan_battles',
        filter: `clan_a_id=eq.${myClanId}`,
      }, (payload: any) => {
        loadMyBattle()
        pushTicker('⚔️', `حرب كلانات جديدة انطلقت! (${payload.new.mode})`, 'text-red-400')
      })
      .subscribe((status) => {
        setRealtimeOk(status === 'SUBSCRIBED')
      })

    myBattleChannel.current = channel
  }

  const handleMyBattleUpdate = (raw: any) => {
    setActiveBattle(prev => {
      if (!prev || prev.id !== raw.id) return prev
      const updated = { ...prev, ...raw, matches: raw.matches || prev.matches }
      // Detect new completed rounds → play sound + ticker
      const prevCompleted = (prev.matches || []).filter(m => m.status === 'completed').length
      const newCompleted  = (updated.matches || []).filter((m: ClanBattleMatch) => m.status === 'completed').length
      if (newCompleted > prevCompleted) {
        playDuelClashSound()
        const lastMatch = (updated.matches as ClanBattleMatch[]).find(
          (m, i) => m.status === 'completed' && (prev.matches[i]?.status !== 'completed')
        )
        if (lastMatch) {
          pushTicker('⚔️',
            `الجولة ${lastMatch.round}: ${lastMatch.winner_name} ينتصر! (${lastMatch.duel_score})`,
            'text-amber-300'
          )
        }
      }
      if (raw.status === 'completed') {
        playDuelVictoryFanfare()
        pushTicker('🏆', `انتهت حرب الكلانات! جائزة ${raw.total_prize}$ للكلان الفائز`, 'text-yellow-300')
      }
      return updated
    })
  }

  // ── real-time: all battles spectator ──
  const subscribeAllBattles = () => {
    if (allBattlesChannel.current) {
      try { supabase.removeChannel(allBattlesChannel.current) } catch { /* */ }
    }
    const channel = supabase
      .channel(`clan-wars-spectate-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'clan_battles',
      }, (payload: any) => {
        const raw = payload.new
        setAllBattles(prev => prev.map(b => b.id === raw.id ? { ...b, ...raw, matches: raw.matches || b.matches } : b))
        setSpectating(prev => {
          if (!prev || prev.id !== raw.id) return prev
          const updated = { ...prev, ...raw, matches: raw.matches || prev.matches }
          // detect new round → push ticker
          const prevDone = (prev.matches || []).filter(m => m.status === 'completed').length
          const nowDone  = (updated.matches || []).filter((m: ClanBattleMatch) => m.status === 'completed').length
          if (nowDone > prevDone) {
            playDuelClashSound()
            const lastMatch = (updated.matches as ClanBattleMatch[]).find(
              (m, i) => m.status === 'completed' && (prev.matches[i]?.status !== 'completed')
            )
            if (lastMatch) pushTicker(
              '🎯',
              `[${updated.clan_a_name} vs ${updated.clan_b_name}] الجولة ${lastMatch.round}: ${lastMatch.winner_name} ينتصر!`,
              'text-sky-300'
            )
          }
          if (raw.status === 'completed') {
            pushTicker('🏆',
              `[حرب ${updated.mode}] ${raw.clan_a_score > raw.clan_b_score ? updated.clan_a_name : updated.clan_b_name} يفوز!`,
              'text-yellow-300'
            )
          }
          return updated
        })
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'clan_battles',
      }, (_payload: any) => {
        loadAllActiveBattles()
        pushTicker('🔥', 'حرب كلانات جديدة بدأت على السيرفر!', 'text-red-400')
      })
      .subscribe()

    allBattlesChannel.current = channel
  }

  // ── actions ──
  const handleStartClanBattle = async () => {
    if (!myClanId) { toast.error('يجب أن تنضم إلى كلان أولاً!'); return }
    if (!enemyClanId) { toast.error('اختر الكلان المنافس'); return }
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('create_clan_battle', {
        p_clan_a_id: myClanId,
        p_clan_b_id: enemyClanId,
        p_mode: selectedMode,
        p_stake_per_player: stakePerPlayer,
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشل إشعال حرب الكلان')
      toast.success(`اشتعلت حرب الكلانات بمود ${selectedMode}! ⚔️`)
      await loadMyBattle()
      pushTicker('🔥', `أشعلت حرباً جديدة بمود ${selectedMode} برهان ${stakePerPlayer}$/مقاتل`, 'text-red-400')
    } catch (err: any) {
      toast.error(err?.message || 'فشل بدء حرب الكلانات')
    } finally {
      setLoading(false)
    }
  }

  const handleFightRound = async (roundIdx: number) => {
    if (!activeBattle) return
    setResolvingRound(roundIdx)
    playDuelClashSound()
    try {
      const { data, error } = await supabase.rpc('play_clan_battle_round', {
        p_battle_id: activeBattle.id,
        p_round_index: roundIdx,
      })
      if (error) throw error
      if (data?.success) {
        setActiveBattle(prev => {
          if (!prev) return null
          return {
            ...prev,
            clan_a_score: data.clan_a_score,
            clan_b_score: data.clan_b_score,
            matches: data.matches,
            status: data.is_all_completed ? 'completed' : prev.status,
            winner_clan_id: data.winner_clan_id,
          }
        })
        if (data.is_all_completed) {
          playDuelVictoryFanfare()
          toast.success('حسمت حرب الكلانات! مبروك للكلان الفائز 🏆')
        } else {
          toast.success(`${data.winner_name} ينتصر في الجولة! ⚔️`)
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'فشل تشغيل الجولة')
    } finally {
      setResolvingRound(null)
    }
  }

  if (!isOpen) return null

  // ── render ──
  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
        dir="rtl"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="relative w-full max-w-5xl bg-[#090a16] border border-red-500/40 rounded-3xl shadow-[0_0_100px_rgba(239,68,68,0.2)] flex flex-col overflow-hidden max-h-[92vh]"
        >
          {/* ── Header ── */}
          <div className="px-6 py-4 bg-gradient-to-r from-red-950/60 via-slate-950 to-red-950/60 border-b border-red-500/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 via-rose-500 to-amber-600 flex items-center justify-center shadow-lg">
                <Swords size={24} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white">حرب الكلانات — Clan Wars</h2>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-red-500/20 text-red-300 border border-red-500/40">
                    2v2 • 4v4 • 5v5
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">مواجهات مباشرة بين أعضاء الكلانات لحسم السيرفر</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Realtime indicator */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${realtimeOk ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                {realtimeOk ? <><Wifi size={11} /><span>LIVE</span><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /></> : <><WifiOff size={11} /><span>جاري الاتصال</span></>}
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex border-b border-slate-800 shrink-0 bg-slate-950/60">
            {[
              { key: 'mine',     label: 'معركتي',   icon: <Swords size={14} /> },
              { key: 'spectate', label: 'متفرج مباشر', icon: <Eye size={14} /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'mine' | 'spectate')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'border-red-500 text-red-400 bg-red-500/5'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.icon} {tab.label}
                {tab.key === 'spectate' && allBattles.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-black border border-red-500/30">
                    {allBattles.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* ── Main Content ── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* ═══════════════ MY BATTLE TAB ═══════════════ */}
              {activeTab === 'mine' && (
                <>
                  {/* Mode selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">اختر نمط المعركة:</label>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { mode: '2v2', label: 'ثنائية (2v2)', desc: 'جولتان حاسمتان', icon: '⚔️' },
                        { mode: '4v4', label: 'فرق (4v4)',    desc: 'أربع جولات',     icon: '🛡️' },
                        { mode: '5v5', label: 'شاملة (5v5)', desc: 'خمس جولات',      icon: '👑' },
                      ] as { mode: ClanBattleMode; label: string; desc: string; icon: string }[]).map(item => (
                        <button
                          key={item.mode}
                          onClick={() => setSelectedMode(item.mode)}
                          className={`p-3.5 rounded-2xl border text-center transition-all ${
                            selectedMode === item.mode
                              ? 'bg-red-500/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)] text-white'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <span className="text-2xl block mb-1">{item.icon}</span>
                          <span className="text-xs font-black block">{item.label}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Launch form (only when no active battle) */}
                  {(!activeBattle || activeBattle.status === 'completed') && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 rounded-3xl border border-red-500/30 space-y-4 bg-gradient-to-br from-red-950/20 to-slate-950">
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <Flame size={16} className="text-red-400" /> إشعال حرب كلانات جديدة — {selectedMode}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1.5">الكلان المنافس:</label>
                          <select value={enemyClanId} onChange={e => setEnemyClanId(e.target.value)}
                            className="select-field text-xs py-2.5 px-3 w-full font-bold">
                            {availableClans.map(c => (
                              <option key={c.id} value={c.id}>{c.badge} {c.name} [{c.tag}] — ليفل {c.level}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1.5">الرهان / مقاتل ($):</label>
                          <select value={stakePerPlayer} onChange={e => setStakePerPlayer(Number(e.target.value))}
                            className="select-field text-xs py-2.5 px-3 w-full font-mono font-bold">
                            {[50, 100, 250, 500, 1000].map(v => <option key={v} value={v}>${v}</option>)}
                          </select>
                        </div>
                      </div>
                      <button onClick={handleStartClanBattle} disabled={loading}
                        className="btn-primary w-full py-3 text-sm font-black bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 shadow-[0_0_24px_rgba(239,68,68,0.4)] gap-2">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Swords size={18} />}
                        إعلان الحرب وبدء جولات {selectedMode} ⚔️
                      </button>
                    </motion.div>
                  )}

                  {/* Active battle arena */}
                  {activeBattle && (
                    <BattleArena
                      battle={activeBattle}
                      isMyBattle={true}
                      resolvingRound={resolvingRound}
                      onFightRound={handleFightRound}
                      myClanId={myClanId}
                    />
                  )}
                </>
              )}

              {/* ═══════════════ SPECTATE TAB ═══════════════ */}
              {activeTab === 'spectate' && (
                <div className="space-y-4">
                  {/* Active battle list */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Radio size={14} className="text-red-400 animate-pulse" /> المعارك الحية الآن ({allBattles.length})
                    </h3>
                    <button onClick={loadAllActiveBattles}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs transition-colors">
                      <RefreshCw size={12} /> تحديث
                    </button>
                  </div>

                  {allBattles.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Swords size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">لا توجد معارك نشطة الآن</p>
                      <p className="text-xs mt-1 text-slate-600">ابدأ حرباً من تبويب "معركتي"</p>
                    </div>
                  ) : (
                    <>
                      {/* Selector pills */}
                      <div className="flex gap-2 flex-wrap">
                        {allBattles.map(b => (
                          <button key={b.id} onClick={() => setSpectating(b)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                              spectating?.id === b.id
                                ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                            }`}>
                            <span className="font-black">{b.mode}</span> · {b.clan_a_name} vs {b.clan_b_name}
                            {b.status === 'active' && (
                              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Spectator view */}
                      {spectating && (
                        <motion.div key={spectating.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                          <BattleArena
                            battle={spectating}
                            isMyBattle={false}
                            resolvingRound={null}
                            onFightRound={() => {}}
                            myClanId={myClanId}
                          />
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Live Ticker Sidebar ── */}
            <div className="w-64 shrink-0 border-r border-slate-800 bg-slate-950/80 flex flex-col hidden sm:flex">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                <Zap size={13} className="text-amber-400 animate-pulse" />
                <span className="text-xs font-black text-slate-300 uppercase tracking-widest">بث مباشر</span>
              </div>
              <div ref={tickerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                <AnimatePresence initial={false}>
                  {ticker.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center mt-4">في انتظار أحداث المعركة...</p>
                  ) : ticker.map(ev => (
                    <motion.div key={ev.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-sm shrink-0">{ev.icon}</span>
                      <p className={`text-[11px] leading-relaxed font-bold ${ev.color}`}>{ev.text}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
            <p className="text-[11px] text-slate-600">
              {realtimeOk ? '🟢 متصل بالبث المباشر' : '🔴 يتم إعادة الاتصال...'}
            </p>
            <button onClick={onClose} className="btn-secondary text-xs px-6 py-2 font-bold">إغلاق</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ─── BattleArena sub-component ───────────────────────────────
interface BattleArenaProps {
  battle: ClanBattle
  isMyBattle: boolean
  resolvingRound: number | null
  onFightRound: (idx: number) => void
  myClanId?: string | null
}

function BattleArena({ battle, isMyBattle, resolvingRound, onFightRound, myClanId }: BattleArenaProps) {
  const isMyClanA = myClanId && battle.clan_a_id === myClanId
  const isMyClanB = myClanId && battle.clan_b_id === myClanId

  return (
    <div className="space-y-4">
      {/* Scoreboard */}
      <div className="relative p-5 rounded-3xl bg-slate-950/80 border-2 border-red-500/30 overflow-hidden">
        {/* background shimmer for active */}
        {battle.status === 'active' && (
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-blue-900/10 animate-pulse pointer-events-none" />
        )}
        <div className="relative flex items-center justify-between gap-2">
          {/* Clan A */}
          <div className="text-center space-y-1 flex-1">
            {(isMyClanA) && <span className="text-[10px] font-black text-green-400 uppercase block">كلانك</span>}
            <span className="text-xs text-red-400 font-bold block">فريق أ</span>
            <strong className="text-base font-black text-white block">{battle.clan_a_name}</strong>
            <span className="text-[10px] text-slate-500 font-mono block">[{battle.clan_a_tag}]</span>
            <motion.span key={battle.clan_a_score}
              initial={{ scale: 1.5, color: '#f87171' }} animate={{ scale: 1, color: '#f87171' }}
              className="text-3xl font-black font-mono text-red-400 block">
              {battle.clan_a_score}
            </motion.span>
          </div>

          {/* Center VS */}
          <div className="text-center px-3 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center font-black text-white text-xl mx-auto shadow-lg mb-2">
              VS
            </div>
            <span className="text-[11px] font-black text-amber-300 block">🏆 {battle.total_prize}</span>
            <span className="text-[10px] text-slate-500 font-mono block">{battle.mode}</span>
            {battle.status === 'active' && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-[10px] text-green-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />LIVE
              </span>
            )}
            {battle.status === 'completed' && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-500 font-bold">
                انتهت
              </span>
            )}
          </div>

          {/* Clan B */}
          <div className="text-center space-y-1 flex-1">
            {(isMyClanB) && <span className="text-[10px] font-black text-green-400 uppercase block">كلانك</span>}
            <span className="text-xs text-blue-400 font-bold block">فريق ب</span>
            <strong className="text-base font-black text-white block">{battle.clan_b_name}</strong>
            <span className="text-[10px] text-slate-500 font-mono block">[{battle.clan_b_tag}]</span>
            <motion.span key={battle.clan_b_score}
              initial={{ scale: 1.5, color: '#60a5fa' }} animate={{ scale: 1, color: '#60a5fa' }}
              className="text-3xl font-black font-mono text-blue-400 block">
              {battle.clan_b_score}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Match list */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-black text-slate-300 flex items-center gap-2">
          <Users size={13} className="text-red-400" /> مواجهات المقاتلين الفردية:
        </h4>
        {battle.matches.map((match, idx) => (
          <MatchRow
            key={idx}
            match={match}
            idx={idx}
            isMyBattle={isMyBattle}
            resolvingRound={resolvingRound}
            onFightRound={onFightRound}
          />
        ))}
      </div>

      {/* Winner banner */}
      {battle.status === 'completed' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-center shadow-2xl border-2 border-yellow-200 space-y-2"
        >
          <Trophy size={36} className="mx-auto" />
          <h3 className="text-xl font-black uppercase tracking-wider">انتهت حرب الكلانات!</h3>
          <p className="text-sm font-bold">
            {battle.clan_a_score > battle.clan_b_score ? battle.clan_a_name : battle.clan_b_name} يفوز!
            <br />الجائزة: ${battle.total_prize} للكلان الفائز 🏆
          </p>
        </motion.div>
      )}
    </div>
  )
}

// ─── MatchRow sub-component ──────────────────────────────────
interface MatchRowProps {
  match: ClanBattleMatch
  idx: number
  isMyBattle: boolean
  resolvingRound: number | null
  onFightRound: (idx: number) => void
}

function MatchRow({ match, idx, isMyBattle, resolvingRound, onFightRound }: MatchRowProps) {
  const done = match.status === 'completed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className={`p-4 rounded-2xl border transition-all ${
        done
          ? match.winner_side === 'A'
            ? 'bg-red-950/20 border-red-500/30'
            : 'bg-blue-950/20 border-blue-500/30'
          : 'bg-slate-900/60 border-slate-800'
      }`}
    >
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {/* Player A */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[120px]">
          <div className="relative shrink-0">
            <img
              src={match.player_a.card_image || '/characters/changli.webp'}
              alt={match.player_a.card_name || ''}
              className={`w-10 h-10 rounded-xl object-cover border-2 ${done && match.winner_side === 'A' ? 'border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'border-red-500/40'}`}
              onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/1e1b4b/6366f1?text=A' }}
            />
            {done && match.winner_side === 'A' && (
              <Crown size={12} className="absolute -top-1.5 -right-1.5 text-yellow-400 drop-shadow" />
            )}
          </div>
          <div>
            <span className="text-xs font-black text-white block">{match.player_a.username}</span>
            {match.player_a.card_name && <span className="text-[10px] text-slate-500 block">{match.player_a.card_name}</span>}
            <span className="text-[10px] text-red-300 font-mono">ATK: {match.player_a.atk ?? '??'}</span>
          </div>
        </div>

        {/* Center status */}
        <div className="text-center shrink-0 px-1">
          <span className="text-[10px] font-mono text-slate-500 block mb-1">الجولة #{match.round}</span>
          {done ? (
            <div className="space-y-1">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border block ${
                match.winner_side === 'A'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}>
                {match.winner_name} 🏆
              </span>
              {match.duel_score && (
                <span className="text-[10px] font-mono text-slate-500 block">{match.duel_score}</span>
              )}
            </div>
          ) : isMyBattle ? (
            <button
              onClick={() => onFightRound(idx)}
              disabled={resolvingRound === idx}
              className="btn-primary py-1.5 px-3 text-xs font-bold bg-red-600 hover:bg-red-500 shadow-md gap-1"
            >
              {resolvingRound === idx ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              خوض الجولة ⚔️
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
              في الانتظار...
            </span>
          )}
        </div>

        {/* Player B */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[120px] justify-end text-left">
          <div className="text-right">
            <span className="text-xs font-black text-white block">{match.player_b.username}</span>
            {match.player_b.card_name && <span className="text-[10px] text-slate-500 block">{match.player_b.card_name}</span>}
            <span className="text-[10px] text-blue-300 font-mono">ATK: {match.player_b.atk ?? '??'}</span>
          </div>
          <div className="relative shrink-0">
            <img
              src={match.player_b.card_image || '/characters/jiyan.webp'}
              alt={match.player_b.card_name || ''}
              className={`w-10 h-10 rounded-xl object-cover border-2 ${done && match.winner_side === 'B' ? 'border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'border-blue-500/40'}`}
              onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/1e3a5f/60a5fa?text=B' }}
            />
            {done && match.winner_side === 'B' && (
              <Crown size={12} className="absolute -top-1.5 -left-1.5 text-yellow-400 drop-shadow" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
