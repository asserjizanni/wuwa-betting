import React, { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  User, Trophy, Star, Shield, Zap, Target, TrendingUp, Calendar, 
  Award, Crown, Sparkles, Edit3, Check, X, Lock, Eye, EyeOff, 
  Copy, CheckCircle, Palette, Image, ShieldCheck, RefreshCw, Flame, Layers,
  Swords, Search, Filter, ChevronLeft, ArrowRight, ExternalLink, Plus
} from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { useUIStore } from "../store"
import { supabase } from "../lib/supabase"
import { formatBalance, formatDate } from "../lib/utils"
import { AnimatedNumber, LoadingSpinner } from "../components/shared/UI"
import { PlayerTitleBadge } from "../components/shared/PlayerTitleBadge"
import { CardSelector, SelectableCardItem } from "../components/shared/CardSelector"
import { calculateCardStats } from "../lib/cardStats"
import toast from "react-hot-toast"

const ACHIEVEMENTS = [
  { id: "first_bet",    icon: "⚔️",  title: "المراهن الأول",   desc: "ضع أول رهان",             req: (p: any) => p.total_bets >= 1 },
  { id: "ten_bets",     icon: "🎯",  title: "متمرس",            desc: "ضع 10 رهانات",            req: (p: any) => p.total_bets >= 10 },
  { id: "fifty_bets",   icon: "🏹",  title: "المحترف",          desc: "ضع 50 رهان",              req: (p: any) => p.total_bets >= 50 },
  { id: "first_win",    icon: "🏆",  title: "أول انتصار",       desc: "افوز برهانك الأول",       req: (p: any) => p.winning_bets >= 1 },
  { id: "five_wins",    icon: "⭐",  title: "سلسلة الانتصارات", desc: "افوز بـ 5 رهانات",       req: (p: any) => p.winning_bets >= 5 },
  { id: "twenty_wins",  icon: "💎",  title: "بطل الساحة",       desc: "افوز بـ 20 رهان",        req: (p: any) => p.winning_bets >= 20 },
  { id: "balance_1k",   icon: "💰",  title: "ألف نقطة",         desc: "اجمع 1000 نقطة",         req: (p: any) => p.balance >= 1000 },
  { id: "balance_5k",   icon: "💎",  title: "خمسة آلاف",        desc: "اجمع 5000 نقطة",         req: (p: any) => p.balance >= 5000 },
  { id: "balance_10k",  icon: "👑",  title: "سيد الثروة",       desc: "اجمع 10000 نقطة",        req: (p: any) => p.balance >= 10000 },
  { id: "win_rate_60",  icon: "🎖️", title: "دقيق التوقعات",    desc: "حقق نسبة فوز 60%+",      req: (p: any) => p.total_bets >= 5 && (p.winning_bets / p.total_bets) >= 0.6 },
  { id: "win_rate_80",  icon: "🌟",  title: "عبقري التوقعات",   desc: "حقق نسبة فوز 80%+",      req: (p: any) => p.total_bets >= 10 && (p.winning_bets / p.total_bets) >= 0.8 },
]

export function ProfilePage() {
  const { username: paramUsername } = useParams<{ username?: string }>()
  const navigate = useNavigate()
  const { player, isAuthenticated, refreshPlayer } = useAuth()
  const { setLoginModalOpen } = useUIStore()

  // Determine if viewing own profile or someone else's
  const isOwnProfile = !paramUsername || (player && paramUsername.toLowerCase() === player.username.toLowerCase())

  // Other Player Data
  const [otherPlayer, setOtherPlayer] = useState<any | null>(null)
  const [loadingOtherPlayer, setLoadingOtherPlayer] = useState(false)

  // Own Profile States
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [savingUsername, setSavingUsername] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [copiedRecovery, setCopiedRecovery] = useState(false)
  const [activeTab, setActiveTab] = useState<"stats" | "formation" | "titles" | "cosmetics" | "achievements" | "privacy">("formation")

  // Titles & Cosmetics Data
  const [allTitles, setAllTitles] = useState<any[]>([])
  const [unlockedTitleIds, setUnlockedTitleIds] = useState<Set<string>>(new Set())
  const [equippedTitle, setEquippedTitle] = useState<any | null>(null)

  const [cosmetics, setCosmetics] = useState<any[]>([])
  const [unlockedCosmeticIds, setUnlockedCosmeticIds] = useState<Set<string>>(new Set())
  const [equippedFrame, setEquippedFrame] = useState<any | null>(null)
  const [equippedBg, setEquippedBg] = useState<any | null>(null)

  // Cards & Battle Deck
  const [playerCards, setPlayerCards] = useState<any[]>([])
  const [favoriteCard, setFavoriteCard] = useState<any | null>(null)
  const [battleDeck, setBattleDeck] = useState<any[]>([])
  const [deckModalOpen, setDeckModalOpen] = useState(false)
  const [savingDeck, setSavingDeck] = useState(false)
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([])
  const [selectedDeckCards, setSelectedDeckCards] = useState<any[]>([])

  // Search & Filter for Favorite Card tab
  const [cardSearchQuery, setCardSearchQuery] = useState("")
  const [cardElementFilter, setCardElementFilter] = useState("ALL")

  // Privacy State
  const [privacy, setPrivacy] = useState<{
    is_public: boolean
    show_history: boolean
    show_collection: boolean
  }>({
    is_public: true,
    show_history: true,
    show_collection: true,
  })

  const [loadingCustomization, setLoadingCustomization] = useState(false)

  // Load other player's public profile if viewing by username
  useEffect(() => {
    if (!isOwnProfile && paramUsername) {
      loadOtherPlayerProfile(paramUsername)
    }
  }, [paramUsername, isOwnProfile])

  // Load own profile data
  useEffect(() => {
    if (isOwnProfile && player) {
      setNewUsername(player.username)
      if (player.privacy_settings) {
        setPrivacy({
          is_public: player.privacy_settings.is_public ?? true,
          show_history: player.privacy_settings.show_history ?? true,
          show_collection: player.privacy_settings.show_collection ?? true,
        })
      }
      loadCustomizationData()
    }
  }, [player?.id, isOwnProfile])

  const loadOtherPlayerProfile = async (targetUsername: string) => {
    setLoadingOtherPlayer(true)
    try {
      const { data, error } = await supabase.rpc('get_player_public_profile', {
        p_username: targetUsername
      })
      if (error) throw error
      if (!data) {
        toast.error('لم يتم العثور على اللاعب')
        setOtherPlayer(null)
      } else {
        setOtherPlayer(data)
        setBattleDeck(data.battle_deck || [])
        setEquippedTitle(data.equipped_title || null)
        setEquippedFrame(data.equipped_frame || null)
        setEquippedBg(data.equipped_bg || null)
        setFavoriteCard(data.favorite_card || null)
      }
    } catch (err: any) {
      console.error('Error loading player profile:', err)
      toast.error('تعذر تحميل الملف الشخصي للاعب')
    } finally {
      setLoadingOtherPlayer(false)
    }
  }

  const mapPlayerCardToItem = (pc: any): SelectableCardItem => {
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
  }

  const availableCards: SelectableCardItem[] = useMemo(() => {
    return playerCards.map(mapPlayerCardToItem)
  }, [playerCards])

  const loadCustomizationData = async () => {
    if (!player?.id) return
    setLoadingCustomization(true)
    try {
      // 1. Fetch titles, cosmetics, cards, and player decks in parallel
      const [titlesRes, myTitlesRes, cosmeticsRes, myCosmeticsRes, cardsRes, deckRes] = await Promise.all([
        supabase.from('titles').select('*').order('created_at', { ascending: false }),
        supabase.from('player_titles').select('title_id').eq('player_id', player.id),
        supabase.from('cosmetics').select('*'),
        supabase.from('player_cosmetics').select('cosmetic_id').eq('player_id', player.id),
        supabase.from('player_cards').select('id, card_id, evolution_level, fusion_level, serial_number, card:cards(*)').eq('player_id', player.id).eq('status', 'owned'),
        supabase.from('player_decks').select('*').eq('player_id', player.id).or('name.eq.تشكيلة القتال 1,is_favorite.eq.true').order('updated_at', { ascending: false }).limit(1),
      ])

      const titles = titlesRes.data || []
      setAllTitles(titles)

      const myTitleSet = new Set((myTitlesRes.data || []).map((t: any) => t.title_id))
      setUnlockedTitleIds(myTitleSet)

      if (player.equipped_title_id) {
        const found = titles.find(t => t.id === player.equipped_title_id)
        if (found && (myTitleSet.has(found.id) || found.rarity === 'Common')) {
          setEquippedTitle(found)
        } else {
          setEquippedTitle(null)
        }
      } else {
        setEquippedTitle(null)
      }

      // Cosmetics
      const cosList = cosmeticsRes.data || []
      setCosmetics(cosList)

      const myCosSet = new Set((myCosmeticsRes.data || []).map((c: any) => c.cosmetic_id))
      cosList.filter(c => !c.is_exclusive).forEach(c => myCosSet.add(c.id))
      setUnlockedCosmeticIds(myCosSet)

      if (player.avatar_frame_id) {
        const found = cosList.find(c => c.id === player.avatar_frame_id)
        if (found) setEquippedFrame(found)
      } else if (cosList.length > 0) {
        const defaultFrame = cosList.find(c => c.type === 'frame' || c.type === 'avatar_frame')
        if (defaultFrame) setEquippedFrame(defaultFrame)
      }

      if (player.profile_bg_id) {
        const found = cosList.find(c => c.id === player.profile_bg_id)
        if (found) setEquippedBg(found)
      } else if (cosList.length > 0) {
        const defaultBg = cosList.find(c => c.type === 'background' || c.type === 'profile_background')
        if (defaultBg) setEquippedBg(defaultBg)
      }

      // Cards
      const rawCards = cardsRes.data || []
      setPlayerCards(rawCards)

      // Favorite Card
      if (player.favorite_card_id) {
        const found = rawCards.find((c: any) => c.card?.id === player.favorite_card_id)
        if (found) setFavoriteCard(found.card)
      } else if (rawCards.length > 0 && rawCards[0].card) {
        setFavoriteCard(rawCards[0].card)
      }

      // Battle Formation Deck 1
      const savedDeck = deckRes.data && deckRes.data.length > 0 ? deckRes.data[0] : null
      if (savedDeck && savedDeck.cards && savedDeck.cards.length > 0) {
        setBattleDeck(savedDeck.cards)
        setSelectedDeckCards(savedDeck.cards)
        setSelectedDeckIds(savedDeck.cards.map((c: any) => c.id || c.card_id))
      } else if (savedDeck && savedDeck.card_ids && savedDeck.card_ids.length > 0) {
        const resolved = rawCards
          .filter((pc: any) => savedDeck.card_ids.includes(pc.id) || savedDeck.card_ids.includes(pc.card_id))
          .map(mapPlayerCardToItem)
        if (resolved.length > 0) {
          setBattleDeck(resolved)
          setSelectedDeckCards(resolved)
          setSelectedDeckIds(resolved.map(c => c.id))
        }
      } else if (player.battle_deck && player.battle_deck.length > 0) {
        const resolved = rawCards
          .filter((pc: any) => player.battle_deck.includes(pc.id) || player.battle_deck.includes(pc.card_id))
          .map(mapPlayerCardToItem)
        if (resolved.length > 0) {
          setBattleDeck(resolved)
          setSelectedDeckCards(resolved)
          setSelectedDeckIds(resolved.map(c => c.id))
        }
      } else if (rawCards.length > 0) {
        // Fallback to initial 5 cards
        const initialDeck = rawCards.slice(0, 5).map(mapPlayerCardToItem)
        setBattleDeck(initialDeck)
        setSelectedDeckCards(initialDeck)
        setSelectedDeckIds(initialDeck.map(c => c.id))
      }
    } catch (err) {
      console.warn('Error loading profile customization:', err)
    } finally {
      setLoadingCustomization(false)
    }
  }

  const handleEquipTitle = async (title: any) => {
    if (!player?.id) {
      toast.error('يرجى تسجيل الدخول أولاً')
      return
    }
    try {
      const { error } = await supabase.rpc('equip_player_title', {
        p_player_id: player.id,
        p_title_id: title ? title.id : null,
      })
      if (error) throw error
      setEquippedTitle(title)
      await refreshPlayer()
      toast.success(title ? `تم تجهيز اللقب: ${title.name_ar} 👑` : 'تم إلغاء تجهيز اللقب')
    } catch (err: any) {
      toast.error('فشل تجهيز اللقب: ' + err.message)
    }
  }

  const handleEquipCosmetic = async (cosmetic: any) => {
    if (!player?.id) {
      toast.error('يرجى تسجيل الدخول أولاً')
      return
    }
    try {
      const { error } = await supabase.rpc('equip_player_cosmetic', {
        p_player_id: player.id,
        p_type: cosmetic ? cosmetic.type : '',
        p_cosmetic_id: cosmetic ? cosmetic.id : null,
      })
      if (error) throw error
      if (cosmetic?.type === 'avatar_frame' || cosmetic?.type === 'frame') setEquippedFrame(cosmetic)
      if (cosmetic?.type === 'profile_background' || cosmetic?.type === 'background') setEquippedBg(cosmetic)
      await refreshPlayer()
      const cosmeticName = cosmetic.name_ar || cosmetic.name || cosmetic.name_en || 'العنصر'
      toast.success(`تم تفعيل: ${cosmeticName} ✨`)
    } catch (err: any) {
      toast.error('فشل تطبيق العنصر: ' + err.message)
    }
  }

  const handleSetFavoriteCard = async (card: any) => {
    if (!player?.id) return
    try {
      const cardId = card ? card.id : null
      const { error } = await supabase.rpc('set_player_favorite_card', {
        p_player_id: player.id,
        p_card_id: cardId,
      })
      if (error) throw error
      setFavoriteCard(card)
      await refreshPlayer()
      toast.success(card ? `تم تعيين ${card.name} كبطاقتك المفضلة ⭐` : 'تمت الإزالة')
    } catch (err: any) {
      toast.error('فشل تعيين البطاقة المفضلة: ' + err.message)
    }
  }

  const handleSaveBattleDeck = async () => {
    if (!player?.id) return
    if (selectedDeckCards.length === 0) {
      toast.error('يرجى اختيار بطاقة واحدة على الأقل في التشكيلة')
      return
    }
    setSavingDeck(true)
    try {
      const cardIds = selectedDeckCards.map(c => c.id)
      const { error } = await supabase.rpc('set_player_battle_deck', {
        p_player_id: player.id,
        p_card_ids: cardIds,
        p_deck_name: 'تشكيلة القتال 1',
      })
      if (error) throw error

      setBattleDeck(selectedDeckCards)
      toast.success('تم حفظ واعتماد تشكيلة القتال 1 بنجاح! ⚔️')
      setDeckModalOpen(false)
      await refreshPlayer()
    } catch (err: any) {
      toast.error('فشل حفظ تشكيلة القتال: ' + err.message)
    } finally {
      setSavingDeck(false)
    }
  }

  const handleRemoveFromBattleDeck = async (cardIdToRemove: string) => {
    if (!player?.id || !isOwnProfile) return
    const newDeck = battleDeck.filter(c => c.id !== cardIdToRemove && c.card_id !== cardIdToRemove)
    if (newDeck.length === 0) {
      toast.error('يجب أن تحتوي التشكيلة على بطاقة واحدة على الأقل')
      return
    }
    try {
      const cardIds = newDeck.map(c => c.id)
      const { error } = await supabase.rpc('set_player_battle_deck', {
        p_player_id: player.id,
        p_card_ids: cardIds,
        p_deck_name: 'تشكيلة القتال 1',
      })
      if (error) throw error
      setBattleDeck(newDeck)
      setSelectedDeckCards(newDeck)
      setSelectedDeckIds(cardIds)
      toast.success('تمت إزالة البطاقة من تشكيلة القتال')
    } catch (err: any) {
      toast.error('فشل تعديل التشكيلة')
    }
  }

  const handleSavePrivacy = async () => {
    if (!player?.id) return
    try {
      const { error } = await supabase
        .from('players')
        .update({ privacy_settings: privacy })
        .eq('id', player.id)
      if (error) throw error
      await refreshPlayer()
      toast.success('تم حفظ إعدادات الخصوصية بنجاح 🔒')
    } catch (err: any) {
      toast.error('فشل حفظ إعدادات الخصوصية')
    }
  }

  const handleSaveUsername = async () => {
    if (!newUsername.trim() || newUsername.trim() === player?.username) { setEditingUsername(false); return }
    if (newUsername.trim().length < 3 || newUsername.trim().length > 20) { toast.error("اسم المستخدم يجب أن يكون بين 3 و20 حرف"); return }
    setSavingUsername(true)
    try {
      const { error } = await supabase.from("players").update({ username: newUsername.trim(), username_normalized: newUsername.trim().toLowerCase() }).eq("id", player.id)
      if (error) { toast.error(error.code === "23505" ? "هذا الاسم مستخدم بالفعل" : "فشل تحديث الاسم") }
      else { await refreshPlayer(); toast.success("تم تحديث اسم المستخدم! ✅"); setEditingUsername(false) }
    } finally { setSavingUsername(false) }
  }

  const handleCopyRecovery = () => {
    if (player?.recovery_code) {
      navigator.clipboard.writeText(player.recovery_code).then(() => { setCopiedRecovery(true); setTimeout(() => setCopiedRecovery(false), 2000); toast.success("تم نسخ كود الاسترداد") })
    }
  }

  // Filtered player cards for Cosmetics -> Favorite Card tab
  const filteredPlayerCards = useMemo(() => {
    return playerCards.filter((pc: any) => {
      const c = pc.card || {}
      const matchesSearch = !cardSearchQuery.trim() || 
        (c.name && c.name.toLowerCase().includes(cardSearchQuery.toLowerCase())) ||
        (c.title && c.title.toLowerCase().includes(cardSearchQuery.toLowerCase()))
      const matchesElement = cardElementFilter === 'ALL' || c.element === cardElementFilter
      return matchesSearch && matchesElement
    })
  }, [playerCards, cardSearchQuery, cardElementFilter])

  // Calculation of stats for target user (own or other player)
  const activeProfile = isOwnProfile ? player : otherPlayer

  if (loadingOtherPlayer) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="جارٍ تحميل الملف الشخصي..." />
      </div>
    )
  }

  if (!isOwnProfile && !otherPlayer) {
    return (
      <div className="min-h-screen pt-24 px-4 flex flex-col items-center justify-center text-center" dir="rtl">
        <div className="glass-card rounded-3xl p-8 max-w-md border border-slate-800 space-y-4">
          <User size={48} className="text-slate-600 mx-auto" />
          <h2 className="text-xl font-black text-white">اللاعب غير موجود</h2>
          <p className="text-sm text-slate-400">لم يتم العثور على اللاعب المحدد بالاسم "{paramUsername}".</p>
          <button onClick={() => navigate('/leaderboard')} className="btn-primary w-full py-2.5 text-xs font-bold">
            العودة إلى لوحة المتصدرين
          </button>
        </div>
      </div>
    )
  }

  if (isOwnProfile && (!isAuthenticated || !player)) {
    return (
      <div className="min-h-screen pt-20 pb-28 md:pb-16 flex items-center justify-center px-4" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center glass-card rounded-3xl p-10 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center mx-auto mb-4">
            <User size={28} className="text-primary-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">سجّل دخولك أولاً</h2>
          <p className="text-slate-400 text-sm mb-6">يجب تسجيل الدخول لعرض وتعديل تشكيلة القتال الخاصة بك</p>
          <button onClick={() => setLoginModalOpen(true)} className="btn-primary w-full">دخول الساحة</button>
        </motion.div>
      </div>
    )
  }

  const displayUser = activeProfile || {}
  const totalBets = Number(displayUser.total_bets || 0)
  const winningBets = Number(displayUser.winning_bets || 0)
  const xp = totalBets * 10 + winningBets * 25
  const level = Math.floor(xp / 500) + 1
  const currentXP = xp % 500
  const nextXP = 500
  const winRate = totalBets > 0 ? Math.round((winningBets / totalBets) * 100) : 0
  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.req(displayUser))

  // Battle Formation stats sums
  const totalDeckAtk = battleDeck.reduce((acc, c) => acc + (Number(c.stats?.atk || c.atk || 1200)), 0)
  const totalDeckDef = battleDeck.reduce((acc, c) => acc + (Number(c.stats?.def || c.def || 1000)), 0)
  const totalDeckHp  = battleDeck.reduce((acc, c) => acc + (Number(c.stats?.hp || c.hp || 3500)), 0)

  return (
    <div className="min-h-screen pt-20 pb-28 md:pb-16 px-3 sm:px-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      
      {/* Top Banner if viewing another player's profile */}
      {!isOwnProfile && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <User size={15} className="text-primary-400" />
            <span>أنت تستعرض الملف الشخصي للاعب: <strong className="text-white">{displayUser.username}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
            >
              لوحة المتصدرين
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="text-xs px-3 py-1.5 rounded-xl bg-primary-500/20 text-primary-300 border border-primary-500/40 font-bold hover:bg-primary-500/30 transition-colors"
            >
              ملفي الشخصي
            </button>
          </div>
        </div>
      )}

      {/* Profile Card Header with Dynamic Background */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-slate-700/60 shadow-2xl backdrop-blur-xl"
        style={{
          background: equippedBg?.preview_style?.background 
            ? equippedBg.preview_style.background 
            : equippedBg?.asset_url 
            ? `linear-gradient(rgba(10, 10, 20, 0.75), rgba(10, 10, 20, 0.9)), url(${equippedBg.asset_url}) center/cover`
            : 'linear-gradient(135deg, rgba(15, 15, 30, 0.95), rgba(10, 10, 20, 0.98))'
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar with Equipped Frame */}
            <div className="relative flex-shrink-0">
              <div 
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-primary-500 via-purple-600 to-pink-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl transition-all"
                style={{
                  border: equippedFrame?.preview_style?.border || '2px solid rgba(99,102,241,0.4)',
                  boxShadow: equippedFrame?.preview_style?.boxShadow || '0 0 15px rgba(99,102,241,0.3)'
                }}
              >
                {displayUser.custom_avatar_url ? (
                  <img src={displayUser.custom_avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (displayUser.username || 'P')[0].toUpperCase()
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg bg-gradient-to-br from-amber-500 to-red-600 border border-white/20">
                {level}
              </div>
            </div>

            {/* Profile Info & Animated Title */}
            <div className="flex-1 text-center sm:text-right w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 justify-center sm:justify-start">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {isOwnProfile && editingUsername ? (
                    <div className="flex items-center gap-2">
                      <input 
                        value={newUsername} 
                        onChange={e => setNewUsername(e.target.value)} 
                        maxLength={20} 
                        className="bg-slate-800 border border-primary-500/50 rounded-xl px-3 py-1.5 text-white text-lg font-black focus:outline-none focus:border-primary-400 w-44" 
                        autoFocus 
                        onKeyDown={e => { if (e.key === "Enter") handleSaveUsername(); if (e.key === "Escape") setEditingUsername(false) }} 
                      />
                      <button onClick={handleSaveUsername} disabled={savingUsername} className="w-8 h-8 rounded-xl bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 hover:bg-green-500/30"><Check size={15} /></button>
                      <button onClick={() => { setEditingUsername(false); setNewUsername(player.username) }} className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 hover:bg-red-500/30"><X size={15} /></button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{displayUser.username}</h1>
                      {isOwnProfile && (
                        <button onClick={() => setEditingUsername(true)} className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"><Edit3 size={13} /></button>
                      )}
                    </>
                  )}
                </div>

                {/* Live Animated Title Badge */}
                {equippedTitle && (
                  <div className="flex justify-center sm:justify-start">
                    <PlayerTitleBadge title={equippedTitle} />
                  </div>
                )}
              </div>

              {/* Clan Badge if any */}
              {displayUser.clan && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-300 mb-2">
                  <span>{displayUser.clan.badge || '🛡️'}</span>
                  <span>[{displayUser.clan.tag || 'CLAN'}] {displayUser.clan.name}</span>
                </div>
              )}

              {/* Level XP Bar */}
              <div className="space-y-1.5 max-w-xs mx-auto sm:mx-0">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-slate-300">المستوى {level}</span>
                  <span className="font-mono">{currentXP} / {nextXP} XP</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/50">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(currentXP / nextXP) * 100}%` }} 
                    transition={{ duration: 1 }} 
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-amber-500" 
                  />
                </div>
              </div>

              {/* Wallet / Action Badge */}
              <div className="mt-4 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                <div className="px-4 py-1.5 rounded-2xl text-base font-black text-primary-300 bg-primary-500/10 border border-primary-500/30 flex items-center gap-1.5">
                  <Zap size={16} className="text-primary-400" />
                  <AnimatedNumber value={displayUser.balance || 0} suffix=" نقطة" />
                </div>

                {!isOwnProfile && (
                  <button
                    onClick={() => navigate(`/challenges?opponent=${encodeURIComponent(displayUser.username)}`)}
                    className="px-4 py-1.5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-rose-500 border border-red-500/50 flex items-center gap-1.5 shadow-glow-amber transition-all"
                  >
                    <Swords size={16} />
                    تحدي اللاعب ⚔️
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Favorite Card Showcase Display */}
          {favoriteCard && (
            <div className="flex items-center gap-3 bg-black/50 border border-amber-500/40 rounded-2xl p-2.5 backdrop-blur-md shadow-2xl flex-shrink-0 self-center md:self-auto hover:border-amber-400 transition-all">
              <div className="w-14 h-20 rounded-xl overflow-hidden relative border border-amber-500/50 shadow-md flex-shrink-0 bg-slate-900">
                <img
                  src={favoriteCard.image_path || favoriteCard.image_url || '/characters/changli.webp'}
                  alt={favoriteCard.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <Star size={11} className="fill-amber-400" /> البطاقة المفضلة
                </div>
                <div className="text-xs font-black text-white max-w-[130px] truncate">{favoriteCard.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{favoriteCard.rarity?.toUpperCase()} • {favoriteCard.element}</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ============================================================== */}
      {/* ⚔️ BATTLE FORMATION SHOWCASE: تشكيلة القتال 1 (5 بطاقات) */}
      {/* ============================================================== */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-5 sm:p-6 border border-red-500/30 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 shadow-2xl space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <Swords size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  تشكيلة القتال 1
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 font-bold">
                    {battleDeck.length} من 5 بطاقات
                  </span>
                </h2>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              {isOwnProfile
                ? 'التشكيلة المعتمدة لخوض التحديات، ساحات PvP، ومواجهات الزعماء. يمكنك اختيار حتى 5 بطاقات من مجموعتك.'
                : `التشكيلة الرسمية المعتمدة للاعب ${displayUser.username} في التحديات والمبارزات.`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Total Power / Stats chips */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-slate-300">
              <span className="text-red-400" title="إجمالي الهجوم">⚔️ {totalDeckAtk.toLocaleString('ar-EG')}</span>
              <span className="text-slate-600">|</span>
              <span className="text-blue-400" title="إجمالي الدفاع">🛡️ {totalDeckDef.toLocaleString('ar-EG')}</span>
              <span className="text-slate-600">|</span>
              <span className="text-green-400" title="إجمالي نقاط الصحة">❤️ {totalDeckHp.toLocaleString('ar-EG')}</span>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => {
                  setSelectedDeckCards([...battleDeck])
                  setSelectedDeckIds(battleDeck.map((c: any) => c.id || c.card_id))
                  setDeckModalOpen(true)
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black flex items-center gap-2 shadow-glow-amber transition-all"
              >
                <Layers size={15} />
                تعديل التشكيلة ({battleDeck.length}/5)
              </button>
            )}
          </div>
        </div>

        {/* 5 Card Slots Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          {[0, 1, 2, 3, 4].map((slotIdx) => {
            const card = battleDeck[slotIdx]
            if (card) {
              const rarity = (card.rarity || 'common').toLowerCase()
              const borderStyle =
                rarity === 'mythic' ? 'border-rose-500 shadow-glow-rose' :
                rarity === 'legendary' ? 'border-amber-400 shadow-glow-amber' :
                rarity === 'epic' ? 'border-purple-500 shadow-glow-purple' :
                'border-slate-700'

              return (
                <div
                  key={card.id || slotIdx}
                  className={`relative rounded-2xl p-2.5 border bg-slate-900/90 text-center transition-all group hover:scale-[1.02] ${borderStyle}`}
                >
                  {/* Slot Number Badge */}
                  <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-lg bg-black/75 border border-white/20 text-white text-[10px] font-black flex items-center justify-center shadow">
                    #{slotIdx + 1}
                  </div>

                  {/* Quick Remove Button for Own Profile */}
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFromBattleDeck(card.id || card.card_id)
                      }}
                      className="absolute top-2 right-2 z-10 w-6 h-6 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      title="إزالة من التشكيلة"
                    >
                      <X size={12} />
                    </button>
                  )}

                  {/* Card Thumbnail */}
                  <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-950 mb-2 relative">
                    <img
                      src={card.image_path || card.image_url || '/characters/changli.webp'}
                      alt={card.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                    {/* Element & Level Badges */}
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-black/80 text-amber-300 border border-amber-500/40">
                      ⭐ Lv.{card.evolution_level || card.level || 1}
                    </div>
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-black/80 text-white">
                      {card.element}
                    </div>
                  </div>

                  <div className="text-xs font-black text-white truncate" title={card.name}>
                    {card.name}
                  </div>
                  <div className="text-[10px] text-amber-400 font-bold uppercase mt-0.5">
                    {card.rarity}
                  </div>

                  {/* Mini Stats Bar */}
                  <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-3 gap-1 text-[10px] font-bold">
                    <div className="text-red-400 bg-red-500/10 rounded py-0.5" title="الهجوم">
                      ⚔️ {card.stats?.atk || card.atk || 1200}
                    </div>
                    <div className="text-blue-400 bg-blue-500/10 rounded py-0.5" title="الدفاع">
                      🛡️ {card.stats?.def || card.def || 1000}
                    </div>
                    <div className="text-green-400 bg-green-500/10 rounded py-0.5" title="الصحة">
                      ❤️ {card.stats?.hp || card.hp || 3500}
                    </div>
                  </div>
                </div>
              )
            }

            // Empty Slot
            return (
              <div
                key={`empty-${slotIdx}`}
                onClick={() => {
                  if (isOwnProfile) {
                    setSelectedDeckCards([...battleDeck])
                    setSelectedDeckIds(battleDeck.map((c: any) => c.id || c.card_id))
                    setDeckModalOpen(true)
                  }
                }}
                className={`rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-4 text-center min-h-[220px] transition-all ${
                  isOwnProfile
                    ? 'hover:border-primary-500/60 hover:bg-slate-900/50 cursor-pointer group'
                    : 'opacity-40'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-800/80 group-hover:bg-primary-500/20 border border-slate-700 group-hover:border-primary-500/40 flex items-center justify-center text-slate-500 group-hover:text-primary-400 mb-2 transition-all">
                  <Plus size={20} className="group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
                  {isOwnProfile ? 'إضافة بطاقة' : 'خانة شاغرة'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  خانة تشكيلة #{slotIdx + 1}
                </span>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: "stats", label: "الإحصائيات", icon: TrendingUp },
          ...(isOwnProfile ? [
            { key: "titles", label: `الألقاب (${unlockedTitleIds.size})`, icon: Crown },
            { key: "cosmetics", label: "المظهر والإطارات", icon: Palette },
            { key: "achievements", label: "الإنجازات", icon: Award },
            { key: "privacy", label: "الخصوصية", icon: ShieldCheck },
          ] : [])
        ].map(({ key, label, icon: Icon }) => (
          <button 
            key={key} 
            onClick={() => setActiveTab(key as any)} 
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === key ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30" : "glass-card text-slate-400 hover:text-white"
            }`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        
        {/* 1. STATS TAB */}
        {activeTab === "stats" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "إجمالي الرهانات", value: displayUser.total_bets, icon: Target, color: "text-blue-400", bg: "bg-blue-500/10" },
                { label: "رهانات فائزة", value: displayUser.winning_bets, icon: Trophy, color: "text-green-400", bg: "bg-green-500/10" },
                { label: "رهانات خاسرة", value: displayUser.losing_bets, icon: X, color: "text-red-400", bg: "bg-red-500/10" },
                { label: "نسبة الفوز", value: winRate, icon: Star, color: "text-amber-400", bg: "bg-amber-500/10", suffix: "%" },
              ].map(({ label, value, icon: Icon, color, bg, suffix }) => (
                <div key={label} className="glass-card rounded-2xl p-4 text-center border border-slate-800">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}><Icon size={18} className={color} /></div>
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className={`text-xl font-black ${color}`}><AnimatedNumber value={value} suffix={suffix || ""} /></p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="glass-card rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center gap-2 mb-2"><TrendingUp size={18} className="text-green-400" /><span className="text-sm font-bold text-white">إجمالي الأرباح</span></div>
                <p className="text-2xl font-black text-green-400"><AnimatedNumber value={displayUser.total_winnings} suffix=" نقطة" /></p>
              </div>
              <div className="glass-card rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center gap-2 mb-2"><Calendar size={18} className="text-primary-400" /><span className="text-sm font-bold text-white">تاريخ الانضمام</span></div>
                <p className="text-sm font-bold text-slate-300">{formatDate(displayUser.created_at)}</p>
              </div>
            </div>

            {/* Recovery Code (Only in own profile) */}
            {isOwnProfile && (
              <div className="glass-card rounded-2xl p-5 border border-amber-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield size={18} className="text-amber-400" />
                    <div>
                      <p className="text-sm font-bold text-white">كود استرداد الحساب السري</p>
                      <p className="text-xs text-slate-400">احفظ هذا الكود في مكان آمن لاستعادة حسابك في حال فقدان الجلسة</p>
                    </div>
                  </div>
                  <button onClick={() => setShowRecovery(!showRecovery)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    {showRecovery ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showRecovery ? "إخفاء" : "إظهار"}
                  </button>
                </div>
                {showRecovery && (
                  <div className="flex items-center gap-2 bg-slate-900/80 rounded-xl p-3 border border-slate-700/50">
                    <code className="text-amber-300 font-mono text-sm flex-1 tracking-wider">{player.recovery_code}</code>
                    <button onClick={handleCopyRecovery} className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 flex items-center gap-1.5 transition-all">
                      {copiedRecovery ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
                      {copiedRecovery ? "تم النسخ!" : "نسخ الكود"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. TITLES TAB (Own Profile) */}
        {isOwnProfile && activeTab === "titles" && (
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Crown className="text-amber-400" size={20} />
                  الألقاب المتاحة والتجهيز
                </h3>
                <p className="text-xs text-slate-400">اختر لقباً ليميز اسمك في ساحات النزال ولوحة المتصدرين</p>
              </div>
              {equippedTitle && (
                <button
                  onClick={() => handleEquipTitle(null)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  إلغاء اللقب الحالي
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {allTitles.map((t) => {
                const isUnlocked = unlockedTitleIds.has(t.id) || t.rarity === 'Common'
                const isEquipped = equippedTitle?.id === t.id
                return (
                  <div
                    key={t.id}
                    className={`rounded-2xl p-4 border transition-all relative ${
                      isEquipped 
                        ? 'border-amber-400/80 bg-amber-500/10 shadow-glow-amber' 
                        : isUnlocked 
                        ? 'border-slate-800 bg-slate-900/50 hover:border-slate-700' 
                        : 'border-slate-800/40 bg-slate-950/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{t.icon || '🎖️'}</span>
                        <div>
                          <p className="text-sm font-black text-white">{t.name_ar}</p>
                          <p className="text-[10px] text-slate-400">{t.name_en}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        t.rarity === 'Mythic' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        t.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        t.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        'bg-slate-700/30 text-slate-400'
                      }`}>
                        {t.rarity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">{t.description || 'لقب مميز في WuWa Betting'}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div className="scale-90 origin-right">
                        <PlayerTitleBadge title={t} />
                      </div>

                      {isUnlocked ? (
                        <button
                          onClick={() => handleEquipTitle(isEquipped ? null : t)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                            isEquipped 
                              ? 'bg-amber-400 text-black font-black' 
                              : 'bg-primary-500/20 text-primary-300 hover:bg-primary-500/30 border border-primary-500/30'
                          }`}
                        >
                          {isEquipped ? 'مجهز حالياً ✓' : 'تجهيز'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          <Lock size={12} /> مقفل
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 3. COSMETICS TAB (Own Profile) */}
        {isOwnProfile && activeTab === "cosmetics" && (
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Palette className="text-primary-400" size={20} />
                تخصيص المظهر والإطارات والخلفيات
              </h3>
              <p className="text-xs text-slate-400">اختر إطار صورتك الرمزية وخلفية بطاقة الملف الشخصي وبطاقتك المفضلة</p>
            </div>

            {/* Avatar Frames */}
            <div className="space-y-3">
              <h4 className="text-sm font-black text-slate-200">إطارات الصورة الرمزية (Avatar Frames)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {cosmetics.filter(c => c.type === 'frame' || c.type === 'avatar_frame').map((f) => {
                  const isUnlocked = unlockedCosmeticIds.has(f.id) || !f.is_exclusive
                  const isEquipped = equippedFrame?.id === f.id
                  return (
                    <div 
                      key={f.id} 
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        isEquipped ? 'bg-primary-500/15 border-primary-500 shadow-glow-blue' : 'glass-card border-slate-800'
                      }`}
                    >
                      <div 
                        className="w-16 h-16 rounded-2xl mx-auto mb-2 flex items-center justify-center text-xl font-bold text-white bg-slate-900 overflow-hidden"
                        style={{
                          border: f.preview_style?.border || '2px solid rgba(255,255,255,0.1)',
                          boxShadow: f.preview_style?.boxShadow || 'none'
                        }}
                      >
                        {player.username[0].toUpperCase()}
                      </div>
                      <div className="text-xs font-bold text-white mb-2 truncate">{f.name_ar || f.name}</div>
                      {isUnlocked ? (
                        <button
                          onClick={() => handleEquipCosmetic(f)}
                          className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isEquipped ? 'bg-primary-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {isEquipped ? 'مفعل ✓' : 'تطبيق الإطار'}
                        </button>
                      ) : (
                        <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1 py-1 font-bold">
                          <Lock size={12} /> مقفل
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Profile Backgrounds */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-sm font-black text-slate-200">خلفيات الملف الشخصي (Profile Backgrounds)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {cosmetics.filter(c => c.type === 'background' || c.type === 'profile_background').map((bg) => {
                  const isUnlocked = unlockedCosmeticIds.has(bg.id) || !bg.is_exclusive
                  const isEquipped = equippedBg?.id === bg.id
                  return (
                    <div 
                      key={bg.id} 
                      className={`p-3 rounded-2xl border transition-all ${
                        isEquipped ? 'bg-purple-500/15 border-purple-500 shadow-glow-purple' : 'glass-card border-slate-800'
                      }`}
                    >
                      <div 
                        className="h-20 w-full rounded-xl mb-2 flex items-center justify-center text-xs font-bold text-white/80 overflow-hidden relative"
                        style={{
                          background: bg.preview_style?.background || (bg.asset_url ? `url(${bg.asset_url}) center/cover` : 'linear-gradient(135deg, #1e1b4b, #312e81)')
                        }}
                      >
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                        <span className="relative z-10">{bg.name_ar || bg.name}</span>
                      </div>
                      {isUnlocked ? (
                        <button
                          onClick={() => handleEquipCosmetic(bg)}
                          className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isEquipped ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {isEquipped ? 'الخلفية الحالية ✓' : 'تطبيق الخلفية'}
                        </button>
                      ) : (
                        <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1 py-1 font-bold">
                          <Lock size={12} /> مقفلة حالياً
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Favorite Card Selector - ALL CARDS WITH SEARCH & ELEMENT FILTERS */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <Star size={18} className="text-amber-400 fill-amber-400" />
                    البطاقة المفضلة المعروضة في ملفك الشخصي ({playerCards.length} بطاقة متاحة)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    اختر أي بطاقة من مجموعتك لتظهر كبطاقة رئيسية مميزة في رأس ملفك الشخصي
                  </p>
                </div>

                {/* Instant Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={cardSearchQuery}
                    onChange={(e) => setCardSearchQuery(e.target.value)}
                    placeholder="ابحث عن أي بطاقة..."
                    className="bg-slate-900 border border-slate-700 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-44"
                  />
                </div>
              </div>

              {/* Element Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['ALL', 'Spectro', 'Fusion', 'Aero', 'Havoc', 'Glacio', 'Electro'].map((elem) => (
                  <button
                    key={elem}
                    type="button"
                    onClick={() => setCardElementFilter(elem)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      cardElementFilter === elem
                        ? 'bg-amber-500 text-black shadow-glow-amber'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {elem === 'ALL' ? 'جميع العناصر' : elem}
                  </button>
                ))}
              </div>

              {/* Cards Grid - Showing ALL matching cards (no slice limitation!) */}
              {filteredPlayerCards.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                  لا توجد بطاقات تطابق معايير البحث الحالية.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredPlayerCards.map((pc) => {
                    const isFav = favoriteCard?.id === pc.card?.id
                    return (
                      <div
                        key={pc.id}
                        onClick={() => handleSetFavoriteCard(isFav ? null : pc.card)}
                        className={`cursor-pointer rounded-2xl p-2.5 border transition-all text-center space-y-1.5 group ${
                          isFav ? 'bg-amber-500/20 border-amber-500 shadow-glow-amber ring-2 ring-amber-400/50' : 'glass-card border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group-hover:scale-105 transition-transform relative">
                          <img
                            src={pc.card?.image_path || pc.card?.image_url || '/characters/changli.webp'}
                            alt={pc.card?.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {pc.evolution_level && pc.evolution_level > 1 && (
                            <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-black shadow">
                              Lv.{pc.evolution_level}
                            </span>
                          )}
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-black/80 text-white">
                            {pc.card?.element}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white truncate">{pc.card?.name}</div>
                        <div className="text-[10px] text-slate-400">{pc.card?.rarity?.toUpperCase()}</div>
                        <div className={`text-[11px] font-bold py-0.5 rounded-lg transition-colors ${
                          isFav ? 'text-amber-300 bg-amber-500/20' : 'text-slate-400 group-hover:text-amber-400'
                        }`}>
                          {isFav ? '⭐ المفضلة حالياً' : 'تعيين كمفضلة'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. ACHIEVEMENTS TAB (Own Profile) */}
        {isOwnProfile && activeTab === "achievements" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-400">تم فتح <span className="text-white font-bold">{unlockedAchievements.length}</span> من {ACHIEVEMENTS.length} إنجاز</p>
              <div className="h-2 w-32 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-purple-500" style={{ width: `${(unlockedAchievements.length / ACHIEVEMENTS.length) * 100}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACHIEVEMENTS.map(achievement => {
                const unlocked = achievement.req(player)
                return (
                  <motion.div key={achievement.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`glass-card rounded-2xl p-4 flex items-center gap-4 transition-all ${unlocked ? "border border-amber-500/30 bg-amber-500/5" : "opacity-50"}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${unlocked ? "bg-amber-500/20" : "bg-slate-800"}`}>{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${unlocked ? "text-white" : "text-slate-500"}`}>{achievement.title}</p>
                      <p className={`text-xs mt-0.5 ${unlocked ? "text-slate-400" : "text-slate-600"}`}>{achievement.desc}</p>
                    </div>
                    {unlocked && <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0"><Check size={12} className="text-green-400" /></div>}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* 5. PRIVACY TAB (Own Profile) */}
        {isOwnProfile && activeTab === "privacy" && (
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-5 max-w-xl">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldCheck className="text-primary-400" size={20} />
                إعدادات خصوصية الحساب
              </h3>
              <p className="text-xs text-slate-400">تحكم في ظهور بياناتك وتشكيلاتك للاعبين الآخرين في الساحات</p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">ملف شخصي عام (Public Profile)</div>
                  <div className="text-[11px] text-slate-400">السماح للاعبين الآخرين بمشاهدة ملفك وتشكيلتك في المتصدرين والكلانات</div>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.is_public}
                  onChange={(e) => setPrivacy({ ...privacy, is_public: e.target.checked })}
                  className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">إظهار سجل ونتائج المعارك</div>
                  <div className="text-[11px] text-slate-400">السماح بعرض سجل النزالات والتحديات للزوار</div>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.show_history}
                  onChange={(e) => setPrivacy({ ...privacy, show_history: e.target.checked })}
                  className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">إظهار بطاقات المجموعة والمقتنيات</div>
                  <div className="text-[11px] text-slate-400">السماح باستعراض بطاقاتك في الملف الشخصي</div>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.show_collection}
                  onChange={(e) => setPrivacy({ ...privacy, show_collection: e.target.checked })}
                  className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                />
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSavePrivacy}
                className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Check size={14} />
                حفظ إعدادات الخصوصية
              </button>
            </div>
          </div>
        )}

      </motion.div>

      {/* ============================================================== */}
      {/* 🛡️ DECK BUILDER MODAL: تعديل تشكيلة القتال 1 (من 1 إلى 5 بطاقات) */}
      {/* ============================================================== */}
      <AnimatePresence>
        {deckModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Swords className="text-red-400" size={20} />
                  <h3 className="text-lg font-black text-white">
                    تعديل تشكيلة القتال 1 (1 إلى 5 بطاقات)
                  </h3>
                </div>
                <button
                  onClick={() => setDeckModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                <CardSelector
                  mode="player"
                  cards={availableCards}
                  selectedCardIds={selectedDeckIds}
                  maxSelect={5}
                  minSelect={1}
                  title="اختر بطاقات تشكيلة القتال 1"
                  subtitle="اختر حتى 5 بطاقات من مجموعتك لاعتمادها في معاركك وتحدياتك"
                  onSelectionChange={(newIds, newItems) => {
                    setSelectedDeckIds(newIds)
                    setSelectedDeckCards(newItems)
                  }}
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 mt-3">
                <div className="text-xs text-slate-400">
                  تم تحديد: <strong className="text-white">{selectedDeckCards.length} من 5 بطاقات</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDeckModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveBattleDeck}
                    disabled={savingDeck || selectedDeckCards.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white text-xs font-black shadow-glow-amber hover:from-red-500 hover:to-rose-500 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingDeck ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                    حفظ واعتماد التشكيلة ({selectedDeckCards.length}) ⚔️
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
