import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, Sparkles, Coins, Flame, Info, Check, 
  ChevronLeft, ArrowRight, Eye, ShieldAlert, Award
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useUIStore } from '../store'
import { CardRenderer } from '../components/shared/CardRenderer'
import { RARITY_LABELS } from '../lib/cardData'
import { playOpeningChime } from '../lib/audio'
import toast from 'react-hot-toast'
import type { Card } from '../types/database'

interface Box {
  id: string
  name: string
  name_ar: string
  description_ar: string
  image_url: string
  price: number
  multi_price?: number
  multi_count?: number
  badge: string
  accent_color: string
  pity_threshold: number
  guaranteed_rarity: string
  is_limited?: boolean
  duplicate_policy?: string
}

interface BoxDropCard {
  card_id: string
  weight: number
  drop_rate_pct: number
  card: Card
}

interface OpenedCardResult {
  id: string
  card_id: string
  serial_number: number
  title: string
  subtitle: string
  name: string
  rarity: any
  element: string
  image_path: string
  card_design_override?: any
  character?: any
  stats?: any
  skills?: any
}

export function BoxStorePage() {
  const { player, isAuthenticated, refreshPlayer } = useAuth()
  const { setLoginModalOpen } = useUIStore()

  const [boxes, setBoxes] = useState<Box[]>([])
  const [pities, setPities] = useState<Record<string, { counter: number; total: number }>>({})
  const [loading, setLoading] = useState(true)

  // Drop rates inspection modal
  const [selectedBoxRates, setSelectedBoxRates] = useState<{ box: Box; cards: BoxDropCard[] } | null>(null)
  const [loadingRates, setLoadingRates] = useState(false)

  // Unboxing animation states
  const [isOpening, setIsOpening] = useState(false)
  const [openingBox, setOpeningBox] = useState<Box | null>(null)
  const [unboxingPhase, setUnboxingPhase] = useState<'charging' | 'revealed' | null>(null)
  const [openedResult, setOpenedResult] = useState<{ cards: OpenedCardResult[]; is_pity: boolean } | null>(null)

  useEffect(() => {
    loadBoxes()
  }, [player?.id])

  const loadBoxes = async () => {
    setLoading(true)
    try {
      const { data: boxesData } = await supabase
        .from('boxes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (boxesData) {
        setBoxes(boxesData)
      }

      if (player?.id) {
        const { data: pityData } = await supabase
          .from('player_pity')
          .select('box_id, counter, total_opened')
          .eq('player_id', player.id)

        if (pityData) {
          const map: Record<string, { counter: number; total: number }> = {}
          pityData.forEach(p => {
            map[p.box_id] = { counter: p.counter, total: p.total_opened }
          })
          setPities(map)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenRates = async (box: Box) => {
    setLoadingRates(true)
    setSelectedBoxRates({ box, cards: [] })
    try {
      const { data } = await supabase
        .from('box_cards')
        .select(`
          card_id,
          weight,
          drop_rate_pct,
          card:cards(*)
        `)
        .eq('box_id', box.id)
        .order('drop_rate_pct', { ascending: false })

      if (data) {
        setSelectedBoxRates({ box, cards: data as any })
      }
    } finally {
      setLoadingRates(false)
    }
  }

  const handleOpenBox = async (box: Box, count: number = 1) => {
    if (!isAuthenticated || !player) {
      setLoginModalOpen(true)
      return
    }

    const totalCost = count > 1 ? (box.multi_price || box.price * count) : box.price
    if ((player.balance || 0) < totalCost) {
      toast.error(`رصيدك لا يكفي! تحتاج ${totalCost}$، رصيدك الحالي ${player.balance || 0}$`)
      return
    }

    setIsOpening(true)
    setOpeningBox(box)
    setUnboxingPhase('charging')
    setOpenedResult(null)

    try {
      const { data: result, error } = await supabase.rpc('open_box_multi', {
        p_player_id: player.id,
        p_box_id: box.id,
        p_count: count,
      })

      if (error) throw new Error(error.message)
      if (!result?.success) throw new Error(result?.message || 'فشل فتح الصندوق')

      // Dramatic reveal delay
      setTimeout(() => {
        const cardsList = result.cards || []
        setOpenedResult({
          cards: cardsList,
          is_pity: cardsList.some((c: any) => c.is_pity),
        })
        setUnboxingPhase('revealed')
        if (cardsList[0]) {
          playOpeningChime(cardsList[0].rarity)
        }
        refreshPlayer()
        loadBoxes()
      }, 1400)
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء فتح الصندوق')
      setIsOpening(false)
      setUnboxingPhase(null)
    }
  }

  const handleCloseUnboxing = () => {
    setIsOpening(false)
    setOpeningBox(null)
    setUnboxingPhase(null)
    setOpenedResult(null)
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-28 md:pb-20 px-3 sm:px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative mb-8 sm:mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
          <Sparkles size={14} className="flex-shrink-0" />
          <span>متجر صناديق الحظ والـ Resonance</span>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-2 sm:mb-3">
          افتح الصناديق واجمع أندر بطاقات الـ Resonators
        </h1>
        <p className="text-slate-400 text-xs sm:text-base max-w-2xl mx-auto px-2">
          استثمر دولاراتك ($) في فتح الصناديق المتنوعة، كل سحبة تزيد من فرصة الحصول على بطاقات أسطورية وخرافية مع نظام الضمان الذكي (Pity System).
        </p>

        {/* User Balance Bar */}
        {isAuthenticated && player && (
          <div className="mt-4 sm:mt-6 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-2 sm:px-6 sm:py-2.5 rounded-2xl glass-card border border-primary-500/30 shadow-lg text-xs sm:text-sm">
            <Coins className="text-amber-400" size={18} />
            <span className="text-slate-300">رصيدك المتاح:</span>
            <span className="font-black text-base sm:text-lg text-amber-400 font-mono number-ltr">
              ${Number(player.balance || 0).toLocaleString('en-US')}
            </span>
            <Link to="/collection" className="mr-2 text-xs text-primary-400 hover:text-primary-300 font-bold flex items-center gap-1">
              عرض مجموعتي <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>

      {/* Boxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {boxes.map((box) => {
          const pity = pities[box.id] || { counter: 0, total: 0 }
          const pityLeft = Math.max(0, box.pity_threshold - pity.counter)
          const pityPct = Math.min(100, Math.round((pity.counter / box.pity_threshold) * 100))

          return (
            <motion.div
              key={box.id}
              whileHover={{ y: -5 }}
              className="glass-card rounded-3xl overflow-hidden border border-slate-700/60 hover:border-primary-500/40 transition-all flex flex-col relative group shadow-2xl"
              style={{
                boxShadow: `0 15px 35px -15px ${box.accent_color}25`
              }}
            >
              {/* Badge */}
              <div 
                className="absolute top-3.5 right-3.5 z-20 px-3 py-1 rounded-full text-[11px] font-black text-white uppercase tracking-wider shadow-md"
                style={{ background: box.accent_color }}
              >
                {box.badge}
              </div>

              {/* Box Image / Presentation */}
              <div className="relative h-52 sm:h-60 overflow-hidden flex items-center justify-center p-4 bg-gradient-to-b from-slate-900/40 to-slate-950/80">
                <div 
                  className="absolute inset-0 opacity-20 group-hover:opacity-35 transition-opacity blur-2xl -z-10"
                  style={{ background: `radial-gradient(circle, ${box.accent_color}, transparent 70%)` }}
                />
                <img
                  src={box.image_url}
                  alt={box.name_ar}
                  className="h-full w-auto max-w-[200px] object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Box Details */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4 sm:space-y-5">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white mb-1">{box.name_ar}</h3>
                  <p className="text-xs text-primary-400 font-medium mb-2">{box.name}</p>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-2">
                    {box.description_ar}
                  </p>
                </div>

                {/* Pity Progress */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 sm:p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Award size={14} className="text-amber-400 flex-shrink-0" />
                      <span>عداد الضمان:</span>
                    </span>
                    <span className="font-bold text-white font-mono" dir="ltr">
                      {pity.counter} / {box.pity_threshold}
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pityPct}%`,
                        background: `linear-gradient(90deg, ${box.accent_color}, #a855f7)`
                      }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>متبقي على الضمان:</span>
                    <span className="text-amber-400 font-bold">
                      {pityLeft === 1 ? 'السحبة القادمة مضمونة!' : `${pityLeft} سحبات`}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenBox(box, 1)}
                      className="py-2.5 px-3 rounded-2xl font-black text-white text-xs flex flex-col items-center justify-center gap-1 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${box.accent_color}, #6366f1)`
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Package size={15} />
                        <span>سحبة 1x</span>
                      </div>
                      <span className="bg-black/30 px-2 py-0.5 rounded-lg text-[11px] font-bold text-amber-300 font-mono number-ltr">
                        ${box.price}
                      </span>
                    </button>

                    <button
                      onClick={() => handleOpenBox(box, box.multi_count || 10)}
                      className="py-2.5 px-3 rounded-2xl font-black text-white text-xs flex flex-col items-center justify-center gap-1 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, #ec4899, #8b5cf6)`
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={15} className="text-amber-300 animate-spin" />
                        <span>سحب {box.multi_count || 10}x</span>
                      </div>
                      <span className="bg-black/30 px-2 py-0.5 rounded-lg text-[11px] font-bold text-amber-300 font-mono number-ltr">
                        ${box.multi_price || box.price * 9}
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenRates(box)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700/50"
                  >
                    <Eye size={13} />
                    عرض نسب السقوط والبطاقات
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Cinematic Opening Modal */}
      <AnimatePresence>
        {isOpening && openingBox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
          >
            {unboxingPhase === 'charging' && (
              <div className="text-center space-y-6">
                <motion.div
                  animate={{
                    scale: [1, 1.15, 0.95, 1.2],
                    rotate: [0, -3, 3, 0],
                  }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="relative inline-block"
                >
                  <div 
                    className="absolute inset-0 rounded-full blur-3xl opacity-70 animate-pulse"
                    style={{ background: openingBox.accent_color }}
                  />
                  <img
                    src={openingBox.image_url}
                    alt={openingBox.name_ar}
                    className="w-48 h-48 sm:w-64 sm:h-64 object-contain filter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                  />
                </motion.div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white animate-pulse">
                    جاري فك تشفير الـ Resonance واكتشاف البطاقة...
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm">ترددات الموجات الصدى تتركز الآن</p>
                </div>
              </div>
            )}

            {unboxingPhase === 'revealed' && openedResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="max-w-4xl w-full text-center space-y-5 px-2 max-h-[90vh] overflow-y-auto"
              >
                {/* Fanfare badge */}
                <div>
                  {openedResult.is_pity && (
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-2"
                    >
                      <Sparkles size={14} /> سحبة الضمان (Pity Triggered)!
                    </motion.div>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {openedResult.cards.length > 1
                      ? `مبارك! حصلت على ${openedResult.cards.length} بطاقات جديدة`
                      : 'مبارك! حصلت على بطاقة جديدة'}
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm">تمت إضافة البطاقات إلى محفظتك ومجموعتك بنجاح</p>
                </div>

                {/* Display Single or Multi Cards */}
                {openedResult.cards.length === 1 ? (
                  <div className="flex justify-center py-1">
                    <CardRenderer
                      card={{
                        id: openedResult.cards[0].id,
                        title: openedResult.cards[0].title,
                        subtitle: openedResult.cards[0].subtitle,
                        name: openedResult.cards[0].name,
                        rarity: openedResult.cards[0].rarity,
                        element: openedResult.cards[0].element,
                        image_path: openedResult.cards[0].image_path,
                        card_design_override: openedResult.cards[0].card_design_override,
                      }}
                      serialNumber={openedResult.cards[0].serial_number}
                      size="md"
                      interactive={true}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-2">
                    {openedResult.cards.map((card, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="glass-card rounded-2xl p-2.5 flex flex-col items-center gap-2 border border-slate-700/80 hover:border-amber-400/50 transition-all shadow-lg"
                      >
                        <div className="w-full aspect-[2/3] rounded-xl overflow-hidden relative border border-white/10">
                          <img
                            src={card.image_path}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                          <span
                            className="absolute top-1 right-1 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase"
                            style={{
                              backgroundColor:
                                card.rarity === 'mythic' ? '#ec4899' :
                                card.rarity === 'legendary' ? '#f59e0b' :
                                card.rarity === 'epic' ? '#a855f7' :
                                card.rarity === 'rare' ? '#38bdf8' : '#64748b',
                              color: '#fff'
                            }}
                          >
                            {card.rarity}
                          </span>
                        </div>
                        <div className="text-center w-full">
                          <span className="text-[11px] font-bold text-white block truncate">{card.name}</span>
                          <span className="text-[10px] text-amber-300 font-mono">#{card.serial_number}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleOpenBox(openingBox, openedResult.cards.length > 1 ? (openingBox.multi_count || 10) : 1)}
                    className="btn-primary py-2.5 sm:py-3 px-5 sm:px-6 text-xs sm:text-sm font-bold flex items-center gap-1.5"
                  >
                    <Package size={15} /> فتح المزيد
                  </button>
                  <button
                    onClick={handleCloseUnboxing}
                    className="btn-secondary py-2.5 sm:py-3 px-5 sm:px-6 text-xs sm:text-sm font-bold"
                  >
                    إغلاق
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rates & Cards Info Modal */}
      <AnimatePresence>
        {selectedBoxRates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setSelectedBoxRates(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-xl w-full p-5 sm:p-6 rounded-3xl border border-slate-700/80 shadow-2xl space-y-4 sm:space-y-5 max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-3 flex-shrink-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">{selectedBoxRates.box.name_ar}</h3>
                  <p className="text-xs text-slate-400">قائمة بطاقات الصندوق ونسب السقوط</p>
                </div>
                <button
                  onClick={() => setSelectedBoxRates(null)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50"
                >
                  ✕
                </button>
              </div>

              {loadingRates ? (
                <div className="text-center py-10 text-slate-400 text-sm">جاري تحميل البطاقات...</div>
              ) : selectedBoxRates.cards.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">لا توجد بطاقات مضافة في هذا الصندوق حالياً</div>
              ) : (
                <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
                  {selectedBoxRates.cards.map((item, idx) => {
                    const rarityInfo = RARITY_LABELS[item.card.rarity]
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <img
                            src={item.card.image_path || ''}
                            alt={item.card.title || ''}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                          />
                          <div>
                            <p className="font-bold text-white text-xs sm:text-sm">{item.card.title}</p>
                            <span 
                              className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5"
                              style={{ background: `${rarityInfo?.color}25`, color: rarityInfo?.color }}
                            >
                              {rarityInfo?.label}
                            </span>
                          </div>
                        </div>

                        <div className="text-left font-mono font-bold text-primary-400 text-xs sm:text-sm" dir="ltr">
                          {item.drop_rate_pct}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
