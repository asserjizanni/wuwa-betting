import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Swords, Shield, Heart, Zap, Sparkles, X, Trophy, 
  RotateCcw, Award, Flame, Skull, Loader2, Play,
  Volume2, VolumeX, FastForward, Pause, Plus, Bookmark,
  Layers, Check, AlertCircle, ArrowRight
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { CardSelector, type SelectableCardItem } from '../shared/CardSelector'
import { playDuelClashSound, playLpDamageSound, playDuelVictoryFanfare } from '../../lib/audio'
import { calculateCardStats } from '../../lib/cardStats'
import toast from 'react-hot-toast'

interface BossArenaProps {
  isOpen?: boolean
  onClose: () => void
  boss: any
  currentUserId?: string
  currentUsername?: string
  playerCards?: SelectableCardItem[]
  onBattleCompleted?: () => void
  onVictory?: () => void
}

interface BattleCard {
  id: string
  card_id: string
  name: string
  image_path: string
  element: string
  rarity: string
  level: number
  atk: number
  def: number
  speed: number
  crit_rate: number
  crit_dmg: number
  max_hp: number
  current_hp: number
}

const ELEMENT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  Spectro: { bg: 'from-amber-600/40 to-yellow-900/60', border: 'border-amber-400', text: 'text-amber-300', glow: 'shadow-amber-500/50' },
  Havoc: { bg: 'from-rose-900/60 to-purple-950/80', border: 'border-rose-500', text: 'text-rose-300', glow: 'shadow-rose-500/50' },
  Aero: { bg: 'from-emerald-700/40 to-teal-950/70', border: 'border-emerald-400', text: 'text-emerald-300', glow: 'shadow-emerald-500/50' },
  Electro: { bg: 'from-purple-800/50 to-indigo-950/80', border: 'border-purple-400', text: 'text-purple-300', glow: 'shadow-purple-500/50' },
  Fusion: { bg: 'from-red-700/50 to-orange-950/80', border: 'border-orange-500', text: 'text-orange-300', glow: 'shadow-orange-500/50' },
  Glacio: { bg: 'from-cyan-700/40 to-blue-950/70', border: 'border-cyan-400', text: 'text-cyan-300', glow: 'shadow-cyan-500/50' },
}

const RARITY_BORDER: Record<string, string> = {
  legendary: 'border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.5)]',
  epic: 'border-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.4)]',
  rare: 'border-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.4)]',
  uncommon: 'border-emerald-400',
  common: 'border-slate-600',
}

export function BossArena({
  isOpen = true,
  onClose,
  boss,
  currentUserId,
  currentUsername = 'البطل',
  playerCards = [],
  onBattleCompleted,
  onVictory,
}: BossArenaProps) {
  // All owned cards in player inventory
  const [availableCards, setAvailableCards] = useState<SelectableCardItem[]>(playerCards)
  const [savedDecks, setSavedDecks] = useState<any[]>([])

  // Selection Phase (1 to 5 cards)
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])
  const [selectedItems, setSelectedItems] = useState<SelectableCardItem[]>([])

  // Battle Phase state
  const [inBattle, setInBattle] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [isActing, setIsActing] = useState(false)
  const [turnNumber, setTurnNumber] = useState(1)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Combat entities
  const [battleCards, setBattleCards] = useState<BattleCard[]>([]) // Cards currently in player's hand
  const [usedCardIdsHistory, setUsedCardIdsHistory] = useState<Set<string>>(new Set()) // Cards already deployed/played
  const [activePlayerCard, setActivePlayerCard] = useState<BattleCard | null>(null)
  const [playerHp, setPlayerHp] = useState(0)
  const [playerMaxHp, setPlayerMaxHp] = useState(0)

  // Boss stats
  const [bossHp, setBossHp] = useState(0)
  const [bossMaxHp, setBossMaxHp] = useState(0)
  const [bossRevivesLeft, setBossRevivesLeft] = useState(0)
  const [activeBossCard, setActiveBossCard] = useState<any | null>(null)
  const [bossAttacking, setBossAttacking] = useState(false)
  const [playerAttacking, setPlayerAttacking] = useState(false)

  // Floating damage indicators
  const [bossFloatingDmg, setBossFloatingDmg] = useState<{ amount: number; isCrit?: boolean } | null>(null)
  const [playerFloatingDmg, setPlayerFloatingDmg] = useState<{ amount: number; isCrit?: boolean } | null>(null)
  const [combatCommentary, setCombatCommentary] = useState<string>('اختر بطاقة من يدك لإلقائها في الساحة وشن الهجوم!')

  // Inventory reinforcement modal (using CardSelector like challenges page)
  const [reinforceModalOpen, setReinforceModalOpen] = useState(false)
  const [selectedReinforceIds, setSelectedReinforceIds] = useState<string[]>([])
  const [selectedReinforceItems, setSelectedReinforceItems] = useState<SelectableCardItem[]>([])

  // End game state
  const [battleFinished, setBattleFinished] = useState(false)
  const [isVictory, setIsVictory] = useState(false)
  const [grantedRewards, setGrantedRewards] = useState<any>(null)

  // Meta maps for rewards
  const [cardsMap, setCardsMap] = useState<Record<string, any>>({})
  const [titlesMap, setTitlesMap] = useState<Record<string, any>>({})

  // Normalize boss deck
  const bossDeck: any[] = useMemo(() => {
    const rawDeck = boss?.deck || boss?.deck_cards || []
    if (Array.isArray(rawDeck) && rawDeck.length > 0) {
      return rawDeck
    }
    return [{
      name: boss?.name_ar || boss?.name || 'الزعيم',
      image: boss?.avatar_url || '/characters/scar.webp',
      image_path: boss?.avatar_url || '/characters/scar.webp',
      atk: Number(boss?.stats?.atk || boss?.atk || 300),
      hp: Number(boss?.stats?.hp || boss?.hp || 6000),
      element: 'Havoc',
      rarity: 'legendary',
    }]
  }, [boss])

  // Unused cards in inventory available for reinforcement (exclude cards in hand and already played)
  const unusedInventoryCards = useMemo(() => {
    const currentHandIds = new Set(battleCards.map(c => c.id))
    return availableCards.filter(c => !currentHandIds.has(c.id) && !usedCardIdsHistory.has(c.id))
  }, [availableCards, battleCards, usedCardIdsHistory])

  // Load cards map & titles map
  useEffect(() => {
    supabase.from('cards').select('id, name, rarity, element, image_path').then(({ data }) => {
      if (data) {
        const m: Record<string, any> = {}
        data.forEach(c => { m[c.id] = c })
        setCardsMap(m)
      }
    })
    supabase.from('titles').select('id, name_ar, rarity, icon, animation_style').then(({ data }) => {
      if (data) {
        const m: Record<string, any> = {}
        data.forEach(t => { m[t.id] = t })
        setTitlesMap(m)
      }
    })
  }, [])

  // Load player cards from inventory and saved presets
  useEffect(() => {
    if (playerCards && playerCards.length > 0) {
      setAvailableCards(playerCards)
      if (selectedCardIds.length === 0) {
        const initial = playerCards.slice(0, 5)
        setSelectedCardIds(initial.map(c => c.id))
        setSelectedItems(initial)
      }
    } else if (currentUserId) {
      supabase
        .from('player_cards')
        .select(`
          id,
          card_id,
          evolution_level,
          fusion_level,
          serial_number,
          card:cards(id, name, element, rarity, image_path, stats)
        `)
        .eq('player_id', currentUserId)
        .eq('status', 'owned')
        .then(({ data, error }) => {
          if (error) console.error('BossArena: Failed to load player cards:', error)
          if (data && data.length > 0) {
            const mapped: SelectableCardItem[] = data.map((pc: any) => {
              const calcStats = calculateCardStats(
                pc.card?.stats,
                pc.evolution_level || 1,
                pc.fusion_level || 0
              )
              return {
                id: pc.id,
                card_id: pc.card_id || pc.card?.id,
                name: pc.card?.name || 'بطاقة',
                image_path: pc.card?.image_path || '/characters/changli.webp',
                element: pc.card?.element || 'Fusion',
                rarity: pc.card?.rarity || 'common',
                stats: calcStats,
                raw_stats: pc.card?.stats,
                evolution_level: pc.evolution_level || 1,
                fusion_level: pc.fusion_level || 0,
                serial_number: pc.serial_number,
              }
            })
            setAvailableCards(mapped)
            if (selectedCardIds.length === 0) {
              const initial = mapped.slice(0, 5)
              setSelectedCardIds(initial.map(c => c.id))
              setSelectedItems(initial)
            }
          }
        })

      // Load saved decks
      supabase
        .from('player_decks')
        .select('*')
        .eq('player_id', currentUserId)
        .order('is_favorite', { ascending: false })
        .then(({ data }) => {
          if (data) setSavedDecks(data)
        })
    }
  }, [playerCards, currentUserId])

  // Reset when arena is closed
  useEffect(() => {
    if (!isOpen) {
      setInBattle(false)
      setBattleFinished(false)
      setActivePlayerCard(null)
      setActiveBossCard(null)
    }
  }, [isOpen])

  if (!isOpen || !boss) return null

  // Quick preset selection from saved decks
  const handleSelectPreset = (preset: any) => {
    const pCards = preset.cards || preset.card_ids || []
    if (!pCards || pCards.length === 0) return

    let matched: SelectableCardItem[] = []
    if (typeof pCards[0] === 'string') {
      matched = availableCards.filter(c => pCards.includes(c.id) || pCards.includes(c.card_id))
    } else {
      matched = availableCards.filter(ac => pCards.some((pc: any) => pc.id === ac.id || pc.card_id === ac.card_id))
    }

    if (matched.length > 0) {
      const sliced = matched.slice(0, 5)
      setSelectedItems(sliced)
      setSelectedCardIds(sliced.map(c => c.id))
      toast.success(`تم اختيار تشكيلة: ${preset.name}`)
    }
  }

  // Helper to get boss card image
  const getBossCardImg = (card: any) => {
    return card?.image_path || card?.image || boss?.avatar_url || '/characters/scar.webp'
  }

  // Start turn-by-turn battle
  const handleStartBattle = () => {
    if (!currentUserId) {
      toast.error('يجب تسجيل الدخول لخوض معركة الزعيم')
      return
    }
    if (selectedCardIds.length === 0) {
      toast.error('اختر بطاقة واحدة على الأقل لخوض المعركة!')
      return
    }

    // Convert selected items to battle cards with accurate unified stats (base + evolution + fusion)
    const bCards: BattleCard[] = selectedItems.map(item => {
      const calcStats = calculateCardStats(
        (item as any).raw_stats || item.stats,
        item.evolution_level || 1,
        item.fusion_level || 0
      )

      return {
        id: item.id,
        card_id: item.card_id,
        name: item.name,
        image_path: item.image_path || '/characters/changli.webp',
        element: item.element || 'Fusion',
        rarity: item.rarity || 'common',
        level: item.evolution_level || 1,
        atk: calcStats.atk,
        def: calcStats.def,
        speed: calcStats.speed,
        crit_rate: calcStats.crit_rate,
        crit_dmg: calcStats.crit_dmg,
        max_hp: calcStats.hp,
        current_hp: calcStats.hp,
      }
    })

    const initialTotalHp = bCards.reduce((acc, c) => acc + c.max_hp, 0)
    setPlayerMaxHp(initialTotalHp)
    setPlayerHp(initialTotalHp)

    const bMaxHp = Number(boss.stats?.hp || boss.hp || 6000)
    setBossMaxHp(bMaxHp)
    setBossHp(bMaxHp)
    setBossRevivesLeft(Number(boss.stats?.revive_count || 0))

    setBattleCards(bCards)
    setUsedCardIdsHistory(new Set())
    setTurnNumber(1)
    setIsPlayerTurn(true)
    setIsActing(false)
    setBattleFinished(false)
    setIsVictory(false)
    setGrantedRewards(null)

    // Set first cards in arena
    setActivePlayerCard(bCards[0])
    setActiveBossCard(bossDeck[0])
    setCombatCommentary(`بدأت المعركة الأسطورية ضد ${boss.name_ar || boss.name}! انقر على أي بطاقة في يدك لإلقائها والهجوم! ⚔️`)
    setInBattle(true)

    if (onBattleCompleted) onBattleCompleted()
  }

  // Confirm reinforcement from unused inventory using CardSelector
  const handleConfirmReinforcement = () => {
    if (selectedReinforceItems.length === 0) return

    const newCards: BattleCard[] = selectedReinforceItems.map(item => {
      const calcStats = calculateCardStats(
        (item as any).raw_stats || item.stats,
        item.evolution_level || 1,
        item.fusion_level || 0
      )

      return {
        id: item.id,
        card_id: item.card_id,
        name: item.name,
        image_path: item.image_path || '/characters/changli.webp',
        element: item.element || 'Fusion',
        rarity: item.rarity || 'common',
        level: item.evolution_level || 1,
        atk: calcStats.atk,
        def: calcStats.def,
        speed: calcStats.speed,
        crit_rate: calcStats.crit_rate,
        crit_dmg: calcStats.crit_dmg,
        max_hp: calcStats.hp,
        current_hp: calcStats.hp,
      }
    })

    const addedHp = newCards.reduce((acc, c) => acc + c.max_hp, 0)
    setPlayerMaxHp(prev => prev + addedHp)
    setPlayerHp(prev => prev + addedHp)

    setBattleCards(prev => [...prev, ...newCards])
    setSelectedReinforceIds([])
    setSelectedReinforceItems([])
    setReinforceModalOpen(false)

    toast.success(`تم استدعاء ${newCards.length} بطاقة من مخزونك بنجاح! ⚡`)
    setCombatCommentary(`انضمت ${newCards.length} بطاقة جديدة من مخزونك إلى يدك لمواصلة المعركة!`)
  }

  // Core Combat Action: Clicking on a card directly plays it to attack the boss!
  const handlePlayCard = async (card: BattleCard, index: number) => {
    if (!isPlayerTurn || isActing || battleFinished) return

    setIsActing(true)
    setActivePlayerCard(card)

    // 1. Player Card Strikes Boss
    setPlayerAttacking(true)
    if (soundEnabled) playDuelClashSound()

    const isCrit = (Math.random() * 100) < card.crit_rate
    let dmg = Math.round(card.atk * (0.85 + Math.random() * 0.3) - ((boss.stats?.def || 140) * 0.3))
    if (isCrit) dmg = Math.round(dmg * (card.crit_dmg / 100))
    dmg = Math.max(130, dmg)

    setBossFloatingDmg({ amount: dmg, isCrit })
    setTimeout(() => setBossFloatingDmg(null), 1200)

    const newBossHp = Math.max(0, bossHp - dmg)
    setBossHp(newBossHp)

    setCombatCommentary(
      `💥 الجولة ${turnNumber}: ألقيت [${card.name}] في الساحة وألحقت ${dmg} ضرراً بالزعيم! ${isCrit ? '🔥 [ضربة حرجة! CRIT]' : ''}`
    )

    await new Promise(r => setTimeout(r, 650))
    setPlayerAttacking(false)

    // Remove the card from player hand (it has been played/used!)
    setBattleCards(prev => prev.filter(c => c.id !== card.id))
    setUsedCardIdsHistory(prev => new Set(prev).add(card.id))

    // Check Boss Defeat
    if (newBossHp <= 0) {
      if (bossRevivesLeft > 0) {
        const revHp = Math.round(bossMaxHp * 0.35)
        setBossRevivesLeft(prev => prev - 1)
        setBossHp(revHp)
        setCombatCommentary(`🔥 نهض الزعيم مجدداً بفضل طاقة الهاوية واستعاد ${revHp} نقطة حياة!`)
      } else {
        // Absolute Victory!
        handleBattleVictory()
        setIsActing(false)
        return
      }
    }

    // 2. Boss Retaliation Phase
    setIsPlayerTurn(false)
    await new Promise(r => setTimeout(r, 700))

    // Rotate boss deck card
    const bCardIdx = (turnNumber - 1) % bossDeck.length
    const currentBossCard = bossDeck[bCardIdx]
    setActiveBossCard(currentBossCard)
    setBossAttacking(true)

    const bossAtk = Number(currentBossCard.atk || boss.stats?.atk || 280)
    let bossDmg = Math.round(bossAtk * (0.85 + Math.random() * 0.3) - (card.def * 0.25))
    const bossCrit = (Math.random() * 100) < (boss.stats?.crit_rate || 15)
    if (bossCrit) bossDmg = Math.round(bossDmg * 1.5)
    bossDmg = Math.max(90, bossDmg)

    if (soundEnabled) playLpDamageSound()
    setPlayerFloatingDmg({ amount: bossDmg, isCrit: bossCrit })
    setTimeout(() => setPlayerFloatingDmg(null), 1200)

    // Deduct damage from Player Total HP
    const nextPlayerHp = Math.max(0, playerHp - bossDmg)
    setPlayerHp(nextPlayerHp)

    setCombatCommentary(prev => 
      `${prev} | ⚡ رد كارت الزعيم [${currentBossCard.name}] بهجوم ألحق ${bossDmg} ضرراً بفريقك!`
    )

    await new Promise(r => setTimeout(r, 700))
    setBossAttacking(false)

    // Check Player Defeat
    if (nextPlayerHp <= 0) {
      handleBattleDefeat()
      setIsActing(false)
      return
    }

    // If player hand is now empty:
    const remainingInHand = battleCards.length - 1
    if (remainingInHand <= 0) {
      if (unusedInventoryCards.length > 0) {
        toast('نفدت البطاقات من يدك! استدعِ بطاقات جديدة من باقي مخزونك لإكمال المعركة ⚡', { icon: '🛡️' })
        setReinforceModalOpen(true)
      } else {
        // Out of cards in hand AND no cards left in inventory!
        handleBattleDefeat()
        setIsActing(false)
        return
      }
    }

    // Turn cycle completed
    setTurnNumber(prev => prev + 1)
    setIsPlayerTurn(true)
    setIsActing(false)
  }

  // Handle Victory: commit to Supabase and grant rewards
  const handleBattleVictory = async () => {
    setBattleFinished(true)
    setIsVictory(true)
    if (soundEnabled) playDuelVictoryFanfare()

    const winPoints = Number(boss.rewards?.points || boss.win_points || 500)
    const fbPoints = Number(boss.rewards?.first_blood_points || boss.first_blood_points || 0)
    const isFirstBlood = !boss.first_defeat_player_id
    const totalPoints = winPoints + (isFirstBlood ? fbPoints : 0)

    try {
      const allUsedIds = Array.from(usedCardIdsHistory)
      const { data: rpcRes } = await supabase.rpc('execute_boss_battle', {
        p_player_id: currentUserId,
        p_boss_id: boss.id,
        p_player_card_ids: allUsedIds.length > 0 ? allUsedIds : selectedCardIds
      })

      if (rpcRes?.success && rpcRes.rewards) {
        setGrantedRewards(rpcRes.rewards)
      } else {
        if (totalPoints > 0 && currentUserId) {
          const { data: curP } = await supabase.from('players').select('balance, total_winnings').eq('id', currentUserId).single()
          if (curP) {
            await supabase.from('players').update({
              balance: (curP.balance || 0) + totalPoints,
              total_winnings: (curP.total_winnings || 0) + totalPoints
            }).eq('id', currentUserId)
          }
        }
        setGrantedRewards({
          points: totalPoints,
          cards: boss.rewards?.items?.filter((i: any) => i.type === 'card') || [],
          titles: boss.rewards?.items?.filter((i: any) => i.type === 'title') || [],
        })
      }
    } catch (err) {
      console.warn('RPC sync warning, using local victory grant:', err)
      setGrantedRewards({
        points: totalPoints,
        cards: boss.rewards?.items?.filter((i: any) => i.type === 'card') || [],
        titles: boss.rewards?.items?.filter((i: any) => i.type === 'title') || [],
      })
    }

    if (onVictory) onVictory()
  }

  // Handle Defeat
  const handleBattleDefeat = () => {
    setBattleFinished(true)
    setIsVictory(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md select-none" dir="rtl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card rounded-3xl w-full max-w-5xl h-[94vh] flex flex-col overflow-hidden border border-slate-700/80 shadow-2xl relative bg-[#060a12]"
      >
        {/* Top Navigation Bar */}
        <div
          className="relative px-5 py-3 border-b border-slate-800 flex items-center justify-between z-20 shrink-0"
          style={{
            background: `linear-gradient(135deg, ${boss.accent_color || '#ef4444'}20, rgba(10, 15, 29, 0.95))`
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-amber-700 flex items-center justify-center shadow-glow-amber border border-amber-400/40">
              <Swords size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-amber-300 text-sm sm:text-base">
                  ساحة مبارزة كروت Resonance WuWa • قتال الزعيم
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                  {boss.difficulty}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  ذكاء {boss.ai_level}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                مواجهة تعتمد على كروت اليد ضد <strong className="text-white">{boss.name_ar || boss.name}</strong> • المكافأة: <span className="text-amber-400 font-bold">${boss.rewards?.points || boss.win_points || 500}</span>
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

        {/* Modal Body */}
        {!inBattle ? (
          /* ================= PHASE 1: DECK & INVENTORY SELECTION ================= */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
            {/* Boss Stats Preview */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 block">صحة الزعيم (HP)</span>
                <strong className="text-red-400 text-sm font-black font-mono">{boss.stats?.hp || boss.hp || 6000}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 block">الهجوم (ATK)</span>
                <strong className="text-amber-400 text-sm font-black font-mono">{boss.stats?.atk || boss.atk || 280}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 block">الدفاع (DEF)</span>
                <strong className="text-blue-400 text-sm font-black font-mono">{boss.stats?.def || boss.def || 140}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 block">فرص الإحياء</span>
                <strong className="text-purple-400 text-sm font-black font-mono">{boss.stats?.revive_count || 0}</strong>
              </div>
            </div>

            {/* Boss Configured Deck Preview */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-red-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-red-300 flex items-center gap-1.5">
                  <Skull size={14} className="text-red-400" />
                  تشكيلة كروت الزعيم المعتمدة ({bossDeck.length} بطاقات):
                </span>
                <span className="text-[10px] text-slate-400 font-mono">يتم تبديلها دورياً في كل جولة</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {bossDeck.map((bd: any, idx: number) => (
                  <div key={idx} className="shrink-0 w-28 p-2 rounded-xl bg-slate-950 border border-red-500/30 flex flex-col items-center text-center">
                    <img
                      src={getBossCardImg(bd)}
                      alt={bd.name}
                      className="w-14 h-18 object-cover rounded-lg border border-red-500/40 mb-1.5"
                    />
                    <span className="text-[10px] font-bold text-white truncate max-w-full">{bd.name}</span>
                    <span className="text-[9px] font-mono font-bold text-red-400 mt-0.5">⚔️ {bd.atk || 280}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Presets Quick Selector (Just like Challenges page) */}
            {savedDecks.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Bookmark size={14} className="text-amber-400" />
                  <span className="font-bold text-slate-200">تشكيلاتي المحفوظة:</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {savedDecks.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 shrink-0 transition-all"
                    >
                      <Layers size={12} className="text-primary-400" />
                      <span>{preset.name}</span>
                      <span className="text-[10px] text-slate-400">({preset.cards?.length || preset.card_ids?.length || 0})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Deck Overview with (X) remove buttons */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-primary-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-primary-400" />
                  <span className="text-xs font-black text-white">
                    تشكيلة القتال الحالية ({selectedItems.length} من 5 بطاقات)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  المخزون المتبقي: <strong className="text-amber-400">{availableCards.length - selectedItems.length}</strong> بطاقة
                </span>
              </div>

              {selectedItems.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-400">
                  لم يتم اختيار أي بطاقة حتى الآن. اختر من 1 إلى 5 بطاقات من مخزونك أدناه!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {selectedItems.map((c, idx) => (
                    <div
                      key={c.id || idx}
                      className="relative group rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950/70 p-2.5 flex flex-col justify-between"
                    >
                      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-900 mb-2">
                        <img
                          src={c.image_path || '/characters/changli.webp'}
                          alt={c.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-1 right-1 flex flex-col items-end gap-0.5">
                          <span className="bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-400">
                            Lv.{c.evolution_level || 1}
                          </span>
                          {(c.fusion_level ?? 0) > 0 && (
                            <span className="bg-cyan-500/90 px-1.5 py-0.5 rounded text-[10px] font-bold text-black">
                              ✦F{c.fusion_level}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const next = selectedItems.filter((_, i) => i !== idx)
                            setSelectedItems(next)
                            setSelectedCardIds(next.map(item => item.id))
                          }}
                          className="absolute top-1 left-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          title="إزالة من التشكيلة"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-white truncate">{c.name}</h5>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span className="text-red-400 font-bold">⚔ {c.stats?.atk || 1200}</span>
                          <span className="text-emerald-400 font-bold">♥ {c.stats?.hp || 3500}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory Card Selector (Same logic as Challenges page) */}
            <CardSelector
              mode="player"
              playerId={currentUserId}
              cards={availableCards}
              selectedCardIds={selectedCardIds}
              maxSelect={5}
              minSelect={1}
              onSelectionChange={(ids, items) => {
                setSelectedCardIds(ids)
                setSelectedItems(items)
              }}
              title="اختر بطاقاتك من مخزونك (1 إلى 5 بطاقات)"
              subtitle="يمكنك خوض المعركة بأي عدد من البطاقات. البطاقات غير المستخدمة ستبقى في مخزونك ويمكنك استدعاؤها أثناء القتال كتعزيزات!"
            />

            {/* Start Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartBattle}
                disabled={simulating || selectedCardIds.length === 0}
                className="btn-primary w-full py-4 text-base font-black flex items-center justify-center gap-2 shadow-glow-red rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                }}
              >
                <Swords size={22} />
                دخول ساحة المواجهة بالبطاقات المختارة ({selectedCardIds.length} بطاقات) ⚔️
              </button>
            </div>
          </div>
        ) : (
          /* ================= PHASE 2: PURE CARD DUEL ARENA (NO ATTACK/DEF BUTTONS) ================= */
          <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0d1424] via-[#070b14] to-[#020408] overflow-hidden">
            
            {/* OPPONENT AREA (TOP): Boss Info & HP Bar */}
            <div className="flex items-center justify-between px-5 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl overflow-hidden bg-black/60 border-2 transition-all ${
                  bossAttacking ? 'border-red-500 scale-110 shadow-glow-red' : 'border-slate-700'
                }`}>
                  <img
                    src={boss.avatar_url || '/characters/scar.webp'}
                    alt={boss.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{boss.name_ar || boss.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30">
                      {boss.difficulty}
                    </span>
                    {bossRevivesLeft > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        إحياء ×{bossRevivesLeft}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">{boss.title || 'زعيم العالم المظلم'}</span>
                </div>
              </div>

              {/* Boss HP Bar & Counter */}
              <div className="flex items-center gap-4">
                <div className="w-36 sm:w-56 space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                    <span className="text-red-400">BOSS HP</span>
                    <span className="text-red-300">{bossHp} / {bossMaxHp}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-red-950">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shadow-glow-red"
                      animate={{ width: `${Math.max(0, Math.min(100, (bossHp / bossMaxHp) * 100))}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                <div className="text-left bg-black/70 px-4 py-1.5 rounded-xl border border-red-500/40">
                  <span className="text-[9px] font-black uppercase text-red-400 tracking-wider block">LIFE POINTS</span>
                  <strong className="font-mono text-base font-black text-red-300">
                    {bossHp} <span className="text-[10px]">HP</span>
                  </strong>
                </div>
              </div>
            </div>

            {/* CENTER FELT TABLE: Clash Arena */}
            <div className="my-auto relative flex flex-col items-center justify-center py-2 flex-1">
              
              {/* Outer Felt Stadium Circle */}
              <div className="w-80 h-48 sm:w-[520px] sm:h-56 rounded-[120px] bg-gradient-to-b from-emerald-950/40 via-slate-900/70 to-black border-4 border-amber-500/30 shadow-[inset_0_0_60px_rgba(0,0,0,0.95)] flex items-center justify-center relative overflow-hidden">
                
                {/* Floating Damage on Boss */}
                <AnimatePresence>
                  {bossFloatingDmg && (
                    <motion.div
                      initial={{ y: 20, opacity: 0, scale: 0.5 }}
                      animate={{ y: -50, opacity: 1, scale: bossFloatingDmg.isCrit ? 1.5 : 1.2 }}
                      exit={{ opacity: 0 }}
                      className={`absolute top-4 z-40 font-mono text-2xl font-black drop-shadow-[0_0_15px_rgba(239,68,68,0.9)] ${
                        bossFloatingDmg.isCrit ? 'text-amber-300' : 'text-red-400'
                      }`}
                    >
                      -{bossFloatingDmg.amount} HP {bossFloatingDmg.isCrit && '💥 CRIT!'}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Floating Damage on Player */}
                <AnimatePresence>
                  {playerFloatingDmg && (
                    <motion.div
                      initial={{ y: -20, opacity: 0, scale: 0.5 }}
                      animate={{ y: 50, opacity: 1, scale: playerFloatingDmg.isCrit ? 1.5 : 1.2 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-4 z-40 font-mono text-2xl font-black text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.9)]"
                    >
                      -{playerFloatingDmg.amount} HP {playerFloatingDmg.isCrit && '💥 CRIT!'}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Clash zone: Boss Card (left) vs Player Played Card (right) */}
                <div className="flex items-center gap-6 z-20">
                  
                  {/* BOSS ACTIVE CARD */}
                  <AnimatePresence mode="wait">
                    {activeBossCard ? (
                      <motion.div
                        key={`boss-card-${activeBossCard.name}-${turnNumber}`}
                        initial={{ scale: 0.6, x: -30, opacity: 0 }}
                        animate={{ 
                          scale: bossAttacking ? 1.15 : 0.95, 
                          x: bossAttacking ? 20 : 0, 
                          opacity: 1 
                        }}
                        transition={{ type: 'spring', damping: 15 }}
                        className={`w-28 h-40 sm:w-32 sm:h-44 rounded-2xl bg-gradient-to-b from-red-950 via-slate-950 to-black border-2 p-1.5 flex flex-col justify-between ${
                          RARITY_BORDER[activeBossCard.rarity] || 'border-red-500'
                        } ${bossAttacking ? 'shadow-[0_0_30px_rgba(239,68,68,0.8)]' : 'shadow-[0_0_14px_rgba(239,68,68,0.3)]'}`}
                      >
                        <div className="flex justify-between items-center text-[9px] font-black">
                          <span className="px-1.5 py-0.5 rounded bg-black/60 border border-red-500/40 text-red-300">
                            {activeBossCard.element || 'Havoc'}
                          </span>
                          <span className="font-mono text-red-400 font-bold text-[9px]">
                            ⚔️ {Math.round(activeBossCard.atk || 280)}
                          </span>
                        </div>
                        <div className="relative w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-red-500/20 bg-black/80">
                          <img
                            src={getBossCardImg(activeBossCard)}
                            alt={activeBossCard.name}
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                          <span className="absolute bottom-0.5 right-1 text-[9px] font-black text-white truncate max-w-[90%]">
                            {activeBossCard.name}
                          </span>
                        </div>
                        <div className="text-[9px] text-center font-bold text-red-300 truncate">
                          {bossAttacking ? '⚡ كارت الزعيم يهاجم!' : '🛡️ كارت الزعيم النشط'}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="w-28 h-40 rounded-2xl border-2 border-dashed border-red-800/40 flex items-center justify-center">
                        <Skull size={28} className="text-red-900/60" />
                      </div>
                    )}
                  </AnimatePresence>

                  {/* VS Divider */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="text-xs font-black text-amber-400/80">VS</span>
                    <motion.div
                      animate={{ scale: [1, 1.25, 1], rotate: [0, 15, -15, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Swords size={22} className="text-amber-500" />
                    </motion.div>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">جولة {turnNumber}</span>
                  </div>

                  {/* PLAYER ACTIVE PLAYED CARD */}
                  <AnimatePresence mode="wait">
                    {activePlayerCard ? (
                      <motion.div
                        key={`player-card-${activePlayerCard.id}-${turnNumber}`}
                        initial={{ scale: 0.6, x: 30, opacity: 0 }}
                        animate={{ 
                          scale: playerAttacking ? 1.15 : 0.95, 
                          x: playerAttacking ? -20 : 0, 
                          opacity: 1 
                        }}
                        transition={{ type: 'spring', damping: 15 }}
                        className={`w-28 h-40 sm:w-32 sm:h-44 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 p-1.5 flex flex-col justify-between ${
                          RARITY_BORDER[activePlayerCard.rarity] || 'border-amber-400'
                        } ${playerAttacking ? 'shadow-[0_0_30px_rgba(245,158,11,0.7)]' : 'shadow-[0_0_14px_rgba(245,158,11,0.2)]'}`}
                      >
                        <div className="flex justify-between items-center text-[9px] font-black">
                          <span className="px-1.5 py-0.5 rounded bg-black/60 border border-amber-500/30 text-amber-300">
                            {activePlayerCard.element}
                          </span>
                          <span className="font-mono text-amber-400 font-bold text-[9px]">
                            ⚔️ {activePlayerCard.atk}
                          </span>
                        </div>
                        <div className="relative w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-amber-500/20 bg-black/80">
                          <img
                            src={activePlayerCard.image_path || '/characters/changli.webp'}
                            alt={activePlayerCard.name}
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                          <span className="absolute bottom-0.5 right-1 text-[9px] font-black text-white truncate max-w-[90%]">
                            {activePlayerCard.name}
                          </span>
                        </div>
                        <div className="text-[9px] text-center font-bold text-amber-300 truncate">
                          {playerAttacking ? '💥 إلقاء هجوم البطاقة!' : '⚔️ بطاقتك في الساحة'}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="w-28 h-40 rounded-2xl border-2 border-dashed border-slate-700/40 flex flex-col items-center justify-center p-2 text-center">
                        <Swords size={24} className="text-slate-600 mb-1" />
                        <span className="text-[9px] text-slate-400 font-bold">انقر على بطاقة بالأسفل لإلقائها</span>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Live Combat Commentary Box */}
              <div className="mt-3 max-w-xl w-full px-5 py-2.5 rounded-2xl bg-slate-950/90 border border-amber-500/30 text-center shadow-lg">
                <p className="text-xs sm:text-sm font-bold text-amber-200 leading-snug">
                  {combatCommentary}
                </p>
                {isPlayerTurn && !isActing && !battleFinished && (
                  <p className="text-[11px] text-amber-400 font-bold mt-1 animate-pulse">
                    👈 انقر على أي بطاقة في يدك أدناه لإلقائها في الساحة وشن الهجوم!
                  </p>
                )}
              </div>
            </div>

            {/* PLAYER AREA (BOTTOM): Life Points & Interactive Hand of Cards */}
            <div className="shrink-0 space-y-2 z-10">
              {/* Player HP Bar Row */}
              <div className="flex items-center justify-between px-5 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 border border-blue-400 flex items-center justify-center font-black text-white text-sm shadow-md">
                    {currentUsername[0]?.toUpperCase() || 'P'}
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">{currentUsername} (أنت)</span>
                    <span className="text-[10px] text-slate-400">
                      البطاقات في اليد: <strong className="text-white">{battleCards.length}</strong> بطاقة
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-36 sm:w-56 space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                      <span className="text-emerald-400">YOUR LP</span>
                      <span className="text-emerald-300">{playerHp} / {playerMaxHp}</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-emerald-950">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-glow-green"
                        animate={{ width: `${Math.max(0, Math.min(100, (playerHp / (playerMaxHp || 1)) * 100))}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>

                  {/* Reinforce from Inventory Button */}
                  {unusedInventoryCards.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setReinforceModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-black flex items-center gap-1.5 transition-all shadow-glow-amber active:scale-95"
                    >
                      <Plus size={14} />
                      استدعاء من باقي المخزون ({unusedInventoryCards.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Player Interactive Hand: Click a card to play it directly! */}
              <div className="flex justify-center -space-x-2 sm:-space-x-3 overflow-x-auto py-2 px-2 scrollbar-none">
                {battleCards.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-dashed border-amber-500/40 text-center">
                    <p className="text-xs text-amber-300 font-bold mb-2">نفدت البطاقات الحالية من يدك!</p>
                    {unusedInventoryCards.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setReinforceModalOpen(true)}
                        className="btn-primary text-xs py-2 px-4 flex items-center gap-2 mx-auto"
                      >
                        <Plus size={14} /> اختر بطاقات إضافية من باقي المخزون ({unusedInventoryCards.length})
                      </button>
                    ) : (
                      <p className="text-[11px] text-slate-500">لا توجد بطاقات متبقية في المخزون</p>
                    )}
                  </div>
                ) : (
                  battleCards.map((card, idx) => {
                    const elemStyle = ELEMENT_COLORS[card.element] || ELEMENT_COLORS.Fusion
                    return (
                      <motion.div
                        key={card.id || idx}
                        whileHover={isPlayerTurn && !isActing ? { y: -16, scale: 1.08, zIndex: 35 } : {}}
                        whileTap={isPlayerTurn && !isActing ? { scale: 0.95 } : {}}
                        onClick={() => handlePlayCard(card, idx)}
                        className={`relative w-24 h-36 sm:w-28 sm:h-40 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black p-1.5 text-white shadow-xl flex flex-col justify-between transition-all select-none shrink-0 overflow-hidden border-2 ${
                          elemStyle.border
                        } ${
                          !isPlayerTurn || isActing
                            ? 'opacity-60 cursor-not-allowed'
                            : 'cursor-pointer hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] ring-1 ring-amber-400/40'
                        }`}
                      >
                        {/* Card number badge */}
                        <div className="absolute top-1 right-1 z-20 w-4 h-4 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center text-[8px] font-black text-slate-300">
                          {idx + 1}
                        </div>

                        {/* Top Bar: Element & ATK */}
                        <div className="flex justify-between items-center text-[9px] font-black z-10">
                          <span className={`px-1.5 py-0.5 rounded bg-black/60 border ${elemStyle.border} ${elemStyle.text} text-[8px]`}>
                            {card.element}
                          </span>
                          <span className="font-mono text-amber-400 font-black flex items-center gap-0.5 text-[9px]">
                            ⚔️ {card.atk}
                          </span>
                        </div>

                        {/* Character Artwork */}
                        <div className="relative w-full h-20 sm:h-24 rounded-lg overflow-hidden border border-white/10 my-0.5 bg-black/80">
                          <img
                            src={card.image_path || '/characters/changli.webp'}
                            alt={card.name}
                            className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                          <span className="absolute bottom-0.5 right-1 text-[8px] font-black text-white drop-shadow-md truncate max-w-[90%]">
                            {card.name}
                          </span>
                        </div>

                        {/* Card bottom: Level & Prompt */}
                        <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 z-10 px-0.5">
                          <span className="text-amber-400 font-bold">Lv.{card.level}</span>
                          <span className="text-emerald-400 font-bold">انقر للإلقاء ⚔️</span>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </div>

            {/* REINFORCE MODAL: Select more cards from rest of unused inventory (Same as Challenges page) */}
            <AnimatePresence>
              {reinforceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl p-6 shadow-2xl max-h-[90vh] flex flex-col space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Plus className="text-amber-400" size={22} />
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-white">
                            استدعاء بطاقات من باقي المخزون ({unusedInventoryCards.length} بطاقة متاحة)
                          </h3>
                          <p className="text-xs text-slate-400">
                            اختر ما يصل إلى {Math.max(1, 5 - battleCards.length)} بطاقات لإضافتها إلى يدك واستخدامها في المعركة!
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setReinforceModalOpen(false)}
                        className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1">
                      <CardSelector
                        mode="player"
                        playerId={currentUserId}
                        cards={unusedInventoryCards}
                        selectedCardIds={selectedReinforceIds}
                        maxSelect={Math.max(1, 5 - battleCards.length)}
                        minSelect={1}
                        onSelectionChange={(ids, items) => {
                          setSelectedReinforceIds(ids)
                          setSelectedReinforceItems(items)
                        }}
                        title="البطاقات غير المستخدمة في مخزونك"
                        subtitle={`اختر حتى ${Math.max(1, 5 - battleCards.length)} بطاقات لتعبئة يدك`}
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        المحدد: <strong className="text-amber-400 font-bold">{selectedReinforceItems.length}</strong> بطاقة
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setReinforceModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          disabled={selectedReinforceItems.length === 0}
                          onClick={handleConfirmReinforcement}
                          className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-glow-amber disabled:opacity-40"
                        >
                          <Check size={15} />
                          تأكيد الاستدعاء لليد ({selectedReinforceItems.length})
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* VICTORY / DEFEAT MODAL OVERLAY */}
            <AnimatePresence>
              {battleFinished && (
                <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-8 rounded-3xl max-w-md w-full border-2 shadow-2xl space-y-4"
                    style={{
                      background: isVictory
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.95))'
                        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(15, 23, 42, 0.95))',
                      borderColor: isVictory ? '#f59e0b' : '#ef4444'
                    }}
                  >
                    {isVictory ? (
                      <div className="space-y-3">
                        <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400 shadow-glow-amber">
                          <Trophy size={42} />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-wide">
                          انتصار أسطوري ساحق! 👑
                        </h2>
                        <p className="text-xs text-amber-200">
                          تمت هزيمة الزعيم {boss.name_ar || boss.name} بنجاح في الجولة {turnNumber}!
                        </p>

                        {grantedRewards?.points > 0 && (
                          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-black text-base flex items-center justify-center gap-2 number-ltr">
                            <span>+${grantedRewards.points} مكافأة الفوز 💰</span>
                          </div>
                        )}

                        {/* Granted Cards */}
                        {grantedRewards?.cards && grantedRewards.cards.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-amber-500/30">
                            <div className="text-xs font-black text-amber-300 flex items-center justify-center gap-1.5">
                              <Sparkles size={14} className="text-amber-400" />
                              بطاقات نادرة فزت بها وأضيفت لمخزونك!
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                              {grantedRewards.cards.map((c: any, cIdx: number) => {
                                const cardData = cardsMap[c.card_id] || c
                                return (
                                  <div key={cIdx} className="p-2 rounded-xl bg-slate-900/90 border border-amber-500/40 flex items-center gap-2 text-right shadow-md">
                                    <img
                                      src={cardData.image_path || '/characters/changli.webp'}
                                      alt={cardData.name}
                                      className="w-8 h-10 object-cover rounded-md shrink-0 border border-amber-400/50"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <span className="text-[11px] font-black text-white block truncate">{cardData.name || 'بطاقة نادرة'}</span>
                                      <span className="text-[9px] font-black uppercase text-amber-400">{cardData.rarity || 'legendary'}</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Granted Titles */}
                        {grantedRewards?.titles && grantedRewards.titles.length > 0 && (
                          <div className="space-y-1.5 pt-1.5 border-t border-purple-500/30">
                            <div className="text-xs font-black text-purple-300 flex items-center justify-center gap-1.5">
                              <Award size={14} className="text-purple-400" />
                              ألقاب شرفية حصرية جديدة أضيفت لملفك!
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              {grantedRewards.titles.map((t: any, tIdx: number) => {
                                const titleData = titlesMap[t.title_id] || t
                                return (
                                  <div
                                    key={tIdx}
                                    className="px-3 py-1 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs font-black flex items-center gap-1.5 shadow-md"
                                  >
                                    <span>{titleData.icon || '👑'}</span>
                                    <span>{titleData.name_ar || 'لقب شرفي'}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto text-red-400">
                          <Skull size={42} />
                        </div>
                        <h2 className="text-2xl font-black text-white">
                          سقطت تشكيلتك أمام الزعيم! 💀
                        </h2>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          طوّر مستويات بطاقاتك، واستدعِ المزيد من البطاقات غير المستخدمة في مخزونك لمواصلة الصمود.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-3">
                      <button
                        onClick={() => {
                          setInBattle(false)
                          setBattleFinished(false)
                          setBattleCards([])
                          setActiveBossCard(null)
                          setActivePlayerCard(null)
                        }}
                        className="btn-secondary flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw size={14} /> إعادة المحاولة
                      </button>
                      <button
                        onClick={onClose}
                        className="btn-primary flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        إغلاق الساحة
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}
