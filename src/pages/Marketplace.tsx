import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingBag, Sparkles, Search, Filter, Coins, 
  Tag, ArrowUpDown, User, X, Check, ArrowRight, ShieldCheck
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useUIStore } from '../store'
import { CardRenderer } from '../components/shared/CardRenderer'
import { RARITY_LABELS } from '../lib/cardData'
import { playOpeningChime } from '../lib/audio'
import toast from 'react-hot-toast'
import type { CardRarity } from '../types/database'

interface MarketListingItem {
  id: string
  seller_id: string
  price: number
  status: 'active' | 'sold' | 'cancelled'
  created_at: string
  seller: {
    id: string
    username: string
  }
  player_card: {
    id: string
    serial_number: number
  }
  card: {
    id: string
    title: string
    subtitle: string
    name: string
    rarity: CardRarity
    element: string
    image_path: string
    card_design_override: any
  }
}

export function MarketplacePage() {
  const { player, isAuthenticated, refreshPlayer } = useAuth()
  const { setLoginModalOpen } = useUIStore()

  const [listings, setListings] = useState<MarketListingItem[]>([])
  const [loading, setLoading] = useState(true)

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'all' | 'my_listings'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest'>('newest')

  // Buy confirmation modal
  const [selectedListing, setSelectedListing] = useState<MarketListingItem | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)

  useEffect(() => {
    loadListings()
  }, [])

  const loadListings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('market_listings')
        .select(`
          id,
          seller_id,
          price,
          status,
          created_at,
          seller:players!market_listings_seller_id_fkey(id, username),
          player_card:player_cards!market_listings_player_card_id_fkey(id, serial_number),
          card:cards!market_listings_card_id_fkey(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setListings(data as any)
      }
    } catch (err: any) {
      toast.error('فشل تحميل معروضات السوق')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyCard = async () => {
    if (!selectedListing || !player?.id) return

    if (player.balance < selectedListing.price) {
      toast.error(`رصيدك لا يكفي! تحتاج ${selectedListing.price}$، ورصيدك الحالي ${player.balance}$`)
      return
    }

    setIsPurchasing(true)
    try {
      const { data: result, error } = await supabase.rpc('buy_market_card', {
        p_buyer_id: player.id,
        p_listing_id: selectedListing.id,
      })

      if (error) throw new Error(error.message)
      if (!result?.success) throw new Error(result?.message || 'فشلت عملية الشراء')

      toast.success('تم شراء البطاقة بنجاح وإضافتها إلى مجموعتك! 🎊')
      playOpeningChime(selectedListing.card.rarity)
      setSelectedListing(null)
      refreshPlayer()
      loadListings()
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ في الشراء')
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleCancelListing = async (listingId: string) => {
    if (!player?.id) return
    try {
      const { data: result, error } = await supabase.rpc('cancel_market_listing', {
        p_player_id: player.id,
        p_listing_id: listingId,
      })

      if (error) throw new Error(error.message)
      if (!result?.success) throw new Error(result?.message || 'فشل إلغاء العرض')

      toast.success('تم إلغاء العرض واسترجاع البطاقة إلى مجموعتك.')
      loadListings()
    } catch (err: any) {
      toast.error(err.message || 'فشل إلغاء العرض')
    }
  }

  // Filter listings
  const filteredListings = listings.filter(item => {
    if (activeTab === 'my_listings' && item.seller_id !== player?.id) return false
    if (!item.card) return false

    const matchSearch = item.card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.card.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRarity = selectedRarity === 'all' || item.card.rarity === selectedRarity
    return matchSearch && matchRarity
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price
    if (sortBy === 'price_desc') return b.price - a.price
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-28 md:pb-20 px-3 sm:px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold mb-2">
            <ShoppingBag size={14} />
            سوق تداول البطاقات (P2P Market)
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">سوق اللاعبين المباشر</h1>
          <p className="text-slate-400 text-sm mt-1">
            اشترِ بطاقات نادرة من لاعبين آخرين أو اعرض بطاقاتك الفائضة للبيع واربح الدولارات ($).
          </p>
        </div>

        {/* User Balance & Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated && player && (
            <div className="glass-card px-4 py-2 rounded-2xl border border-primary-500/30 flex items-center gap-2 text-sm">
              <Coins className="text-amber-400" size={16} />
              <span className="text-slate-400 text-xs">رصيدك:</span>
              <span className="font-bold text-amber-400 number-ltr">{player.balance < 0 ? '-' : ''}${Math.abs(player.balance).toLocaleString('en-US')}</span>
            </div>
          )}

          <Link
            to="/collection"
            className="btn-primary py-2.5 px-4 text-sm font-bold flex items-center gap-2"
          >
            <Tag size={16} /> اعرض بطاقتك للبيع
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          جميع العروض ({listings.length})
        </button>

        {isAuthenticated && (
          <button
            onClick={() => setActiveTab('my_listings')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'my_listings'
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            عروضي المعروضة ({listings.filter(l => l.seller_id === player?.id).length})
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-4 rounded-2xl border border-slate-700/60 mb-8 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
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

          <select
            value={selectedRarity}
            onChange={e => setSelectedRarity(e.target.value)}
            className="w-full md:w-auto bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-primary-500"
          >
            <option value="all">كل الرتب (All)</option>
            <option value="mythic">خرافي (Mythic)</option>
            <option value="legendary">أسطوري (Legendary)</option>
            <option value="epic">ملحمي (Epic)</option>
            <option value="rare">نادر (Rare)</option>
            <option value="common">شائع (Common)</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="w-full md:w-auto bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-primary-500"
          >
            <option value="newest">الأحدث طرحاً</option>
            <option value="price_asc">الأقل سعراً ($)</option>
            <option value="price_desc">الأعلى سعراً ($)</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-24 text-slate-400">جاري تحميل عروض السوق...</div>
      ) : filteredListings.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <ShoppingBag size={30} />
          </div>
          <h3 className="text-xl font-bold text-white">لا توجد عروض حالياً</h3>
          <p className="text-slate-400 text-sm">
            {activeTab === 'my_listings'
              ? 'ليس لديك أي بطاقات معروضة للبيع حالياً. يمكنك الذهاب لمجموعتك واختيار بطاقة لعرضها.'
              : 'كن أول من يعرض بطاقة في السوق ليشتريها اللاعبون الآخرون!'}
          </p>
          <Link to="/collection" className="btn-primary py-2.5 px-6 text-sm font-bold inline-flex items-center gap-2">
            <Tag size={16} /> الذهاب إلى مجموعتي
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredListings.map((item) => {
            const isMine = item.seller_id === player?.id

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -6 }}
                className="glass-card rounded-3xl p-5 border border-slate-700/60 hover:border-primary-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                {/* 3D Card preview */}
                <div className="flex justify-center">
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
                    }}
                    serialNumber={item.player_card?.serial_number}
                    size="sm"
                    interactive={true}
                  />
                </div>

                {/* Seller & Price Info */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <User size={13} className="text-primary-400" />
                      البائع: {item.seller?.username || 'مجهول'}
                    </span>
                    <span className="font-mono text-slate-500">
                      #{item.player_card?.serial_number?.toString().padStart(3, '0')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-slate-400">السعر المطلوب:</p>
                      <p className="font-black text-xl text-amber-400 flex items-center gap-1 number-ltr">
                        <Coins size={16} />
                        ${item.price.toLocaleString('en-US')}
                      </p>
                    </div>

                    {isMine ? (
                      <button
                        onClick={() => handleCancelListing(item.id)}
                        className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition-all"
                      >
                        إلغاء العرض
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            setLoginModalOpen(true)
                            return
                          }
                          setSelectedListing(item)
                        }}
                        className="btn-primary py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <ShoppingBag size={14} /> شراء الآن
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Buy Confirm Modal */}
      <AnimatePresence>
        {selectedListing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setSelectedListing(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="glass-card max-w-md w-full p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-white">تأكيد شراء البطاقة</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                هل أنت متأكد من رغبتك في شراء بطاقة <strong className="text-white">{selectedListing.card.title}</strong> برقم نسخة <strong className="text-amber-400">#{selectedListing.player_card?.serial_number}</strong>؟
              </p>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">سعر البطاقة:</span>
                  <span className="font-bold text-amber-400 number-ltr">${selectedListing.price.toLocaleString('en-US')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">رصيدك الحالي:</span>
                  <span className="font-bold text-white number-ltr">${(player?.balance || 0).toLocaleString('en-US')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2">
                  <span className="text-slate-400">الرصيد بعد الشراء:</span>
                  <span className={`font-bold number-ltr ${(player?.balance || 0) - selectedListing.price < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    ${((player?.balance || 0) - selectedListing.price).toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleBuyCard}
                  disabled={isPurchasing}
                  className="btn-primary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2"
                >
                  {isPurchasing ? 'جاري الشراء...' : 'تأكيد الشراء الفوري'}
                </button>
                <button
                  onClick={() => setSelectedListing(null)}
                  className="btn-secondary py-3 px-5 text-sm font-bold"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
