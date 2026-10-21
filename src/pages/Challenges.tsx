import React, { useEffect, useState, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Swords, Trophy, Clock, Plus, X, Check, Shield, Zap, 
  RefreshCw, Loader2, Sparkles, Heart, ShieldAlert, Award, FileText, Flame,
  Layers, Save, Bookmark, Trash2, Edit3, User
} from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { useUIStore } from "../store"
import { supabase } from "../lib/supabase"
import { AnimatedNumber, Modal } from "../components/shared/UI"
import { YuGiOhDuelArena } from "../components/challenges/YuGiOhDuelArena"
import { UnoManualDuelArena } from "../components/challenges/UnoManualDuelArena"
import { ClanWarsArena } from "../components/guilds/ClanWarsArena"
import { CardSelector, type SelectableCardItem } from "../components/shared/CardSelector"
import { calculateCardStats } from "../lib/cardStats"
import toast from "react-hot-toast"

type ChallengeItem = {
  id: string
  opponent: string
  opponentLevel: number
  stake: number
  status: "pending" | "accepted" | "declined" | "completed" | "expired" | "cancelled"
  isChallenger: boolean
  createdAt: string
  challengerId: string
  challengedId: string
  challengerName: string
  challengedName: string
  winnerId?: string | null
  winnerName?: string | null
  combatLog?: any[] | null
  battleState?: any | null
}

export function ChallengesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { player, isAuthenticated, refreshPlayer } = useAuth()
  const { setLoginModalOpen } = useUIStore()

  const [challenges, setChallenges] = useState<ChallengeItem[]>([])
  const [playerCards, setPlayerCards] = useState<any[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string>('')
  const [selectedDeck, setSelectedDeck] = useState<any[]>([])
  const [savedDecks, setSavedDecks] = useState<any[]>([])
  const [deckModalOpen, setDeckModalOpen] = useState(false)
  const [saveDeckModalOpen, setSaveDeckModalOpen] = useState(false)
  const [deckNameInput, setDeckNameInput] = useState('تشكيلة القتال 1')
  const [savingDeck, setSavingDeck] = useState(false)

  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [opponentUsername, setOpponentUsername] = useState("")
  const [stakeAmount, setStakeAmount] = useState(100)
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState("active")

  // Check for prefill opponent from query params
  useEffect(() => {
    const prefill = searchParams.get('opponent')
    if (prefill) {
      setOpponentUsername(prefill)
      setShowCreateModal(true)
    }
  }, [searchParams])

  // Uno Manual Duel Arena State
  const [unoModal, setUnoModal] = useState<{
    isOpen: boolean
    challenge: ChallengeItem | null
  }>({
    isOpen: false,
    challenge: null,
  })

  // Clan Wars State
  const [clanWarsOpen, setClanWarsOpen] = useState(false)
  const [myClan, setMyClan] = useState<{ id: string; name: string } | null>(null)

  // Yu-Gi-Oh Duel Arena State
  const [duelArena, setDuelArena] = useState<{
    isOpen: boolean
    challenge: ChallengeItem | null
    winnerName: string | null
    winnerId?: string | null
    stake: number
    challenger: {
      id: string
      name: string
      card?: any
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
      card?: any
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
  }>({
    isOpen: false,
    challenge: null,
    winnerName: null,
    winnerId: null,
    stake: 0,
    challenger: { id: '', name: '', hp: 4000, max_hp: 4000, atk: 1800, def: 1200 },
    challenged: { id: '', name: '', hp: 4000, max_hp: 4000, atk: 1750, def: 1150 },
    combatLog: [],
  })

  useEffect(() => {
    if (player?.id) {
      loadPlayerChallenges()
      loadPlayerCards()
      loadPlayerClan()
      loadPlayerDecks()
    }
  }, [player?.id])

  const loadPlayerDecks = async () => {
    if (!player?.id) return
    try {
      const { data } = await supabase
        .from('player_decks')
        .select('*')
        .eq('player_id', player.id)
        .order('is_favorite', { ascending: false })

      if (data && data.length > 0) {
        setSavedDecks(data)
        const firstCards = data[0].cards || data[0].card_ids
        if (firstCards && firstCards.length > 0) {
          if (typeof firstCards[0] === 'string') {
            const mapped = availableCards.filter(c => firstCards.includes(c.id) || firstCards.includes(c.card_id))
            if (mapped.length > 0) {
              setSelectedDeck(mapped)
              setSelectedCardId(mapped[0].id || mapped[0].card_id)
            }
          } else {
            setSelectedDeck(firstCards)
            setSelectedCardId(firstCards[0].id || firstCards[0].card_id)
          }
        }
      }
    } catch (err) {
      console.warn('Error loading player decks:', err)
    }
  }

  const loadPlayerClan = async () => {
    if (!player?.id) return
    try {
      const { data } = await supabase
        .from('guild_members')
        .select('guild:guild_id(id, name)')
        .eq('player_id', player.id)
        .maybeSingle()

      if (data?.guild) {
        setMyClan(data.guild as any)
      }
    } catch (err) {
      console.warn('Error loading player clan:', err)
    }
  }

  const loadPlayerCards = async () => {
    if (!player?.id) return
    try {
      const { data, error } = await supabase
        .from('player_cards')
        .select(`
          id,
          card_id,
          evolution_level,
          fusion_level,
          serial_number,
          card:cards(*)
        `)
        .eq('player_id', player.id)
        .eq('status', 'owned')

      if (error) {
        console.warn('Error loading player cards:', error)
        return
      }

      if (data && data.length > 0) {
        setPlayerCards(data)
        const initialCards = data.slice(0, 5).map(pc => {
          const c = pc.card || {}
          const calcStats = calculateCardStats(
            c.stats,
            pc.evolution_level || 1,
            pc.fusion_level || 0
          )
          return {
            id: pc.id,
            card_id: c.id || pc.card_id,
            name: c.name || 'بطاقة',
            image_url: c.image_path || '/characters/changli.webp',
            image_path: c.image_path || '/characters/changli.webp',
            element: c.element || 'Fusion',
            rarity: c.rarity || 'common',
            atk: calcStats.atk,
            def: calcStats.def,
            hp: calcStats.hp,
            speed: calcStats.speed,
            level: pc.evolution_level || 1,
            evolution_level: pc.evolution_level || 1,
            fusion_level: pc.fusion_level || 0,
          }
        })
        setSelectedDeck(prev => prev.length > 0 ? prev : initialCards)
        if (data[0].card?.id) {
          setSelectedCardId(data[0].card.id)
        }
      }
    } catch (err) {
      console.warn('Error loading player cards:', err)
    }
  }

  const availableCards: SelectableCardItem[] = useMemo(() => {
    return playerCards.map((pc: any) => {
      const c = pc.card || {}
      const calcStats = calculateCardStats(
        c.stats,
        pc.evolution_level || 1,
        pc.fusion_level || 0
      )
      return {
        id: pc.id,
        card_id: c.id || pc.card_id,
        name: c.name || 'بطاقة',
        title: c.title || null,
        subtitle: c.subtitle || null,
        element: c.element || 'Fusion',
        rarity: c.rarity || 'common',
        image_path: c.image_path || '/characters/changli.webp',
        card_design_override: c.card_design_override || null,
        evolution_level: pc.evolution_level || 1,
        fusion_level: pc.fusion_level || 0,
        serial_number: pc.serial_number,
        stats: calcStats,
        raw_stats: c.stats,
      }
    })
  }, [playerCards])

  const handleSaveDeck = async () => {
    if (!player?.id) return
    if (selectedDeck.length === 0) {
      return toast.error('يرجى اختيار بطاقة واحدة على الأقل في التشكيلة')
    }
    setSavingDeck(true)
    try {
      const { error } = await supabase
        .from('player_decks')
        .insert([{
          player_id: player.id,
          name: deckNameInput.trim() || 'تشكيلة جديدة',
          cards: selectedDeck,
          card_ids: selectedDeck.map(c => c.id || c.card_id),
          is_favorite: true,
        }])

      if (error) throw error
      toast.success('تم حفظ التشكيلة بنجاح!')
      setSaveDeckModalOpen(false)
      loadPlayerDecks()
    } catch (err: any) {
      toast.error('فشل حفظ التشكيلة: ' + err.message)
    } finally {
      setSavingDeck(false)
    }
  }

  const handleSelectSavedPreset = (deck: any) => {
    const deckCards = deck.cards || deck.card_ids
    if (deckCards && deckCards.length > 0) {
      if (typeof deckCards[0] === 'string') {
        const resolved = availableCards.filter(c => deckCards.includes(c.id) || deckCards.includes(c.card_id))
        if (resolved.length > 0) {
          setSelectedDeck(resolved)
          setSelectedCardId(resolved[0].id || resolved[0].card_id)
        }
      } else {
        setSelectedDeck(deckCards)
        setSelectedCardId(deckCards[0].id || deckCards[0].card_id)
      }
      toast.success(`تم تفعيل: ${deck.name}`)
    }
  }

  const handleDeleteSavedDeck = async (deckId: string) => {
    try {
      await supabase.from('player_decks').delete().eq('id', deckId)
      toast.success('تم حذف التشكيلة')
      loadPlayerDecks()
    } catch (err: any) {
      toast.error('فشل حذف التشكيلة')
    }
  }

  const loadPlayerChallenges = async () => {
    if (!player?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pvp_challenges')
        .select(`
          *,
          challenger:challenger_id(id, username),
          challenged:challenged_id(id, username),
          winner:winner_id(id, username)
        `)
        .or(`challenger_id.eq.${player.id},challenged_id.eq.${player.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setChallenges(data.map((c: any) => {
          const isChallenger = c.challenger_id === player.id
          const opponent = isChallenger ? c.challenged?.username || 'خصم' : c.challenger?.username || 'خصم'
          return {
            id: c.id,
            opponent,
            opponentLevel: 5,
            stake: Number(c.stake),
            status: c.status,
            isChallenger,
            createdAt: c.created_at,
            challengerId: c.challenger_id,
            challengedId: c.challenged_id,
            challengerName: c.challenger?.username || 'المتحدي',
            challengedName: c.challenged?.username || 'المنافس',
            winnerId: c.winner_id,
            winnerName: c.winner?.username || null,
            combatLog: c.combat_log || null,
            battleState: c.battle_state || null,
          }
        }))
      }
    } catch (err) {
      console.warn('Error loading challenges:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated || !player) {
    return (
      <div className="min-h-screen pt-20 pb-28 md:pb-16 flex items-center justify-center px-4" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center glass-card rounded-3xl p-10 max-w-sm border border-slate-700/60">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <Swords size={28} className="text-red-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">سجّل دخولك أولاً</h2>
          <p className="text-slate-400 text-sm mb-6">يجب تسجيل الدخول للمشاركة في تحديات الساحة</p>
          <button onClick={() => setLoginModalOpen(true)} className="btn-primary w-full">دخول الساحة</button>
        </motion.div>
      </div>
    )
  }

  const activeDuels = challenges.filter(c => c.status === "accepted")
  const incoming = challenges.filter(c => !c.isChallenger && c.status === "pending")
  const outgoing = challenges.filter(c => c.isChallenger && c.status === "pending")
  const history = challenges.filter(c => c.status === "completed" || c.status === "cancelled" || c.status === "declined")

  const handleAccept = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pvp_challenges')
        .update({ status: 'accepted' })
        .eq('id', id)

      if (error) throw error
      toast.success("تم قبول التحدي وبدأت المواجهة! ⚔️")
      await loadPlayerChallenges()
      await refreshPlayer()
    } catch (err) {
      toast.error("فشل قبول التحدي")
    }
  }

  const handleDecline = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pvp_challenges')
        .update({ status: 'declined' })
        .eq('id', id)

      if (error) throw error
      toast.success("تم رفض التحدي")
      await loadPlayerChallenges()
    } catch (err) {
      toast.error("حدث خطأ")
    }
  }

  const handleCreate = async () => {
    const trimmedOpponent = opponentUsername.trim().toLowerCase()
    if (!trimmedOpponent) { toast.error("أدخل اسم المنافس"); return }
    if (trimmedOpponent === player.username.toLowerCase()) {
      toast.error("لا يمكنك تحدي نفسك!"); return
    }
    if (stakeAmount < 50) { toast.error("الحد الأدنى للرهان 50$"); return }
    if (stakeAmount > player.balance) { toast.error("رصيدك غير كافٍ"); return }

    setCreating(true)
    try {
      // Find opponent
      const { data: opponentData, error: oppError } = await supabase
        .from('players')
        .select('id, username')
        .eq('username_normalized', trimmedOpponent)
        .maybeSingle()

      if (oppError || !opponentData) {
        throw new Error('اللاعب غير موجود، تأكد من كتابة الاسم بدقة')
      }

      // Insert challenge
      const { error: insertError } = await supabase
        .from('pvp_challenges')
        .insert([{
          challenger_id: player.id,
          challenged_id: opponentData.id,
          stake: stakeAmount,
          status: 'pending'
        }])

      if (insertError) throw insertError

      // Send notification to challenged player
      await supabase.from('player_notifications').insert([{
        player_id: opponentData.id,
        type: 'challenge',
        title: 'تحدي جديد وارد! ⚔️',
        message: `أرسل لك اللاعب ${player.username} تحدياً برهان ${stakeAmount}$!`,
        icon: '⚔️'
      }])

      toast.success(`تم إرسال التحدي إلى ${opponentData.username}! ⚔️`)
      setShowCreateModal(false)
      setOpponentUsername("")
      setStakeAmount(100)
      await loadPlayerChallenges()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل إرسال التحدي')
    } finally {
      setCreating(false)
    }
  }

  // Start Combat Simulation in Arena
  const handleStartCombat = async (challenge: ChallengeItem) => {
    toast.loading('جارٍ استدعاء بطاقات القتال وبدء المبارزة...', { id: 'duel-loading' })

    try {
      // Call Supabase deterministic combat simulation RPC
      const { data: result, error } = await supabase.rpc('setup_and_simulate_pvp', {
        p_challenge_id: challenge.id,
        p_challenger_card_id: selectedCardId || null,
        p_challenged_card_id: null,
      })

      toast.dismiss('duel-loading')

      if (error) throw error
      if (!result?.success) throw new Error(result?.message || 'فشلت محاكاة المبارزة')

      const log = result.combat_log || result.log || []
      const bs = result.battle_state || {}
      const cData = bs.challenger || {}
      const dData = bs.challenged || {}

      const winnerName = result.winner_id === challenge.challengerId
        ? challenge.challengerName
        : challenge.challengedName

      setDuelArena({
        isOpen: true,
        challenge,
        winnerName,
        winnerId: result.winner_id,
        stake: challenge.stake,
        challenger: {
          id: challenge.challengerId,
          name: challenge.challengerName,
          cardName: cData.card_name || 'وحش المتحدي',
          cardImage: cData.card_image || '/characters/changli.webp',
          element: cData.element || 'Fusion',
          rarity: cData.rarity || 'legendary',
          atk: Number(cData.atk || 1800),
          def: Number(cData.def || 1200),
          hp: Number(cData.hp ?? 4000),
          max_hp: Number(cData.max_hp ?? 4000),
        },
        challenged: {
          id: challenge.challengedId,
          name: challenge.challengedName,
          cardName: dData.card_name || 'وحش المنافس',
          cardImage: dData.card_image || '/characters/jiyan.webp',
          element: dData.element || 'Aero',
          rarity: dData.rarity || 'epic',
          atk: Number(dData.atk || 1750),
          def: Number(dData.def || 1150),
          hp: Number(dData.hp ?? 4000),
          max_hp: Number(dData.max_hp ?? 4000),
        },
        combatLog: log,
      })

      toast.success(`انتهت المبارزة بفوز البطل ${winnerName}! 👑`)
      await loadPlayerChallenges()
      await refreshPlayer()
    } catch (err: any) {
      toast.dismiss('duel-loading')
      toast.error(err?.message || 'فشل تشغيل المبارزة')
    }
  }

  const handleViewCombatLog = (challenge: ChallengeItem) => {
    if (!challenge.combatLog || challenge.combatLog.length === 0) {
      toast.error('لا يتوفر سجل تفصيلي لهذه المواجهة')
      return
    }

    const bs = challenge.battleState || {}
    const cData = bs.challenger || {}
    const dData = bs.challenged || {}

    setDuelArena({
      isOpen: true,
      challenge,
      winnerName: challenge.winnerName || null,
      winnerId: challenge.winnerId,
      stake: challenge.stake,
      challenger: {
        id: challenge.challengerId,
        name: challenge.challengerName,
        cardName: cData.card_name || challenge.challengerName,
        cardImage: cData.card_image || '/characters/changli.webp',
        element: cData.element || 'Fusion',
        rarity: cData.rarity || 'legendary',
        atk: Number(cData.atk || 1800),
        def: Number(cData.def || 1200),
        hp: Number(cData.hp ?? (challenge.winnerId === challenge.challengerId ? 4000 : 0)),
        max_hp: Number(cData.max_hp ?? 4000),
      },
      challenged: {
        id: challenge.challengedId,
        name: challenge.challengedName,
        cardName: dData.card_name || challenge.challengedName,
        cardImage: dData.card_image || '/characters/jiyan.webp',
        element: dData.element || 'Aero',
        rarity: dData.rarity || 'epic',
        atk: Number(dData.atk || 1750),
        def: Number(dData.def || 1150),
        hp: Number(dData.hp ?? (challenge.winnerId === challenge.challengedId ? 4000 : 0)),
        max_hp: Number(dData.max_hp ?? 4000),
      },
      combatLog: challenge.combatLog,
    })
  }

  return (
    <div className="min-h-screen pt-20 pb-28 md:pb-16 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <Swords size={20} className="text-red-400" />
              </div>
              تحديات PvP ومحرك المعارك الحاسم
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              مواجهات تعتمد على HP والدرع وقوة الهجوم والإحياء حتى نفاد وسائل البقاء
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setClanWarsOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black flex items-center gap-2 shadow-glow-amber transition-all"
            >
              <Flame size={15} /> حرب الكلانات (2v2 • 4v4 • 5v5)
            </button>
            <button onClick={loadPlayerChallenges} className="btn-secondary text-xs">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 whitespace-nowrap shadow-glow-blue">
              <Plus size={16} /> تحدي جديد
            </button>
          </div>
        </motion.div>

        {/* Comprehensive Challenge Deck System */}
        <div className="glass-card rounded-3xl p-5 border border-primary-500/30 bg-slate-900/80 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Layers className="text-primary-400" size={18} />
                <h3 className="text-base font-black text-white">
                  تشكيلة القتال المعتمدة ({selectedDeck.length} من 5 بطاقات كحد أقصى)
                </h3>
              </div>
              <p className="text-slate-400 text-xs">
                يمكنك خوض التحديات بأي عدد تريده (من 1 إلى 5 بطاقات). يتم حفظ التشكيلة واعتمادها في كافة معاركك.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSaveDeckModalOpen(true)}
                disabled={selectedDeck.length === 0}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Save size={13} />
                حفظ التشكيلة
              </button>
              <button
                onClick={() => setDeckModalOpen(true)}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold"
              >
                <Edit3 size={13} />
                تعديل التشكيلة ({selectedDeck.length})
              </button>
            </div>
          </div>

          {/* Saved Presets Quick Selector */}
          {savedDecks.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
                <Bookmark size={13} className="text-primary-400" />
                تشكيلاتي المحفوظة:
              </span>
              {savedDecks.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl px-2.5 py-1 transition-all"
                >
                  <button
                    onClick={() => handleSelectSavedPreset(d)}
                    className="font-bold text-slate-200 hover:text-primary-300"
                  >
                    {d.name} ({d.cards?.length || d.card_ids?.length || 0})
                  </button>
                  <button
                    onClick={() => handleDeleteSavedDeck(d.id)}
                    className="text-slate-500 hover:text-red-400 p-0.5"
                    title="حذف"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Active Deck Cards Row */}
          {selectedDeck.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl p-4 space-y-2">
              <p className="text-slate-400 text-xs font-medium">لم يتم اختيار أي بطاقة في التشكيلة حتى الآن</p>
              <button
                onClick={() => setDeckModalOpen(true)}
                className="btn-primary text-xs py-1.5 px-4"
              >
                اختر من 1 إلى 5 بطاقات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {selectedDeck.map((c, idx) => (
                <div
                  key={c.id || idx}
                  className="relative group rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950/70 p-2.5 flex flex-col justify-between"
                >
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-900 mb-2">
                    <img
                      src={c.image_path || c.image_url || '/characters/changli.webp'}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-1 right-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-400">
                      Lv.{c.evolution_level || c.level || 1}
                    </div>
                    <button
                      onClick={() => {
                        const next = selectedDeck.filter((_, i) => i !== idx)
                        setSelectedDeck(next)
                        if (next.length > 0) setSelectedCardId(next[0].id || next[0].card_id)
                        else setSelectedCardId('')
                      }}
                      className="absolute top-1 left-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="إزالة من التشكيلة"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white truncate">{c.name}</h5>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="text-red-400 font-bold">⚔ {c.atk || 1200}</span>
                      <span className="text-emerald-400 font-bold">♥ {c.hp || 3500}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "مواجهات جارية", value: activeDuels.length, icon: Swords, color: "text-blue-400" },
            { label: "تحديات بانتظاري", value: incoming.length, icon: Clock, color: "text-amber-400" },
            { label: "رصيدي المتاح", value: player.balance, icon: Zap, color: "text-primary-400", prefix: "$" },
            { label: "تحديات مكتملة", value: history.length, icon: Trophy, color: "text-green-400" },
          ].map(({ label, value, icon: Icon, color, prefix }) => (
            <div key={label} className="glass-card rounded-2xl p-4 text-center border border-slate-700/60">
              <Icon size={18} className={`${color} mx-auto mb-1`} />
              <p className={`text-xl font-black ${color}`}><AnimatedNumber value={value} prefix={prefix || ""} /></p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "active", label: `الجارية (${activeDuels.length})` },
            { key: "incoming", label: `الواردة (${incoming.length})` },
            { key: "outgoing", label: `المرسلة (${outgoing.length})` },
            { key: "history", label: "السجل والنتائج" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 min-w-[85px] py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === key ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30" : "glass-card text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Challenge List */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {(() => {
            const list = activeTab === "active" ? activeDuels : activeTab === "incoming" ? incoming : activeTab === "outgoing" ? outgoing : history
            if (loading) {
              return (
                <div className="glass-card rounded-3xl p-12 text-center border border-slate-700/60">
                  <Loader2 size={32} className="animate-spin text-primary-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">جارٍ جلب التحديات...</p>
                </div>
              )
            }
            if (list.length === 0) {
              return (
                <div className="glass-card rounded-3xl p-12 text-center border border-slate-700/60">
                  <Swords size={40} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">لا توجد تحديات هنا حالياً</p>
                  {activeTab === "active" && <p className="text-slate-500 text-xs mt-1">لا توجد مبارزات جارية حالياً، اقبل تحدياً وارداً لبدء المواجهة!</p>}
                  {activeTab === "incoming" && <p className="text-slate-500 text-xs mt-1">ستظهر هنا التحديات الواردة من لاعبين آخرين</p>}
                  {activeTab === "outgoing" && <p className="text-slate-500 text-xs mt-1">ستظهر هنا التحديات التي أرسلتها وبانتظار رد الخصم</p>}
                </div>
              )
            }
            return list.map((challenge, idx) => (
              <motion.div key={challenge.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="glass-card rounded-2xl p-5 border border-slate-700/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Opponent Avatar */}
                    <div 
                      onClick={() => navigate(`/profile/${encodeURIComponent(challenge.opponent)}`)}
                      className="relative flex-shrink-0 cursor-pointer group"
                      title="عرض الملف الشخصي وتشكيلة القتال"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-xl font-black text-white shadow-md group-hover:scale-105 transition-transform">
                        {challenge.opponent[0]?.toUpperCase() || 'P'}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p 
                          onClick={() => navigate(`/profile/${encodeURIComponent(challenge.opponent)}`)}
                          className="font-black text-white cursor-pointer hover:text-amber-400 transition-colors flex items-center gap-1.5"
                          title="عرض تشكيلة القتال"
                        >
                          {challenge.opponent}
                          <span className="text-[10px] text-primary-400 font-bold bg-primary-500/10 px-1.5 py-0.5 rounded border border-primary-500/20">
                            الملف ⚔️
                          </span>
                        </p>
                        {challenge.status === "accepted" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold flex items-center gap-1">
                            <Swords size={11} className="animate-pulse" /> قتال نشط
                          </span>
                        )}
                        {challenge.status === "completed" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold">
                            {challenge.winnerName ? `الفائز: ${challenge.winnerName} 🏆` : 'مكتمل 🏆'}
                          </span>
                        )}
                        {challenge.status === "declined" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">مرفوض</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        الرهان: <span className="text-amber-400 font-bold number-ltr">${challenge.stake.toLocaleString("en-US")}</span>
                        <span className="text-slate-500 mr-2">• الجائزة الإجمالية: ${challenge.stake * 2}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions according to tab */}
                  <div className="flex items-center gap-2 justify-end">
                    {activeTab === "active" && (
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <button
                          onClick={() => setUnoModal({ isOpen: true, challenge })}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black flex items-center gap-1.5 shadow-glow-amber transition-all"
                          title="مبارزة كروت Resonance WuWa التفاعلية المباشرة"
                        >
                          ⚔️ مبارزة كروت WuWa
                        </button>
                        <button
                          onClick={() => handleStartCombat(challenge)}
                          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold shadow-glow-amber"
                          title="ساحة يوغي الكبرى ومحاكاة مراحل المعركة"
                        >
                          <Swords size={14} className="animate-pulse" />
                          ساحة يوغي ⚔️
                        </button>
                      </div>
                    )}

                    {activeTab === "incoming" && challenge.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => handleAccept(challenge.id)} className="h-9 px-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-bold hover:bg-green-500/30 transition-all flex items-center gap-1.5">
                          <Check size={14} /> قبول
                        </button>
                        <button onClick={() => handleDecline(challenge.id)} className="h-9 px-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-all flex items-center gap-1.5">
                          <X size={14} /> رفض
                        </button>
                      </div>
                    )}

                    {activeTab === "outgoing" && (
                      <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                        <Clock size={12} /> بانتظار رد الخصم
                      </span>
                    )}

                    {activeTab === "history" && challenge.combatLog && (
                      <button
                        onClick={() => handleViewCombatLog(challenge)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                      >
                        <FileText size={13} />
                        وقائع المعركة
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          })()}
        </motion.div>
      </div>

      {/* Yu-Gi-Oh Duel Arena */}
      <YuGiOhDuelArena
        isOpen={duelArena.isOpen}
        onClose={() => setDuelArena(prev => ({ ...prev, isOpen: false }))}
        stake={duelArena.stake}
        winnerName={duelArena.winnerName}
        winnerId={duelArena.winnerId}
        challenger={duelArena.challenger}
        challenged={duelArena.challenged}
        combatLog={duelArena.combatLog}
        currentUserId={player?.id}
      />

      {/* Uno Manual Duel Table Arena */}
      {unoModal.challenge && (
        <UnoManualDuelArena
          isOpen={unoModal.isOpen}
          onClose={() => setUnoModal({ isOpen: false, challenge: null })}
          challengeId={unoModal.challenge.id}
          currentUserId={player.id}
          challengerName={unoModal.challenge.challengerName}
          challengedName={unoModal.challenge.challengedName}
          stake={unoModal.challenge.stake}
          onDuelCompleted={() => {
            loadPlayerChallenges()
            refreshPlayer()
          }}
        />
      )}

      {/* Clan Wars Mode (2v2, 4v4, 5v5) */}
      <ClanWarsArena
        isOpen={clanWarsOpen}
        onClose={() => setClanWarsOpen(false)}
        myClanId={myClan?.id}
        myClanName={myClan?.name}
        currentUserId={player.id}
      />

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card rounded-3xl p-6 w-full max-w-sm border border-primary-500/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2"><Swords size={20} className="text-red-400" />تحدي جديد</h2>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">اسم المنافس المسجل بالمنصة</label>
                <input
                  value={opponentUsername}
                  onChange={e => setOpponentUsername(e.target.value)}
                  placeholder="أدخل اسم اللاعب المنافس بدقة..."
                  className="input-field py-2.5 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">مبلغ الرهان ($)</label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={e => setStakeAmount(Number(e.target.value))}
                  min={50}
                  max={player.balance}
                  className="input-field py-2 text-sm font-bold text-left"
                />
                <div className="flex gap-2 mt-2">
                  {[100, 250, 500, 1000].map(v => (
                    <button key={v} onClick={() => setStakeAmount(Math.min(v, player.balance))} className={`flex-1 text-xs py-1 rounded-lg border transition-all ${stakeAmount === v ? "bg-primary-500/20 border-primary-500/50 text-primary-400" : "border-slate-700 text-slate-400 hover:border-slate-600"}`}>
                      ${v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-xl p-3 border border-amber-500/20">
                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                  <Shield size={12} />رصيدك الحالي: <span className="font-bold number-ltr">${player.balance.toLocaleString("en-US")}</span>
                </p>
              </div>

              <button onClick={handleCreate} disabled={creating || !opponentUsername.trim()} className="btn-primary w-full py-3 text-sm font-bold">
                {creating ? "جاري الإرسال..." : "⚔️ إرسال التحدي للخصم"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Card Selector Modal for Challenge Deck */}
      <AnimatePresence>
        {deckModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl p-6 shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="text-primary-400" size={20} />
                  <div>
                    <h3 className="text-lg font-black text-white">اختر تشكيلة القتال (من 1 إلى 5 بطاقات)</h3>
                    <p className="text-xs text-slate-400">يمكنك بدء التحدي بأي عدد تريده دون إجبار على إكمال 5 بطاقات</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeckModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <CardSelector
                  mode="player"
                  playerId={player?.id}
                  cards={availableCards}
                  maxSelect={5}
                  minSelect={1}
                  selectedCardIds={selectedDeck.map(c => c.id || c.card_id)}
                  onSelectionChange={(selectedIds, selectedItems) => {
                    setSelectedDeck(selectedItems)
                    if (selectedItems.length > 0) {
                      setSelectedCardId(selectedItems[0].id || selectedItems[0].card_id)
                    } else {
                      setSelectedCardId('')
                    }
                  }}
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  تم اختيار: <strong className="text-primary-400 font-bold">{selectedDeck.length}</strong> من 5
                </span>
                <button
                  type="button"
                  onClick={() => setDeckModalOpen(false)}
                  className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold"
                >
                  تأكيد التشكيلة ({selectedDeck.length})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Deck Preset Modal */}
      <AnimatePresence>
        {saveDeckModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Save className="text-amber-400" size={20} />
                  <h3 className="text-base font-black text-white">حفظ التشكيلة الحالية</h3>
                </div>
                <button
                  onClick={() => setSaveDeckModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم التشكيلة:</label>
                <input
                  type="text"
                  value={deckNameInput}
                  onChange={(e) => setDeckNameInput(e.target.value)}
                  placeholder="مثال: تشكيلة الصواعق الهجومية"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div>تحتوي التشكيلة على: <strong className="text-white">{selectedDeck.length} بطاقات</strong></div>
                <div className="truncate text-[11px] text-slate-500">
                  {selectedDeck.map(c => c.name).join(' • ')}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaveDeckModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={savingDeck || !deckNameInput.trim()}
                  onClick={handleSaveDeck}
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  {savingDeck ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                  حفظ التشكيلة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
