import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Search, Filter, Heart, Tag, ArrowUpDown, 
  Package, ShoppingBag, Eye, Calendar, Award, Shield,
  Coins, Check, ArrowRight, BookOpen, Swords, Zap,
  Flame, Wind, Snowflake, Sun, Moon, ShieldCheck, HeartPulse, Layers
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useUIStore } from '../store'
import { CardRenderer } from '../components/shared/CardRenderer'
import { RARITY_LABELS, ELEMENT_MAP } from '../lib/cardData'
import { CardFusionWorkbench } from '../components/fusion/CardFusionWorkbench'
import { calculateCardStats, getFusionBadge } from '../lib/cardStats'
import toast from 'react-hot-toast'
import type { CardRarity, Card } from '../types/database'

interface PlayerCardItem {
  id: string
  serial_number: number
  status: 'owned' | 'listed' | 'sold'
  obtained_via: string
  obtained_at: string
  is_favorite: boolean
  evolution_level?: number
  fusion_level?: number
  card: {
    id: string
    title: string
    subtitle: string
    name: string
    rarity: CardRarity
    element: string
    image_path: string
    description: string
    card_design_override: any
    is_limited: boolean
    max_supply: number
    current_supply: number
    stats?: any
    skills?: any[]
  }
}

export function CollectionPage() {
  const { player, isAuthenticated } = useAuth()
  const { setLoginModalOpen } = useUIStore()

  // Tabs: My Collection vs Full Encyclopedia vs Card Fusion
  const [activeTab, setActiveTab] = useState<'my_collection' | 'encyclopedia' | 'fusion'>(
    isAuthenticated && player ? 'my_collection' : 'encyclopedia'
  )
  const [selectedFusionCardId, setSelectedFusionCardId] = useState<string | null>(null)

  // My Collection state
  const [cards, setCards] = useState<PlayerCardItem[]>([])
  const [loadingMyCards, setLoadingMyCards] = useState(true)

  // Encyclopedia state (all cards from Supabase)
  const [allCards, setAllCards] = useState<Card[]>([])
  const [loadingAllCards, setLoadingAllCards] = useState(true)

  // Duplicate counts mapping (only active owned cards that can be fused)
  const cardDuplicateCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    cards.forEach(c => {
      if (c.status === 'owned') {
        const cid = c.card?.id
        if (cid) counts[cid] = (counts[cid] || 0) + 1
      }
    })
    return counts
  }, [cards])

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [selectedElement, setSelectedElement] = useState<string>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'owned' | 'unowned'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'serial' | 'rarity'>('newest')

  // Selected card inspect modal (can inspect PlayerCardItem or raw Card)
  const [inspectedCard, setInspectedCard] = useState<PlayerCardItem | null>(null)
  const [inspectedEncyclopediaCard, setInspectedEncyclopediaCard] = useState<Card | null>(null)

  // Sell modal state
  const [sellModalOpen, setSellModalOpen] = useState(false)
  const [sellPrice, setSellPrice] = useState<number>(100)
  const [isListing, setIsListing] = useState(false)

  // Set of card IDs owned by player
  const ownedCardIds = useMemo(() => {
    return new Set(cards.map(c => c.card?.id).filter(Boolean))
  }, [cards])

  useEffect(() => {
    loadEncyclopedia()
    if (player?.id) {
      loadCollection()
    } else {
      setLoadingMyCards(false)
    }
  }, [player?.id])

  const loadEncyclopedia = async () => {
    setLoadingAllCards(true)
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('is_published', true)
        .order('rarity', { ascending: false })
        .order('name', { ascending: true })

      if (error) throw error
      if (data) {
        setAllCards(data as Card[])
      }
    } catch (err: any) {
      console.error('Failed to load cards encyclopedia:', err)
      toast.error('فشل تحميل موسوعة البطاقات')
    } finally {
      setLoadingAllCards(false)
    }
  }

  const loadCollection = async () => {
    if (!player?.id) return
    setLoadingMyCards(true)
    try {
      const { data, error } = await supabase
        .from('player_cards')
        .select(`
          id,
          serial_number,
          status,
          obtained_via,
          obtained_at,
          is_favorite,
          evolution_level,
          fusion_level,
          card:cards(*)
        `)
        .eq('player_id', player.id)
        .in('status', ['owned', 'listed'])
        .order('obtained_at', { ascending: false })

      if (error) throw error
      if (data) {
        setCards(data as any)
      }
    } catch (err: any) {
      toast.error('فشل تحميل مجموعة البطاقات')
    } finally {
      setLoadingMyCards(false)
    }
  }

  const toggleFavorite = async (e: React.MouseEvent, item: PlayerCardItem) => {
    e.stopPropagation()
    const nextState = !item.is_favorite
    setCards(prev => prev.map(c => c.id === item.id ? { ...c, is_favorite: nextState } : c))
    if (inspectedCard?.id === item.id) {
      setInspectedCard(prev => prev ? { ...prev, is_favorite: nextState } : null)
    }

    try {
      await supabase
        .from('player_cards')
        .update({ is_favorite: nextState })
        .eq('id', item.id)
    } catch (err) {
      toast.error('حدث خطأ أثناء تحديث المفضلة')
    }
  }

  const handleListForSale = async () => {
    if (!inspectedCard || !player?.id) {
      toast.error('يجب تسجيل الدخول أولاً')
      return
    }
    const priceNum = Number(sellPrice)
    if (!priceNum || priceNum <= 0) {
      toast.error('يرجى إدخال سعر صالح أكبر من 0')
      return
    }

    setIsListing(true)
    try {
      const { data: result, error } = await supabase.rpc('list_card_for_sale', {
        p_player_id: player.id,
        p_player_card_id: inspectedCard.id,
        p_price: priceNum,
      })

      if (error) throw new Error(error.message)
      if (!result?.success) throw new Error(result?.message || 'فشل عرض البطاقة')

      toast.success('تم عرض البطاقة للبيع في السوق بنجاح! 🎉')
      setSellModalOpen(false)
      setInspectedCard(prev => prev ? { ...prev, status: 'listed' } : null)
      setCards(prev => prev.map(c => c.id === inspectedCard.id ? { ...c, status: 'listed' } : c))
      loadCollection()
    } catch (err: any) {
      console.error('Market listing error:', err)
      toast.error(err.message || 'حدث خطأ في السوق')
    } finally {
      setIsListing(false)
    }
  }

  // Filter & sort logic for My Collection
  const filteredMyCards = cards.filter(item => {
    if (!item.card) return false
    const matchSearch = (item.card.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.card.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchRarity = selectedRarity === 'all' || item.card.rarity === selectedRarity
    const matchElement = selectedElement === 'all' || item.card.element === selectedElement
    const matchFav = !favoritesOnly || item.is_favorite
    return matchSearch && matchRarity && matchElement && matchFav
  }).sort((a, b) => {
    if (sortBy === 'serial') return a.serial_number - b.serial_number
    if (sortBy === 'newest') return new Date(b.obtained_at).getTime() - new Date(a.obtained_at).getTime()
    if (sortBy === 'rarity') {
      const weight: Record<string, number> = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 }
      return (weight[b.card.rarity] || 0) - (weight[a.card.rarity] || 0)
    }
    return 0
  })

  // Filter & sort logic for Encyclopedia
  const filteredEncyclopediaCards = allCards.filter(card => {
    const matchSearch = (card.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (card.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchRarity = selectedRarity === 'all' || card.rarity === selectedRarity
    const matchElement = selectedElement === 'all' || card.element === selectedElement
    
    let matchOwnership = true
    if (ownershipFilter === 'owned') {
      matchOwnership = ownedCardIds.has(card.id)
    } else if (ownershipFilter === 'unowned') {
      matchOwnership = !ownedCardIds.has(card.id)
    }

    return matchSearch && matchRarity && matchElement && matchOwnership
  }).sort((a, b) => {
    if (sortBy === 'rarity') {
      const weight: Record<string, number> = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 }
      return (weight[b.rarity] || 0) - (weight[a.rarity] || 0)
    }
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    return a.name.localeCompare(b.name, 'ar')
  })

  // Encyclopedia Statistics
  const totalEncyclopediaCards = allCards.length
  const mythicCount = allCards.filter(c => c.rarity === 'mythic').length
  const legendaryCount = allCards.filter(c => c.rarity === 'legendary').length
  const epicCount = allCards.filter(c => c.rarity === 'epic').length
  const rareCount = allCards.filter(c => c.rarity === 'rare').length

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-28 md:pb-20 px-3 sm:px-4 max-w-7xl mx-auto">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold mb-2">
            <Award size={14} />
            خزينة وموسوعة بطاقات WuWa Resonance
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            {activeTab === 'my_collection' ? 'مجموعة بطاقاتي' : 'موسوعة البطاقات الكبرى'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {activeTab === 'my_collection' 
              ? 'جميع بطاقات الـ Resonators التي حصلت عليها مع أرقام النسخ وحالتها.'
              : `استعرض جميع الـ ${totalEncyclopediaCards} بطاقة المتاحة في الساحة مع إحصائيات القتال وتأثيرات المهارات.`}
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/boxes"
            className="btn-primary py-2.5 px-4 text-sm font-bold flex items-center gap-2"
          >
            <Package size={16} /> فتح صناديق الحظ
          </Link>
          <Link
            to="/market"
            className="btn-secondary py-2.5 px-4 text-sm font-bold flex items-center gap-2"
          >
            <ShoppingBag size={16} /> سوق البطاقات
          </Link>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 mb-8 max-w-xl">
        <button
          onClick={() => {
            if (!isAuthenticated || !player) {
              setLoginModalOpen(true)
            } else {
              setActiveTab('my_collection')
            }
          }}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'my_collection'
              ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield size={16} />
          خزانتي ({cards.length})
        </button>

        <button
          onClick={() => setActiveTab('encyclopedia')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'encyclopedia'
              ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen size={16} />
          الموسوعة ({totalEncyclopediaCards})
        </button>

        <button
          onClick={() => {
            if (!isAuthenticated || !player) {
              setLoginModalOpen(true)
            } else {
              setActiveTab('fusion')
            }
          }}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'fusion'
              ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-lg shadow-amber-500/25'
              : 'text-amber-400/90 hover:text-amber-300'
          }`}
        >
          <Layers size={16} />
          دمج البطاقات ✦
        </button>
      </div>

      {/* Guest notice for My Collection */}
      {activeTab === 'my_collection' && (!isAuthenticated || !player) && (
        <div className="glass-card rounded-3xl p-8 text-center max-w-md mx-auto space-y-4 border border-primary-500/30 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto text-primary-400">
            <Sparkles size={28} />
          </div>
          <h3 className="text-xl font-bold text-white">سجّل الدخول لعرض خزينتك الخاصة</h3>
          <p className="text-slate-400 text-sm">
            تحتاج لتسجيل الدخول لاستعراض البطاقات التي حصلت عليها من الصناديق وإدارتها وعرضها للبيع.
          </p>
          <button
            onClick={() => setLoginModalOpen(true)}
            className="btn-primary py-2.5 px-6 font-bold"
          >
            تسجيل الدخول الآن
          </button>
        </div>
      )}

      {/* Stats Counter Bar (Encyclopedia Mode) */}
      {activeTab === 'encyclopedia' && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-8">
          <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-slate-700/60 flex items-center gap-3">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 flex-shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400">إجمالي البطاقات</p>
              <p className="text-lg sm:text-xl font-black text-white">{totalEncyclopediaCards}</p>
            </div>
          </div>

          <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-pink-500/20 flex items-center gap-3">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 flex-shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-[11px] text-pink-300 font-semibold">أسطورية جدًا (5★)</p>
              <p className="text-lg sm:text-xl font-black text-pink-400">{mythicCount}</p>
            </div>
          </div>

          <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-amber-500/20 flex items-center gap-3">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Award size={20} />
            </div>
            <div>
              <p className="text-[11px] text-amber-300 font-semibold">قوية جدًا (4★)</p>
              <p className="text-lg sm:text-xl font-black text-amber-400">{legendaryCount}</p>
            </div>
          </div>

          <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-purple-500/20 flex items-center gap-3">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-[11px] text-purple-300 font-semibold">قوية (3★)</p>
              <p className="text-lg sm:text-xl font-black text-purple-400">{epicCount}</p>
            </div>
          </div>

          <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-sky-500/20 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-[11px] text-sky-300 font-semibold">متوسطة (2★)</p>
              <p className="text-lg sm:text-xl font-black text-sky-400">{rareCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Counter Bar (My Collection Mode) */}
      {activeTab === 'my_collection' && isAuthenticated && player && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4 rounded-2xl border border-slate-700/60 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400">إجمالي البطاقات</p>
              <p className="text-xl font-black text-white">{cards.length}</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-700/60 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400">أسطورية وخرافية</p>
              <p className="text-xl font-black text-amber-400">
                {cards.filter(c => c.card && (c.card.rarity === 'legendary' || c.card.rarity === 'mythic')).length}
              </p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-700/60 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Tag size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400">معروضة للبيع</p>
              <p className="text-xl font-black text-purple-400">
                {cards.filter(c => c.status === 'listed').length}
              </p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-700/60 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Heart size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400">المفضلة</p>
              <p className="text-xl font-black text-rose-400">
                {cards.filter(c => c.is_favorite).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-700/60 mb-8 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="ابحث باسم الـ Resonator أو البطاقة..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Rarity filter */}
          <select
            value={selectedRarity}
            onChange={e => setSelectedRarity(e.target.value)}
            className="w-full md:w-auto bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-primary-500"
          >
            <option value="all">كل الفئات الأربع (All)</option>
            <option value="mythic">أسطورية جدًا (Mythic 5★)</option>
            <option value="legendary">قوية جدًا (Legendary 4★)</option>
            <option value="epic">قوية (Epic 3★)</option>
            <option value="rare">متوسطة (Rare 2★)</option>
            <option value="common">شائع (Common 1★)</option>
          </select>

          {/* Element filter */}
          <select
            value={selectedElement}
            onChange={e => setSelectedElement(e.target.value)}
            className="w-full md:w-auto bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-primary-500"
          >
            <option value="all">كل العناصر (Elements)</option>
            {Object.keys(ELEMENT_MAP).map(elem => (
              <option key={elem} value={elem}>{ELEMENT_MAP[elem].label}</option>
            ))}
          </select>

          {/* Ownership filter (Encyclopedia only) */}
          {activeTab === 'encyclopedia' && isAuthenticated && player && (
            <select
              value={ownershipFilter}
              onChange={e => setOwnershipFilter(e.target.value as any)}
              className="w-full md:w-auto bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-primary-500"
            >
              <option value="all">كل البطاقات</option>
              <option value="owned">المملوكة فقط ({ownedCardIds.size})</option>
              <option value="unowned">غير المملوكة ({totalEncyclopediaCards - ownedCardIds.size})</option>
            </select>
          )}

          {/* Sort order */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="w-full md:w-auto bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-primary-500"
          >
            <option value="rarity">الرتبة الأندر</option>
            <option value="newest">الأحدث وصولاً</option>
            {activeTab === 'my_collection' && <option value="serial">رقم النسخة (Serial #)</option>}
          </select>

          {/* Favorite toggle button (My Collection only) */}
          {activeTab === 'my_collection' && (
            <button
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`w-full md:w-auto px-4 py-2.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                favoritesOnly 
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' 
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-white'
              }`}
            >
              <Heart size={16} className={favoritesOnly ? 'fill-rose-400' : ''} />
              المفضلة
            </button>
          )}
        </div>
      </div>

      {/* ======================= TAB 1: MY COLLECTION ======================= */}
      {activeTab === 'my_collection' && isAuthenticated && player && (
        <>
          {loadingMyCards ? (
            <div className="text-center py-24 text-slate-400">جاري تحميل مجموعتك...</div>
          ) : filteredMyCards.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 border border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Package size={30} />
              </div>
              <h3 className="text-xl font-bold text-white">لم يتم العثور على بطاقات</h3>
              <p className="text-slate-400 text-sm">
                {cards.length === 0 
                  ? 'مجموعتك فارغة حالياً. تصفح موسوعة البطاقات أو افتح أول صندوق لك في المتجر للحصول على بطاقتك الأولى!' 
                  : 'لا توجد بطاقات تطابق معايير البحث والفلترة المختارة.'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('encyclopedia')}
                  className="btn-secondary py-2.5 px-5 text-sm font-bold inline-flex items-center gap-2"
                >
                  <BookOpen size={16} /> استعراض الموسوعة
                </button>
                <Link to="/boxes" className="btn-primary py-2.5 px-5 text-sm font-bold inline-flex items-center gap-2">
                  <Package size={16} /> الذهاب إلى متجر الصناديق
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-6">
              {filteredMyCards.map((item) => {
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -8 }}
                    onClick={() => setInspectedCard(item)}
                    className="cursor-pointer relative group flex flex-col items-center"
                  >
                    <div className="relative">
                      <CardRenderer
                        card={{
                          id: item.card.id,
                          title: item.card.title,
                          subtitle: item.card.subtitle,
                          name: item.card.name,
                          rarity: item.card.rarity,
                          element: item.card.element,
                          image_path: item.card.image_path,
                          card_design_override: item.card.card_design_override,
                          stats: calculateCardStats(
                            item.card.stats,
                            item.evolution_level || 1,
                            item.fusion_level || 0
                          ),
                          skills: item.card.skills,
                        }}
                        serialNumber={item.serial_number}
                        size="sm"
                        interactive={true}
                      />

                      {/* Favorite button overlay */}
                      <button
                        onClick={(e) => toggleFavorite(e, item)}
                        className="absolute top-2 left-2 z-30 p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:scale-110 transition-transform"
                      >
                        <Heart
                          size={14}
                          className={item.is_favorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}
                        />
                      </button>

                      {/* Status badge */}
                      {item.status === 'listed' && (
                        <div className="absolute top-2 right-2 z-30 px-2 py-0.5 rounded-md bg-purple-600/90 text-white text-[10px] font-black tracking-wider shadow-md">
                          معروضة
                        </div>
                      )}

                      {/* Fusion Level Badge */}
                      {Boolean(item.fusion_level && item.fusion_level > 0) && (
                        <div className="absolute bottom-2 right-2 z-30 px-2 py-0.5 rounded-md bg-amber-500/95 text-slate-950 text-[10px] font-black tracking-wider shadow-md">
                          ✦ Lv.{item.fusion_level}
                        </div>
                      )}

                      {/* Duplicate Count Badge */}
                      {Boolean(cardDuplicateCounts[item.card.id] > 1) && (
                        <div className="absolute bottom-2 left-2 z-30 px-1.5 py-0.5 rounded-md bg-purple-600/90 text-white text-[9px] font-bold shadow-md">
                          +{cardDuplicateCounts[item.card.id] - 1} مكرر
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-center w-full px-1">
                      <p className="text-xs font-bold text-white truncate max-w-[150px] mx-auto" dir="auto" title={item.card.title}>{item.card.title}</p>
                      <p className="text-[10px] text-slate-500">#{item.serial_number.toString().padStart(3, '0')}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ======================= TAB 2: GRAND CARD ENCYCLOPEDIA ======================= */}
      {activeTab === 'encyclopedia' && (
        <>
          {loadingAllCards ? (
            <div className="text-center py-24 text-slate-400">جاري تحميل موسوعة الـ 100 بطاقة من Supabase...</div>
          ) : filteredEncyclopediaCards.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 border border-slate-800">
              <BookOpen size={36} className="text-slate-500 mx-auto" />
              <h3 className="text-xl font-bold text-white">لا توجد بطاقات مطابقة للبحث</h3>
              <p className="text-slate-400 text-sm">جرب تغيير معايير البحث أو اختيار رتبة وعنصر مختلفين.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-6">
              {filteredEncyclopediaCards.map((card) => {
                const isOwned = ownedCardIds.has(card.id)

                return (
                  <motion.div
                    key={card.id}
                    whileHover={{ y: -8 }}
                    onClick={() => setInspectedEncyclopediaCard(card)}
                    className="cursor-pointer relative group flex flex-col items-center"
                  >
                    <div className="relative">
                      <CardRenderer
                        card={{
                          id: card.id,
                          title: card.title,
                          subtitle: card.subtitle,
                          name: card.name,
                          rarity: card.rarity,
                          element: card.element,
                          image_path: card.image_path,
                          card_design_override: card.card_design_override,
                          is_limited: card.is_limited,
                          max_supply: card.max_supply,
                          stats: card.stats,
                          skills: card.skills,
                        }}
                        size="sm"
                        interactive={true}
                      />

                      {/* Ownership Badge */}
                      {isAuthenticated && player && (
                        <div className="absolute top-2 left-2 z-30">
                          {isOwned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-black tracking-wider shadow-md backdrop-blur-sm">
                              <Check size={10} /> مقتناة
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/80 text-slate-400 text-[10px] font-medium border border-slate-700/60 backdrop-blur-sm">
                              في الصناديق
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-center w-full px-2">
                      <p className="text-xs font-bold text-white truncate" dir="auto" title={card.name}>{card.name}</p>
                      <p className="text-[10px] text-slate-400 truncate" dir="auto" title={card.title || card.subtitle}>{card.title || card.subtitle}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ======================= TAB 3: CARD FUSION ======================= */}
      {activeTab === 'fusion' && isAuthenticated && player && (
        <div className="mt-2">
          <CardFusionWorkbench
            initialCardId={selectedFusionCardId}
            onFusionComplete={() => {
              loadCollection()
            }}
          />
        </div>
      )}

      {/* ======================= MODAL: MY CARD INSPECTION ======================= */}
      <AnimatePresence>
        {inspectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
            onClick={() => setInspectedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-3xl w-full p-4 sm:p-6 md:p-8 rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col md:flex-row items-center gap-5 md:gap-8 max-h-[92vh] overflow-y-auto my-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex-shrink-0">
                <CardRenderer
                  card={{
                    id: inspectedCard.card.id,
                    title: inspectedCard.card.title,
                    subtitle: inspectedCard.card.subtitle,
                    name: inspectedCard.card.name,
                    rarity: inspectedCard.card.rarity,
                    element: inspectedCard.card.element,
                    image_path: inspectedCard.card.image_path,
                    card_design_override: inspectedCard.card.card_design_override,
                    stats: calculateCardStats(
                      inspectedCard.card.stats,
                      inspectedCard.evolution_level || 1,
                      inspectedCard.fusion_level || 0
                    ),
                    skills: inspectedCard.card.skills,
                  }}
                  serialNumber={inspectedCard.serial_number}
                  size="md"
                  interactive={true}
                />
              </div>

              <div className="flex-1 space-y-4 sm:space-y-5 text-right w-full">
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-xs font-black px-2.5 py-1 rounded-full uppercase"
                      style={{
                        background: `${RARITY_LABELS[inspectedCard.card.rarity]?.color}25`,
                        color: RARITY_LABELS[inspectedCard.card.rarity]?.color
                      }}
                    >
                      {RARITY_LABELS[inspectedCard.card.rarity]?.label}
                    </span>
                    <button
                      onClick={() => setInspectedCard(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                  <h3 className="text-2xl font-black text-white mt-2">{inspectedCard.card.title || inspectedCard.card.name}</h3>
                  <p className="text-xs text-primary-400 font-medium">{inspectedCard.card.subtitle}</p>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {inspectedCard.card.description || 'بطاقة Resonator فريدة من عالم Wuthering Waves، متوازنة للقتال والمبارزات.'}
                </p>

                {/* Details list */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block">رقم النسخة:</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">#{inspectedCard.serial_number.toString().padStart(4, '0')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">رتبة الدمج (Fusion):</span>
                    <span className="font-black text-amber-400">
                      {inspectedCard.fusion_level && inspectedCard.fusion_level > 0 
                        ? `✦ Lv.${inspectedCard.fusion_level}` 
                        : 'Base Resonance (0)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">مستوى الترقية:</span>
                    <span className="font-bold text-emerald-400">Lv.{inspectedCard.evolution_level || 1}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">طريقة الحصول:</span>
                    <span className="font-bold text-slate-300">
                      {inspectedCard.obtained_via === 'box_open' ? 'صندوق حظ' : 'شراء من السوق'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">تاريخ الحصول:</span>
                    <span className="font-bold text-slate-300">
                      {new Date(inspectedCard.obtained_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">النسخ المملوكة:</span>
                    <span className="font-bold text-primary-400">
                      {cardDuplicateCounts[inspectedCard.card.id] || 1} نسخ
                    </span>
                  </div>
                </div>

                {/* Quick Fusion Action if duplicates exist */}
                {cardDuplicateCounts[inspectedCard.card.id] > 1 && inspectedCard.status === 'owned' && (
                  <button
                    onClick={() => {
                      setSelectedFusionCardId(inspectedCard.card.id)
                      setInspectedCard(null)
                      setActiveTab('fusion')
                    }}
                    className="w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 text-white shadow-glow-amber hover:opacity-95 flex items-center justify-center gap-2 transition-all"
                  >
                    <Layers size={16} />
                    دمج النسخ المكررة لهذه البطاقة ({cardDuplicateCounts[inspectedCard.card.id]} نسخ متوفرة) ✦
                  </button>
                )}

                {/* Action buttons / Selling panel */}
                <div className="pt-2">
                  {inspectedCard.status === 'owned' ? (
                    <>
                      {!sellModalOpen ? (
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => setSellModalOpen(true)}
                            className="btn-primary flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
                          >
                            <Tag size={16} /> عرض البطاقة للبيع في السوق
                          </button>

                          <button
                            onClick={(e) => toggleFavorite(e, inspectedCard)}
                            className="btn-secondary py-3 px-4 rounded-xl flex items-center gap-1.5 text-sm font-bold"
                            title="إضافة للمفضلة"
                          >
                            <Heart
                              size={16}
                              className={inspectedCard.is_favorite ? 'fill-rose-500 text-rose-500' : ''}
                            />
                          </button>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-900/90 border border-primary-500/40 p-4 rounded-2xl space-y-3 shadow-xl"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                              <Coins size={14} /> حدد سعر البيع بالنقاط:
                            </span>
                            <button
                              onClick={() => setSellModalOpen(false)}
                              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800"
                            >
                              إلغاء
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {[50, 100, 200, 350, 500, 1000].map(p => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setSellPrice(p)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  sellPrice === p
                                    ? 'bg-primary-500 text-white shadow'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={sellPrice}
                              onChange={e => setSellPrice(Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold text-base focus:outline-none focus:border-primary-500 text-center"
                            />
                            <button
                              onClick={handleListForSale}
                              disabled={isListing}
                              className="btn-primary py-2.5 px-5 text-xs font-bold flex-shrink-0 flex items-center gap-1.5"
                            >
                              <Check size={14} />
                              {isListing ? 'جاري العرض...' : 'تأكيد العرض'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-full py-2.5 px-4 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
                        <Tag size={15} /> هذه البطاقة معروضة للبيع في السوق حالياً
                      </div>
                      <Link
                        to="/market"
                        className="btn-secondary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 text-slate-300 hover:text-white"
                      >
                        الذهاب إلى السوق لإدارة عروضك <ArrowRight size={13} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================= MODAL: ENCYCLOPEDIA CARD INSPECTION ======================= */}
      <AnimatePresence>
        {inspectedEncyclopediaCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
            onClick={() => setInspectedEncyclopediaCard(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-4xl w-full p-4 sm:p-6 md:p-8 rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col md:flex-row items-center gap-6 md:gap-8 max-h-[92vh] overflow-y-auto my-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Card visual 3D */}
              <div className="flex-shrink-0">
                <CardRenderer
                  card={inspectedEncyclopediaCard}
                  size="md"
                  interactive={true}
                />
              </div>

              {/* Full Combat Stats & Skill Profile */}
              <div className="flex-1 space-y-4 text-right w-full">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-xs font-black px-2.5 py-1 rounded-full uppercase"
                        style={{
                          background: `${RARITY_LABELS[inspectedEncyclopediaCard.rarity]?.color}25`,
                          color: RARITY_LABELS[inspectedEncyclopediaCard.rarity]?.color
                        }}
                      >
                        {RARITY_LABELS[inspectedEncyclopediaCard.rarity]?.label}
                      </span>
                      {ownedCardIds.has(inspectedEncyclopediaCard.id) && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                          ✓ في مجموعتك
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setInspectedEncyclopediaCard(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <h3 className="text-2xl font-black text-white mt-2">{inspectedEncyclopediaCard.name}</h3>
                  <p className="text-xs text-primary-400 font-medium">{inspectedEncyclopediaCard.title || inspectedEncyclopediaCard.subtitle}</p>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {inspectedEncyclopediaCard.description || 'بطاقة ريزوناتور متوازنة ضمن النظام القتالي في WuWa Betting.'}
                </p>

                {/* Combat Stats Grid */}
                {inspectedEncyclopediaCard.stats && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Swords size={14} className="text-primary-400" />
                      إحصائيات القتال الرسمية (Combat Stats):
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-xl text-center">
                        <span className="text-red-400 font-bold block">الهجوم (ATK)</span>
                        <span className="text-white font-mono font-black text-sm">{inspectedEncyclopediaCard.stats.atk || 0}</span>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-center">
                        <span className="text-emerald-400 font-bold block">الصحة (HP)</span>
                        <span className="text-white font-mono font-black text-sm">{inspectedEncyclopediaCard.stats.hp || 0}</span>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-xl text-center">
                        <span className="text-blue-400 font-bold block">الدفاع (DEF)</span>
                        <span className="text-white font-mono font-black text-sm">{inspectedEncyclopediaCard.stats.def || 0}</span>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl text-center">
                        <span className="text-amber-400 font-bold block">السرعة (SPEED)</span>
                        <span className="text-white font-mono font-black text-sm">{inspectedEncyclopediaCard.stats.speed || 100}</span>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/20 p-2 rounded-xl text-center">
                        <span className="text-purple-400 font-bold block">الحرجة (CRIT)</span>
                        <span className="text-white font-mono font-black text-sm">{inspectedEncyclopediaCard.stats.crit_rate || 5}%</span>
                      </div>
                      <div className="bg-cyan-500/10 border border-cyan-500/20 p-2 rounded-xl text-center">
                        <span className="text-cyan-400 font-bold block">الدرع (SHIELD)</span>
                        <span className="text-white font-mono font-black text-sm">{inspectedEncyclopediaCard.stats.shield || 0}</span>
                      </div>
                      <div className="bg-teal-500/10 border border-teal-500/20 p-2 rounded-xl text-center">
                        <span className="text-teal-400 font-bold block">الشفاء (HEAL)</span>
                        <span className="text-white font-mono font-black text-sm">{inspectedEncyclopediaCard.stats.heal || 0}</span>
                      </div>
                      <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl text-center">
                        <span className="text-rose-400 font-bold block">امتصاص الحياة</span>
                        <span className="text-white font-mono font-black text-sm">{inspectedEncyclopediaCard.stats.lifesteal || 0}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills Section */}
                {inspectedEncyclopediaCard.skills && inspectedEncyclopediaCard.skills.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-400" />
                      المهارات القتالية الخاصة:
                    </h4>
                    <div className="space-y-1.5">
                      {inspectedEncyclopediaCard.skills.map((skill: any, idx: number) => (
                        <div key={idx} className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              ⚡ {skill.name}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                              <span>طاقة: {skill.energy_cost || 0}</span>
                              <span>تهدئة: {skill.cooldown || 1} جولة</span>
                            </div>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{skill.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pull in Boxes CTA */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    {inspectedEncyclopediaCard.is_limited ? (
                      <span className="text-amber-400 font-bold">نسخة محدودة الإصدار ({inspectedEncyclopediaCard.max_supply} بطاقة فقط)</span>
                    ) : (
                      <span>متاحة في صناديق الحظ بالمتجر</span>
                    )}
                  </div>
                  <Link
                    to="/boxes"
                    onClick={() => setInspectedEncyclopediaCard(null)}
                    className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Package size={14} /> سحب من الصناديق
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
