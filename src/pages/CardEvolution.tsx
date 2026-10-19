import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkles, Zap, Heart, Swords, Shield, ChevronRight, 
  ArrowUp, Award, Coins, Check, ArrowRight, Loader2, Gauge
} from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { useUIStore } from "../store"
import { supabase } from "../lib/supabase"
import { CardRenderer, ElementIcon } from "../components/shared/CardRenderer"
import { RARITY_LABELS, ELEMENT_MAP } from '../lib/cardData'
import toast from "react-hot-toast"

import { calculateCardStats, getFusionBadge } from '../lib/cardStats'
import { Layers } from 'lucide-react'

interface CardItem {
  id: string // player_card id
  card_id: string
  serial_number: number
  evolution_level: number
  fusion_level?: number
  status: string
  card: {
    id: string
    name: string
    title: string | null
    subtitle: string | null
    rarity: string
    element: string
    image_path: string
    stats?: {
      hp?: number
      atk?: number
      def?: number
      speed?: number
      crit_rate?: number
      crit_dmg?: number
      shield?: number
      heal?: number
      lifesteal?: number
    }
  }
}

export function CardEvolutionPage() {
  const { player, isAuthenticated, refreshPlayer } = useAuth()
  const { setLoginModalOpen } = useUIStore()

  const [playerCards, setPlayerCards] = useState<CardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeAnim, setUpgradeAnim] = useState(false)

  useEffect(() => {
    if (player?.id) {
      loadPlayerCards()
    } else {
      setPlayerCards([])
      setLoading(false)
    }
  }, [player?.id])

  const loadPlayerCards = async () => {
    if (!player?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('player_cards')
        .select(`
          id,
          card_id,
          serial_number,
          evolution_level,
          fusion_level,
          status,
          card:cards(*)
        `)
        .eq('player_id', player.id)
        .eq('status', 'owned')
        .order('evolution_level', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const items = data.map((d: any) => ({
          ...d,
          card: Array.isArray(d.card) ? d.card[0] : d.card
        }))
        setPlayerCards(items)
        if (selectedCard) {
          const fresh = items.find(i => i.id === selectedCard.id)
          setSelectedCard(fresh || items[0])
        } else {
          setSelectedCard(items[0])
        }
      } else {
        setPlayerCards([])
        setSelectedCard(null)
      }
    } catch (err) {
      console.error(err)
      toast.error('فشل تحميل بطاقاتك')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated || !player) {
    return (
      <div className="min-h-screen pt-20 pb-28 md:pb-16 flex items-center justify-center px-4" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center glass-card rounded-3xl p-10 max-w-sm border border-slate-700/60 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">سجّل دخولك أولاً</h2>
          <p className="text-slate-400 text-sm mb-6">يجب تسجيل الدخول لتطوير إحصائيات بطاقاتك وزيادة مستواها</p>
          <button onClick={() => setLoginModalOpen(true)} className="btn-primary w-full shadow-glow-blue">دخول المنصة</button>
        </motion.div>
      </div>
    )
  }

  // Calculate current vs next level stats
  const currentLevel = selectedCard?.evolution_level || 1
  const maxLevel = 10
  const isMaxLevel = currentLevel >= maxLevel

  const baseStats = selectedCard?.card?.stats || {
    hp: 1200,
    atk: 180,
    def: 90,
    speed: 100,
    crit_rate: 15,
    crit_dmg: 150,
    shield: 0,
    heal: 0,
    lifesteal: 0,
  }

  // Scaling formulas:
  // HP: +15% per level
  // ATK: +12% per level
  // DEF: +10% per level
  // Speed: +2 per level
  // Crit Rate: +1% per 2 levels
  const cardFusionLevel = selectedCard?.fusion_level || 0
  const currentCalculated = calculateCardStats(baseStats, currentLevel, cardFusionLevel)
  const nextCalculated = calculateCardStats(baseStats, Math.min(maxLevel, currentLevel + 1), cardFusionLevel)

  const currentHp = currentCalculated.hp
  const nextHp = nextCalculated.hp

  const currentAtk = currentCalculated.atk
  const nextAtk = nextCalculated.atk

  const currentDef = currentCalculated.def
  const nextDef = nextCalculated.def

  const currentSpeed = currentCalculated.speed
  const nextSpeed = nextCalculated.speed

  const currentCrit = currentCalculated.crit_rate
  const nextCrit = nextCalculated.crit_rate

  const upgradeCost = currentLevel * 150

  const handleUpgrade = async () => {
    if (!selectedCard) return
    if (isMaxLevel) {
      toast.error('وصلت هذه البطاقة إلى أقصى مستوى تطوير!')
      return
    }
    if (player.balance < upgradeCost) {
      toast.error(`رصيدك غير كافٍ! تحتاج ${upgradeCost} نقطة ورصيدك الحالي ${player.balance} نقطة`)
      return
    }

    setUpgrading(true)
    setUpgradeAnim(true)

    try {
      const { data: res, error } = await supabase.rpc('upgrade_player_card', {
        p_player_id: player.id,
        p_player_card_id: selectedCard.id
      })

      if (error) throw error
      if (!res?.success) throw new Error(res?.message || 'فشلت عملية التطوير')

      await refreshPlayer()
      await loadPlayerCards()

      toast.success(res.message || `🌟 تم تطوير البطاقة بنجاح إلى المستوى Lv.${res.new_level}!`)
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء التطوير')
    } finally {
      setUpgradeAnim(false)
      setUpgrading(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-28 md:pb-16 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Sparkles size={20} className="text-amber-400" />
              </div>
              تطوير وترقية إحصائيات البطاقات
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              ترقية مباشرة لمستوى البطاقة وقيم ATK وHP وDEF لتسجيل أداء أعلى في المبارزات ومعارك الزعماء دون تغيير الندرة الثابتة.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/fusion"
              className="px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black flex items-center gap-1.5 hover:bg-amber-500/20 transition-all shadow-glow-amber"
            >
              <Layers size={15} />
              دمج البطاقات المكررة ✦
            </Link>

            <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center gap-2">
              <Coins size={16} className="text-amber-400" />
              <span className="text-xs text-slate-400">رصيدك المتاح:</span>
              <span className="font-mono font-black text-amber-300 text-sm">{player.balance} نقطة</span>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="glass-card rounded-3xl p-16 text-center border border-slate-800">
            <Loader2 size={32} className="animate-spin text-primary-400 mx-auto mb-3" />
            <p className="text-sm text-slate-400">جارٍ فحص بطاقاتك المملوكة...</p>
          </div>
        ) : playerCards.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <Swords size={28} />
            </div>
            <h3 className="text-lg font-black text-white">لا توجد بطاقات في مجموعتك بعد</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              احصل على بطاقاتك الأولى عبر فتح الصناديق في المتجر أو شرائها من سوق البطاقات.
            </p>
            <Link to="/boxes" className="btn-primary inline-flex items-center gap-2 text-xs font-bold">
              الذهاب إلى متجر الصناديق <ArrowLeft size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Player Cards Selector (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-400">بطاقاتك الجاهزة للترقية ({playerCards.length}):</span>
              </div>

              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                {playerCards.map(item => {
                  const isSel = selectedCard?.id === item.id
                  const elem = ELEMENT_MAP[item.card?.element]
                  const rarityStyle = RARITY_LABELS[item.card?.rarity] || { label: item.card?.rarity, color: '#94a3b8' }

                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ x: -2 }}
                      onClick={() => setSelectedCard(item)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSel
                          ? 'bg-gradient-to-r from-amber-500/15 via-primary-500/10 to-slate-900 border-amber-500/50 shadow-glow-amber'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 rounded-xl overflow-hidden bg-black relative shrink-0 border border-slate-700">
                          <img
                            src={item.card?.image_path}
                            alt={item.card?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white truncate max-w-[140px]">{item.card?.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                              style={{ color: rarityStyle.color, background: `${rarityStyle.color}15` }}
                            >
                              {rarityStyle.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <ElementIcon element={item.card?.element} size={12} />
                              {item.card?.element}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left shrink-0 flex items-center gap-1.5">
                        {item.fusion_level && item.fusion_level > 0 ? (
                          <span className="px-2 py-1 rounded-xl text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            ✦ Lv.{item.fusion_level}
                          </span>
                        ) : null}
                        <span className="px-2 py-1 rounded-xl text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Lv.{item.evolution_level || 1}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Right: Upgrade Workbench (7 cols) */}
            {selectedCard && (
              <div className="lg:col-span-7 space-y-4">
                <div className="glass-card rounded-3xl p-6 border border-slate-700/60 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-primary-500 to-purple-600" />

                  {/* Card Overview */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-slate-800">
                    <div className="w-24 h-32 rounded-2xl overflow-hidden bg-black/60 border border-amber-500/30 shadow-glow-amber relative shrink-0">
                      <img
                        src={selectedCard.card?.image_path}
                        alt={selectedCard.card?.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-black/80 text-amber-300">
                        #{selectedCard.serial_number}
                      </span>
                    </div>

                    <div className="text-center sm:text-right space-y-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          الندرة الثابتة: {RARITY_LABELS[selectedCard.card?.rarity]?.label || selectedCard.card?.rarity}
                        </span>
                        <span className="text-xs text-primary-400 font-bold flex items-center gap-1">
                          <ElementIcon element={selectedCard.card?.element} size={14} />
                          {selectedCard.card?.element}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-white">{selectedCard.card?.name}</h2>
                      <p className="text-xs text-slate-400">{selectedCard.card?.title || 'Battle Resonance'}</p>
                    </div>
                  </div>

                  {/* Level Progress */}
                  <div className="py-4 border-b border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">مستوى التطوير</span>
                      <span className="font-mono font-black text-amber-400">
                        Lv.{currentLevel} <span className="text-slate-500">/ Lv.{maxLevel}</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${(currentLevel / maxLevel) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Comparison Matrix */}
                  <div className="py-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-400" />
                      مقارنة الإحصائيات قبل وبعد التطوير:
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* HP */}
                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-400">
                          <Heart size={16} />
                          <span className="font-bold">HP (الصحة):</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-300 font-bold">{currentHp}</span>
                          {!isMaxLevel && (
                            <>
                              <ChevronRight size={14} className="text-emerald-400 rotate-180" />
                              <span className="text-emerald-400 font-black">{nextHp} (+{nextHp - currentHp})</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* ATK */}
                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-400">
                          <Swords size={16} />
                          <span className="font-bold">ATK (الهجوم):</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-300 font-bold">{currentAtk}</span>
                          {!isMaxLevel && (
                            <>
                              <ChevronRight size={14} className="text-emerald-400 rotate-180" />
                              <span className="text-emerald-400 font-black">{nextAtk} (+{nextAtk - currentAtk})</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* DEF */}
                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-400">
                          <Shield size={16} />
                          <span className="font-bold">DEF (الدفاع):</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-300 font-bold">{currentDef}</span>
                          {!isMaxLevel && (
                            <>
                              <ChevronRight size={14} className="text-emerald-400 rotate-180" />
                              <span className="text-emerald-400 font-black">{nextDef} (+{nextDef - currentDef})</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* SPEED */}
                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Gauge size={16} />
                          <span className="font-bold">SPEED (السرعة):</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-300 font-bold">{currentSpeed}</span>
                          {!isMaxLevel && (
                            <>
                              <ChevronRight size={14} className="text-emerald-400 rotate-180" />
                              <span className="text-emerald-400 font-black">{nextSpeed} (+{nextSpeed - currentSpeed})</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action & Cost Footer */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-slate-400 text-xs block">تكلفة ترقية المستوى:</span>
                      {isMaxLevel ? (
                        <span className="text-emerald-400 text-sm font-black">أقصى ترقية مكتملة ✨</span>
                      ) : (
                        <span className="text-amber-400 text-base font-black font-mono">
                          {upgradeCost} نقطة
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handleUpgrade}
                      disabled={upgrading || isMaxLevel}
                      className={`btn-primary px-8 py-3 text-sm font-black flex items-center gap-2 shadow-glow-amber ${
                        isMaxLevel ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {upgrading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          جارٍ ترقية الإحصائيات...
                        </>
                      ) : isMaxLevel ? (
                        'المستوى الأقصى'
                      ) : (
                        <>
                          <ArrowUp size={16} />
                          ترقية إلى المستوى Lv.{currentLevel + 1}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
function ArrowLeft(props: any) {
  return <ArrowRight className="rotate-180" {...props} />
}
