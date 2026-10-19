import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Filter, Check, X, Shield, Swords, Heart, 
  Zap, Sparkles, Plus, Minus, Info, ChevronDown
} from 'lucide-react'
import { CardRenderer, ElementIcon } from './CardRenderer'
import { RARITY_LABELS, ELEMENT_MAP } from '../../lib/cardData'
import type { Card, CardRarity } from '../../types/database'
import { supabase } from '../../lib/supabase'
import { calculateCardStats } from '../../lib/cardStats'

export interface SelectableCardItem {
  id: string // player_card id or card id
  card_id: string
  name: string
  title?: string | null
  subtitle?: string | null
  element: string
  rarity: CardRarity
  image_path: string
  card_design_override?: any
  evolution_level?: number
  fusion_level?: number
  serial_number?: number
  stats?: {
    hp?: number
    atk?: number
    def?: number
    speed?: number
    crit_rate?: number
    crit_dmg?: number
    shield?: number
    heal?: number
  }
}

interface CardSelectorProps {
  mode: 'player' | 'admin'
  cards?: SelectableCardItem[]
  playerId?: string
  selectedCardIds: string[]
  maxSelect?: number
  minSelect?: number
  onSelectionChange: (selectedIds: string[], selectedItems: SelectableCardItem[]) => void
  title?: string
  subtitle?: string
}

export function CardSelector({
  mode,
  cards: propCards,
  playerId,
  selectedCardIds,
  maxSelect = 5,
  minSelect = 1,
  onSelectionChange,
  title = 'اختيار تشكيلة البطاقات',
  subtitle = `يمكنك اختيار من ${minSelect} إلى ${maxSelect} بطاقات`
}: CardSelectorProps) {
  const [fetchedCards, setFetchedCards] = useState<SelectableCardItem[]>([])
  const [fetchingCards, setFetchingCards] = useState(false)

  // Auto-fetch cards from DB when no cards prop provided
  useEffect(() => {
    if (propCards && propCards.length > 0) return

    if (mode === 'admin') {
      setFetchingCards(true)
      supabase
        .from('cards')
        .select('*')
        .eq('is_published', true)
        .order('rarity', { ascending: false })
        .then(({ data }) => {
          if (data) {
            const mapped: SelectableCardItem[] = data.map((c: any) => ({
              id: c.id,
              card_id: c.id,
              name: c.name || 'بطاقة',
              title: c.title || null,
              subtitle: c.subtitle || null,
              element: c.element || 'Fusion',
              rarity: c.rarity || 'common',
              image_path: c.image_path || '/logo.jpeg',
              card_design_override: c.card_design_override || null,
              stats: {
                hp: c.stats?.hp || 3500,
                atk: c.stats?.atk || 1200,
                def: c.stats?.def || 800,
                speed: c.stats?.speed || 100,
                crit_rate: c.stats?.crit_rate || 15,
              },
            }))
            setFetchedCards(mapped)
          }
        })
        .finally(() => setFetchingCards(false))
    } else if (mode === 'player') {
      // Auto-fetch player's cards
      setFetchingCards(true)
      const fetchForPid = (pid: string) => {
        supabase
          .from('player_cards')
          .select(`
            id,
            card_id,
            evolution_level,
            fusion_level,
            serial_number,
            card:cards(*)
          `)
          .eq('player_id', pid)
          .eq('status', 'owned')
          .then(({ data, error }) => {
            if (data && data.length > 0) {
              const mapped: SelectableCardItem[] = data.map((pc: any) => {
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
              setFetchedCards(mapped)
            }
          })
          .finally(() => setFetchingCards(false))
      }

      if (playerId) {
        fetchForPid(playerId)
      } else {
        supabase.auth.getSession().then(({ data: sessData }) => {
          const authUid = sessData?.session?.user?.id
          if (!authUid) {
            setFetchingCards(false)
            return
          }
          supabase
            .from('players')
            .select('id')
            .eq('auth_user_id', authUid)
            .maybeSingle()
            .then(({ data: pData }) => {
              if (pData?.id) fetchForPid(pData.id)
              else setFetchingCards(false)
            })
            .catch(() => setFetchingCards(false))
        })
      }
    }
  }, [mode, propCards, playerId])

  // Use propCards if provided, otherwise use auto-fetched cards
  const cards = (propCards && propCards.length > 0) ? propCards : fetchedCards
  const [search, setSearch] = useState('')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [selectedElement, setSelectedElement] = useState<string>('all')
  const [inspectedCard, setInspectedCard] = useState<SelectableCardItem | null>(null)

  // Filter cards
  const filteredCards = useMemo(() => {
    return (cards || []).filter(item => {
      if (!item || !item.id) return false
      const q = search.trim().toLowerCase()
      const matchSearch = !q || 
        (item.name && item.name.toLowerCase().includes(q)) || 
        (item.title && item.title.toLowerCase().includes(q))
      const matchRarity = selectedRarity === 'all' || (item.rarity && item.rarity.toLowerCase() === selectedRarity.toLowerCase())
      const matchElement = selectedElement === 'all' || (item.element && item.element.toLowerCase() === selectedElement.toLowerCase())
      return matchSearch && matchRarity && matchElement
    })
  }, [cards, search, selectedRarity, selectedElement])

  const safeSelectedCardIds = useMemo(() => {
    return (selectedCardIds || []).filter((id): id is string => typeof id === 'string' && Boolean(id))
  }, [selectedCardIds])

  const isSelected = (id: string) => safeSelectedCardIds.includes(id)

  const toggleCard = (item: SelectableCardItem) => {
    if (!item || !item.id) return
    const cardIdentifier = item.id
    if (isSelected(cardIdentifier)) {
      const nextIds = safeSelectedCardIds.filter(id => id !== cardIdentifier)
      const nextItems = (cards || []).filter(c => c && nextIds.includes(c.id))
      onSelectionChange(nextIds, nextItems)
    } else {
      if (safeSelectedCardIds.length >= maxSelect) {
        return // reached maximum allowed
      }
      const nextIds = [...safeSelectedCardIds, cardIdentifier]
      const nextItems = (cards || []).filter(c => c && nextIds.includes(c.id))
      onSelectionChange(nextIds, nextItems)
    }
  }

  const selectedObjects = useMemo(() => {
    return (cards || []).filter(c => c && safeSelectedCardIds.includes(c.id))
  }, [cards, safeSelectedCardIds])

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header & Limits Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="text-amber-400" size={18} />
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all ${
            selectedCardIds.length >= minSelect && selectedCardIds.length <= maxSelect
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-glow-green'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            <Check size={14} />
            <span>المختارة: {selectedCardIds.length} / {maxSelect}</span>
          </div>
          {selectedCardIds.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectionChange([], [])}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
            >
              تفريغ
            </button>
          )}
        </div>
      </div>

      {/* Selected Cards Strip Preview */}
      {selectedObjects.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-primary-500/30 overflow-hidden">
          <p className="text-xs font-bold text-primary-300 mb-2 flex items-center gap-1.5">
            <Zap size={14} /> التشكيلة النشطة ({selectedObjects.length}):
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
            {selectedObjects.map(card => {
              const elementColor = ELEMENT_MAP[card.element]?.color || '#a855f7'
              return (
                <div
                  key={card.id}
                  className="relative flex-shrink-0 w-28 p-2 rounded-xl bg-slate-900 border border-slate-700/80 group hover:border-primary-400 transition-all text-center"
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleCard(card); }}
                    className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-10"
                    title="إزالة"
                  >
                    <X size={12} />
                  </button>

                  <div className="w-full h-24 rounded-lg overflow-hidden mb-1.5 bg-black/40 relative">
                    <img
                      src={card.image_path}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-1" 
                      style={{ background: elementColor }} 
                    />
                    {card.evolution_level && card.evolution_level > 1 && (
                      <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/90 text-black shadow">
                        Lv.{card.evolution_level}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-black text-white truncate">{card.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{card.rarity}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو العنوان..."
            className="input-field py-2 pr-9 pl-3 text-xs w-full"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Rarity */}
          <select
            value={selectedRarity}
            onChange={e => setSelectedRarity(e.target.value)}
            className="select-field py-2 px-3 text-xs font-bold text-slate-200"
          >
            <option value="all">جميع الندرات</option>
            <option value="common">Common (شائع)</option>
            <option value="rare">Rare (نادر)</option>
            <option value="epic">Epic (ملحمي)</option>
            <option value="legendary">Legendary (أسطوري)</option>
            <option value="mythic">Mythic (ميثيكي)</option>
          </select>

          {/* Element */}
          <select
            value={selectedElement}
            onChange={e => setSelectedElement(e.target.value)}
            className="select-field py-2 px-3 text-xs font-bold text-slate-200"
          >
            <option value="all">جميع العناصر</option>
            <option value="Fusion">Fusion (ناري)</option>
            <option value="Glacio">Glacio (جليدي)</option>
            <option value="Electro">Electro (صاعق)</option>
            <option value="Aero">Aero (هوائي)</option>
            <option value="Spectro">Spectro (طيفي)</option>
            <option value="Havoc">Havoc (هاوية)</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      {fetchingCards ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          جارٍ تحميل البطاقات المتاحة...
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
          {cards.length === 0 ? (
            mode === 'player' 
              ? 'لا تملك أي بطاقات في محفظتك حالياً. احصل على بطاقات من متجر الصناديق أو سوق البطاقات أولاً!'
              : 'لا توجد بطاقات في النظام بعد. أضف بطاقات من قسم إدارة البطاقات أولاً.'
          ) : 'لا توجد بطاقات مطابقة لخيارات البحث الحالية'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredCards.map(item => {
            const selected = isSelected(item.id)
            const reachedMax = !selected && selectedCardIds.length >= maxSelect
            const elementInfo = ELEMENT_MAP[item.element]
            const lvl = item.evolution_level || 1
            const fusionLvl = item.fusion_level || 0
            const currentStats = (item as any).raw_stats
              ? calculateCardStats((item as any).raw_stats, lvl, fusionLvl)
              : (item.stats || { hp: 1200, atk: 180, def: 90 })
            const currentHp = currentStats.hp || 1200
            const currentAtk = currentStats.atk || 180

            return (
              <motion.div
                key={item.id}
                whileHover={reachedMax ? {} : { y: -3 }}
                onClick={() => !reachedMax && toggleCard(item)}
                className={`relative rounded-2xl p-2.5 transition-all cursor-pointer border flex flex-col justify-between ${
                  selected
                    ? 'bg-gradient-to-b from-primary-950/80 to-slate-900 border-primary-500 shadow-glow-blue ring-2 ring-primary-500/50'
                    : reachedMax
                    ? 'bg-slate-900/30 border-slate-800/60 opacity-50 cursor-not-allowed'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Selection Check Badge */}
                <div className={`absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center transition-all z-10 ${
                  selected
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-black/60 border border-slate-600 text-transparent'
                }`}>
                  <Check size={12} className={selected ? 'opacity-100' : 'opacity-0'} />
                </div>

                {/* Level badge if player card */}
                {lvl > 1 && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-black shadow z-10">
                    Lv.{lvl}
                  </span>
                )}

                {/* Fusion level badge */}
                {(item.fusion_level ?? 0) > 0 && (
                  <span className="absolute top-8 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-cyan-500/90 text-black shadow z-10">
                    ✦F{item.fusion_level}
                  </span>
                )}

                {/* Card Image */}
                <div className="w-full h-32 rounded-xl overflow-hidden mb-2 bg-black/60 relative">
                  <img
                    src={item.image_path}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ background: elementInfo?.color || '#6366f1' }}
                  />
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <p className="text-xs font-black text-white truncate text-right">{item.name}</p>
                  
                  <div className="flex items-center justify-between text-[10px]">
                    <span 
                      className="font-bold px-1.5 py-0.2 rounded"
                      style={{ 
                        color: RARITY_LABELS[item.rarity]?.color || '#94a3b8',
                        background: `${RARITY_LABELS[item.rarity]?.color || '#94a3b8'}15` 
                      }}
                    >
                      {RARITY_LABELS[item.rarity]?.label || item.rarity}
                    </span>
                    <span className="text-slate-400 font-semibold">{item.element}</span>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-300 font-mono">
                    <span className="flex items-center gap-0.5 text-red-400">
                      <Heart size={10} /> {currentHp}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-400">
                      <Swords size={10} /> {currentAtk}
                    </span>
                  </div>
                </div>

                {/* Inspect Info Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setInspectedCard(item)
                  }}
                  className="mt-2 w-full py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-[10px] text-slate-400 hover:text-white flex items-center justify-center gap-1 transition-colors border border-slate-700/50"
                >
                  <Info size={11} /> تفاصيل
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Detailed Card Inspect Modal */}
      <AnimatePresence>
        {inspectedCard && (
          <div className="modal-overlay" onClick={() => setInspectedCard(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card rounded-3xl p-6 max-w-sm w-full mx-4 border border-slate-700 text-right space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <button
                  onClick={() => setInspectedCard(null)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
                <h4 className="text-base font-black text-white">{inspectedCard.name}</h4>
              </div>

              <div className="w-full h-48 rounded-2xl overflow-hidden bg-black/60 relative">
                <img
                  src={inspectedCard.image_path}
                  alt={inspectedCard.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">الندرة الثابتة:</span>
                  <span className="font-black text-amber-400 uppercase">{inspectedCard.rarity}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">العنصر:</span>
                  <span className="font-black text-primary-400">{inspectedCard.element}</span>
                </div>
                {inspectedCard.evolution_level && (
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">مستوى التطوير:</span>
                    <span className="font-black text-emerald-400">Level {inspectedCard.evolution_level} / 10</span>
                  </div>
                )}
                {inspectedCard.stats && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-400">HP (الصحة)</p>
                      <p className="text-sm font-black text-red-400 font-mono">{inspectedCard.stats.hp || 1200}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-400">ATK (الهجوم)</p>
                      <p className="text-sm font-black text-amber-400 font-mono">{inspectedCard.stats.atk || 180}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-400">DEF (الدفاع)</p>
                      <p className="text-sm font-black text-blue-400 font-mono">{inspectedCard.stats.def || 90}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-400">SPEED (السرعة)</p>
                      <p className="text-sm font-black text-emerald-400 font-mono">{inspectedCard.stats.speed || 100}</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  toggleCard(inspectedCard)
                  setInspectedCard(null)
                }}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  isSelected(inspectedCard.id)
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                    : 'btn-primary'
                }`}
              >
                {isSelected(inspectedCard.id) ? 'إزالة من التشكيلة' : 'إضافة إلى التشكيلة'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
