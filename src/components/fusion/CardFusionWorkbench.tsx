import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Layers, Shield, Swords, Heart, Gauge, Flame,
  Check, AlertTriangle, ArrowRight, ArrowLeft, ArrowUp, RefreshCw,
  History, Info, Award, Loader2, ChevronRight, Zap, CheckCircle2,
  Plus, Minus, Lock, Sliders, ChevronDown
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { ElementIcon } from '../shared/CardRenderer'
import { RARITY_LABELS, ELEMENT_MAP } from '../../lib/cardData'
import {
  calculateCardStats,
  getRequiredCopiesForTargetLevel,
  calculateReachableFusionLevel,
  getFusionBadge,
  DEFAULT_FUSION_CONFIG,
  FusionConfig
} from '../../lib/cardStats'
import toast from 'react-hot-toast'

export interface FusibleCardGroup {
  card_id: string
  name: string
  title: string | null
  subtitle: string | null
  element: string
  rarity: string
  image_path: string
  stats: any
  skills: any
  copy_count: number
  max_fusion_level: number
  copies: Array<{
    id: string
    serial_number: number
    evolution_level: number
    fusion_level: number
    obtained_at: string
    is_favorite: boolean
  }>
}

interface CardFusionWorkbenchProps {
  onFusionComplete?: () => void
  initialCardId?: string | null
}

export function CardFusionWorkbench({ onFusionComplete, initialCardId }: CardFusionWorkbenchProps) {
  const { player, refreshPlayer } = useAuth()

  const [loading, setLoading] = useState(true)
  const [fusibleGroups, setFusibleGroups] = useState<FusibleCardGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<FusibleCardGroup | null>(null)
  const [baseCopyId, setBaseCopyId] = useState<string>('')
  const [targetLevel, setTargetLevel] = useState<number>(1)
  const [fusionConfig, setFusionConfig] = useState<FusionConfig>(DEFAULT_FUSION_CONFIG)

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [rarityFilter, setRarityFilter] = useState<string>('all')

  // Execution & UI state
  const [isFusing, setIsFusing] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [successAnimation, setSuccessAnimation] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [historyLogs, setHistoryLogs] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [mobileTab, setMobileTab] = useState<'cards' | 'workbench'>('workbench')

  useEffect(() => {
    loadSettingsAndCards()
  }, [player?.id])

  const loadSettingsAndCards = async () => {
    if (!player?.id) return
    setLoading(true)
    try {
      // 1. Load active game settings for fusion
      const { data: settingsData } = await supabase
        .from('game_settings')
        .select('*')
        .eq('category', 'fusion')

      const cfg: FusionConfig = { ...DEFAULT_FUSION_CONFIG }
      if (settingsData && settingsData.length > 0) {
        settingsData.forEach(s => {
          if (s.key === 'enabled') cfg.enabled = s.value === true || s.value === 'true'
          if (s.key === 'max_level') cfg.maxLevel = Number(s.value) || 5
          if (s.key === 'bonus_hp_percent') cfg.bonusHpPercent = Number(s.value) || 8
          if (s.key === 'bonus_atk_percent') cfg.bonusAtkPercent = Number(s.value) || 7
          if (s.key === 'bonus_def_percent') cfg.bonusDefPercent = Number(s.value) || 6
          if (s.key === 'bonus_speed') cfg.bonusSpeed = Number(s.value) || 2
          if (s.key === 'bonus_crit_rate') cfg.bonusCritRate = Number(s.value) || 1
          if (s.key === 'bonus_shield_heal_percent') cfg.bonusShieldHealPercent = Number(s.value) || 5
          if (s.key.startsWith('copies_level_')) {
            const lvl = Number(s.key.replace('copies_level_', ''))
            cfg.copiesPerLevel[lvl] = Number(s.value) || 1
          }
        })
      }
      setFusionConfig(cfg)

      // 2. Fetch fusible cards via RPC
      const { data, error } = await supabase.rpc('get_player_fusible_cards', {
        p_player_id: player.id
      })

      if (error) throw error

      const groups: FusibleCardGroup[] = Array.isArray(data) ? data : []
      setFusibleGroups(groups)

      // Auto-select initial card or first card
      if (groups.length > 0) {
        let current = groups[0]
        if (initialCardId) {
          const match = groups.find(g => g.card_id === initialCardId)
          if (match) current = match
        } else if (selectedGroup) {
          const match = groups.find(g => g.card_id === selectedGroup.card_id)
          if (match) current = match
        }

        setSelectedGroup(current)
        if (current.copies.length > 0) {
          setBaseCopyId(current.copies[0].id)
          const baseFusion = current.copies[0].fusion_level || 0
          const initialTarget = Math.min(cfg.maxLevel, baseFusion + 1)
          setTargetLevel(initialTarget)
        }
      } else {
        setSelectedGroup(null)
        setMobileTab('cards')
      }
    } catch (err: any) {
      console.error('Failed to load fusible cards:', err)
      toast.error('فشل تحميل البطاقات القابلة للدمج')
    } finally {
      setLoading(false)
    }
  }

  // Manual duplicate selection state
  const [manualSelectionOpen, setManualSelectionOpen] = useState(false)
  const [customSelectedIds, setCustomSelectedIds] = useState<string[]>([])

  const loadHistory = async () => {
    if (!player?.id) return
    setLoadingHistory(true)
    try {
      const { data, error } = await supabase.rpc('get_player_fusion_history', {
        p_player_id: player.id
      })

      if (!error && Array.isArray(data)) {
        setHistoryLogs(data)
      } else {
        const { data: tableData } = await supabase
          .from('card_fusions_log')
          .select(`
            *,
            card:cards(id, name, element, rarity, image_path, title)
          `)
          .eq('player_id', player.id)
          .order('created_at', { ascending: false })
          .limit(20)
        setHistoryLogs(tableData || [])
      }
    } catch (err: any) {
      console.error('Failed to load fusion history:', err)
      toast.error('فشل تحميل سجل الدمج')
    } finally {
      setLoadingHistory(false)
    }
  }

  // Selected base copy
  const selectedBaseCopy = useMemo(() => {
    if (!selectedGroup) return null
    return selectedGroup.copies.find(c => c.id === baseCopyId) || selectedGroup.copies[0] || null
  }, [selectedGroup, baseCopyId])

  // Filtered available duplicates to consume (excluding the selected base card)
  // Sorted: non-favorite first, lower evolution level first, lower serial first
  const availableDuplicates = useMemo(() => {
    if (!selectedGroup || !selectedBaseCopy) return []
    return selectedGroup.copies
      .filter(c => c.id !== selectedBaseCopy.id)
      .sort((a, b) => {
        if (a.is_favorite !== b.is_favorite) return a.is_favorite ? 1 : -1
        if (a.evolution_level !== b.evolution_level) return a.evolution_level - b.evolution_level
        if (a.fusion_level !== b.fusion_level) return a.fusion_level - b.fusion_level
        return a.serial_number - b.serial_number
      })
  }, [selectedGroup, selectedBaseCopy])

  const currentFusionLevel = selectedBaseCopy?.fusion_level || 0
  const isMaxLevel = currentFusionLevel >= fusionConfig.maxLevel

  // Calculation for target level and required copies
  const requiredCopies = useMemo(() => {
    if (isMaxLevel || targetLevel <= currentFusionLevel) return 0
    return getRequiredCopiesForTargetLevel(currentFusionLevel, targetLevel, fusionConfig)
  }, [currentFusionLevel, targetLevel, fusionConfig, isMaxLevel])

  const canAffordCopies = availableDuplicates.length >= requiredCopies && requiredCopies > 0

  // Stat comparisons
  const currentStats = useMemo(() => {
    if (!selectedGroup || !selectedBaseCopy) return null
    return calculateCardStats(
      selectedGroup.stats,
      selectedBaseCopy.evolution_level || 1,
      currentFusionLevel,
      fusionConfig
    )
  }, [selectedGroup, selectedBaseCopy, currentFusionLevel, fusionConfig])

  const projectedStats = useMemo(() => {
    if (!selectedGroup || !selectedBaseCopy) return null
    return calculateCardStats(
      selectedGroup.stats,
      selectedBaseCopy.evolution_level || 1,
      targetLevel,
      fusionConfig
    )
  }, [selectedGroup, selectedBaseCopy, targetLevel, fusionConfig])

  // Highest possible fusion level with currently owned copies
  const maxPossible = useMemo(() => {
    return calculateReachableFusionLevel(
      availableDuplicates.length,
      currentFusionLevel,
      fusionConfig
    )
  }, [availableDuplicates.length, currentFusionLevel, fusionConfig])

  // Effective copies to consume: either custom chosen or auto-picked (safe non-favorite first)
  const effectiveCopiesToConsume = useMemo(() => {
    if (manualSelectionOpen && customSelectedIds.length > 0) {
      return customSelectedIds
    }
    const safeDuplicates = availableDuplicates.filter(c => !c.is_favorite)
    const candidates = safeDuplicates.length >= requiredCopies ? safeDuplicates : availableDuplicates
    return candidates.slice(0, requiredCopies).map(c => c.id)
  }, [manualSelectionOpen, customSelectedIds, availableDuplicates, requiredCopies])

  // Toggle custom card selection
  const toggleSelectDuplicate = (id: string, isFav: boolean) => {
    if (isFav) {
      toast.error('هذه النسخة محمية كمفضلة! يرجى إلغاء تمييزها أولاً من قائمة بطاقاتك.')
      return
    }
    setCustomSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id)
      } else {
        if (prev.length >= requiredCopies) {
          toast.error(`لقد اخترت بالفعل ${requiredCopies} نسخ للوصول إلى Lv.${targetLevel}`)
          return prev
        }
        return [...prev, id]
      }
    })
  }

  // Handle Level Selection
  const handleSelectTargetLevel = (lvl: number) => {
    if (lvl <= currentFusionLevel || lvl > fusionConfig.maxLevel) return
    setTargetLevel(lvl)
    setCustomSelectedIds([]) // Reset manual pick when target level changes
  }

  // Step copies up/down
  const handleStepCopies = (delta: number) => {
    if (delta > 0) {
      if (targetLevel < maxPossible.maxTargetLevel) {
        setTargetLevel(targetLevel + 1)
        setCustomSelectedIds([])
      }
    } else {
      if (targetLevel > currentFusionLevel + 1) {
        setTargetLevel(targetLevel - 1)
        setCustomSelectedIds([])
      }
    }
  }

  // Execute Card Fusion
  const handleExecuteFusion = async () => {
    if (!player?.id || !selectedBaseCopy || !selectedGroup) return
    if (!canAffordCopies) {
      toast.error(`تحتاج إلى ${requiredCopies} نسخ مكررة على الأقل للترقية إلى Lv.${targetLevel}`)
      return
    }

    if (effectiveCopiesToConsume.length !== requiredCopies) {
      toast.error(`يجب تحديد ${requiredCopies} نسخ بالضبط للارتقاء إلى Lv.${targetLevel}`)
      return
    }

    // Safety check against consuming favorites
    const hasFavorite = availableDuplicates.some(
      c => effectiveCopiesToConsume.includes(c.id) && c.is_favorite
    )
    if (hasFavorite) {
      toast.error('إحدى النسخ المحددة محمية كمفضلة! يرجى إلغاء تمييزها كمفضلة أولاً.')
      return
    }

    setIsFusing(true)
    setConfirmModalOpen(false)

    try {
      const { data, error } = await supabase.rpc('execute_card_fusion', {
        p_player_id: player.id,
        p_base_player_card_id: selectedBaseCopy.id,
        p_consumed_player_card_ids: effectiveCopiesToConsume
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشلت عملية الدمج')

      setLastResult(data)
      setSuccessAnimation(true)
      setCustomSelectedIds([])
      toast.success(data.message || `تم دمج البطاقات بنجاح والارتقاء إلى Lv.${data.new_fusion_level}! ✨`)

      // Refresh player state and card lists
      await refreshPlayer()
      await loadSettingsAndCards()
      if (onFusionComplete) onFusionComplete()

      // Reset animation after 3.5s
      setTimeout(() => {
        setSuccessAnimation(false)
      }, 3500)
    } catch (err: any) {
      console.error('Card Fusion Error:', err)
      toast.error(err.message || 'حدث خطأ أثناء تنفيذ عملية الدمج')
    } finally {
      setIsFusing(false)
    }
  }

  // Filter groups
  const filteredGroups = useMemo(() => {
    return fusibleGroups.filter(g => {
      const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.title && g.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (g.subtitle && g.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchRarity = rarityFilter === 'all' || g.rarity === rarityFilter
      return matchSearch && matchRarity
    })
  }, [fusibleGroups, searchQuery, rarityFilter])

  const currentBadge = getFusionBadge(currentFusionLevel)
  const targetBadge = getFusionBadge(targetLevel)

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner / System Notice */}
      {!fusionConfig.enabled && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
          <AlertTriangle size={20} className="shrink-0" />
          <span>تنبيه: نظام دمج البطاقات معطل حاليًا من قبل إدارة اللعبة لأغراض الصيانة.</span>
        </div>
      )}

      {/* Mobile Tab Switcher (< lg screens) */}
      <div className="lg:hidden flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg">
        <button
          type="button"
          onClick={() => setMobileTab('cards')}
          className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'cards'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers size={14} />
          قائمة البطاقات ({fusibleGroups.length})
        </button>
        <button
          type="button"
          disabled={!selectedGroup}
          onClick={() => setMobileTab('workbench')}
          className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'workbench'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : !selectedGroup
              ? 'opacity-40 text-slate-600 cursor-not-allowed'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles size={14} />
          طاولة الدمج {selectedGroup ? `(${selectedGroup.name})` : ''}
        </button>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Duplicate Cards List (4 cols) */}
        <div className={`lg:col-span-4 space-y-4 ${mobileTab === 'workbench' ? 'hidden lg:block' : 'block'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Layers size={16} className="text-amber-400" />
              البطاقات القابلة للدمج ({fusibleGroups.length})
            </h3>
            <button
              onClick={() => {
                setShowHistory(!showHistory)
                if (!showHistory) loadHistory()
              }}
              className="text-xs text-primary-400 hover:text-primary-300 font-bold flex items-center gap-1 transition-colors"
            >
              <History size={14} />
              {showHistory ? 'إخفاء السجل' : 'سجل العمليات'}
            </button>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="ابحث باسم البطاقة أو الشخصية..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
              {['all', 'mythic', 'legendary', 'epic', 'rare'].map(r => (
                <button
                  key={r}
                  onClick={() => setRarityFilter(r)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                    rarityFilter === r
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {r === 'all' ? 'الكل' : (RARITY_LABELS[r]?.label || r)}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List Scrollable */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-amber-400" />
                <span>جارٍ فحص مخزون البطاقات المكررة...</span>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-8 text-center glass-card rounded-2xl border border-slate-800 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
                  <Layers size={20} />
                </div>
                <h4 className="text-xs font-bold text-white">لا توجد بطاقات مكررة متاحة</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  يجب أن تمتلك نسختين أو أكثر من نفس البطاقة لتتمكن من دمجها وتقليل ازدحام المخزون.
                </p>
              </div>
            ) : (
              filteredGroups.map(group => {
                const isSelected = selectedGroup?.card_id === group.card_id
                const rarityStyle = RARITY_LABELS[group.rarity] || { label: group.rarity, color: '#94a3b8' }
                const topFusion = group.max_fusion_level || 0

                return (
                  <motion.div
                    key={group.card_id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => {
                      setSelectedGroup(group)
                      setMobileTab('workbench')
                      if (group.copies.length > 0) {
                        setBaseCopyId(group.copies[0].id)
                        const bf = group.copies[0].fusion_level || 0
                        setTargetLevel(Math.min(fusionConfig.maxLevel, bf + 1))
                      }
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-slate-900 border-amber-500/50 shadow-glow-amber'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-14 rounded-xl overflow-hidden bg-black relative shrink-0 border border-slate-700">
                        <img
                          src={group.image_path}
                          alt={group.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] font-black text-center text-amber-300 py-0.5">
                          x{group.copy_count}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-white truncate">{group.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ color: rarityStyle.color, background: `${rarityStyle.color}15` }}
                          >
                            {rarityStyle.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{group.element}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      {topFusion > 0 ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          ✦ Lv.{topFusion}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400">
                          Resonance 0
                        </span>
                      )}
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Fusion Workbench & Stats (8 cols) */}
        <div className={`lg:col-span-8 ${mobileTab === 'cards' ? 'hidden lg:block' : 'block'}`}>
          {showHistory ? (
            /* Fusion History View */
            <div className="glass-card rounded-3xl p-4 sm:p-6 border border-slate-700/60 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <History size={18} className="text-amber-400" />
                  سجل عمليات دمج البطاقات المكررة
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="btn-secondary py-1.5 px-3 text-xs"
                >
                  العودة لمنصة الدمج
                </button>
              </div>

              {loadingHistory ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <Loader2 size={24} className="animate-spin text-amber-400 mx-auto mb-2" />
                  تحميل سجل العمليات...
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  لم تقم بأي عمليات دمج سابقة حتى الآن.
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                  {historyLogs.map(log => (
                    <div
                      key={log.id}
                      className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 rounded-lg overflow-hidden bg-black shrink-0 border border-slate-700">
                          <img src={log.card?.image_path} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h5 className="font-black text-white text-sm">{log.card?.name || 'Resonance Card'}</h5>
                          <span className="text-slate-400 text-[11px]">
                            استهلاك {log.copies_consumed} نسخ مكررة (الأرقام: #{log.consumed_serials?.join(', #')})
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-400">
                            Lv.{log.previous_fusion_level}
                          </span>
                          <ChevronRight size={14} className="text-amber-400 rotate-180" />
                          <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            ✦ Lv.{log.new_fusion_level}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          {new Date(log.created_at).toLocaleString('ar-EG')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selectedGroup && selectedBaseCopy ? (
            /* Workbench View */
            <div className="glass-card rounded-3xl p-4 sm:p-6 border border-slate-700/60 space-y-5 sm:space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-purple-500 to-indigo-600" />

              {/* Mobile Back / Change Card Button (< lg) */}
              <div className="lg:hidden flex items-center justify-between pb-3 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setMobileTab('cards')}
                  className="btn-secondary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 text-amber-400 border-amber-500/30"
                >
                  <ArrowLeft size={13} className="rotate-180" />
                  اختيار بطاقة أخرى
                </button>
                <span className="text-[11px] text-slate-400 font-mono">
                  #{selectedBaseCopy.serial_number}
                </span>
              </div>

              {/* Selected Card Overview Header */}
              <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-slate-800">
                <div className="w-24 h-32 rounded-2xl overflow-hidden bg-black/60 border border-amber-500/30 shadow-glow-amber relative shrink-0">
                  <img
                    src={selectedGroup.image_path}
                    alt={selectedGroup.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-black/80 text-amber-300">
                    #{selectedBaseCopy.serial_number}
                  </span>
                </div>

                <div className="text-center sm:text-right space-y-1.5 flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {RARITY_LABELS[selectedGroup.rarity]?.label || selectedGroup.rarity}
                    </span>
                    {selectedGroup.element && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800/80 border border-slate-700/80 text-white">
                        <ElementIcon element={selectedGroup.element} size={13} />
                        {selectedGroup.element}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">
                      الترقية: Lv.{selectedBaseCopy.evolution_level || 1}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white">{selectedGroup.name}</h2>
                  <p className="text-xs text-slate-400">{selectedGroup.subtitle || selectedGroup.title || 'Battle Resonance'}</p>

                  <div className="pt-1 flex items-center justify-center sm:justify-start gap-3 text-xs">
                    <span className="text-slate-400">
                      إجمالي النسخ المملوكة: <strong className="text-white font-mono">{selectedGroup.copy_count}</strong>
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="text-amber-400">
                      متاحة للدمج: <strong className="font-mono">{availableDuplicates.length}</strong>
                    </span>
                  </div>
                </div>

                {/* Base Card Switcher */}
                <div className="w-full sm:w-auto bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs space-y-1.5 shrink-0">
                  <label className="text-slate-400 font-bold block">اختيار النسخة الأساسية:</label>
                  <select
                    value={selectedBaseCopy.id}
                    onChange={e => {
                      setBaseCopyId(e.target.value)
                      const copy = selectedGroup.copies.find(c => c.id === e.target.value)
                      if (copy) {
                        setTargetLevel(Math.min(fusionConfig.maxLevel, (copy.fusion_level || 0) + 1))
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:outline-none"
                  >
                    {selectedGroup.copies.map(c => (
                      <option key={c.id} value={c.id}>
                        نسخة #{c.serial_number} (دمج Lv.{c.fusion_level || 0} - ترقية Lv.{c.evolution_level || 1})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500">
                    النسخة الأساسية هي التي ستبقى في مخزونك وترتفع قوتها.
                  </p>
                </div>
              </div>

              {/* Fusion Level Selector & Progress */}
              <div className="py-2 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-400" />
                      تحديد مستوى الدمج المستهدف:
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      المستوى الحالي: {currentBadge.label} {currentBadge.stars}
                    </span>
                  </div>

                  {/* Quick Max Button */}
                  {maxPossible.maxTargetLevel > currentFusionLevel && (
                    <button
                      onClick={() => setTargetLevel(maxPossible.maxTargetLevel)}
                      className="btn-secondary py-1 px-3 text-xs text-amber-400 border-amber-500/30 hover:border-amber-400 flex items-center gap-1.5"
                    >
                      <Zap size={14} />
                      أقصى دمج متاح (Lv.{maxPossible.maxTargetLevel})
                    </button>
                  )}
                </div>

                {/* Level Buttons Grid */}
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5].map(lvl => {
                    const isPassed = lvl <= currentFusionLevel
                    const isSelected = lvl === targetLevel
                    const isReachable = lvl <= maxPossible.maxTargetLevel
                    const reqCopiesForThis = getRequiredCopiesForTargetLevel(currentFusionLevel, lvl, fusionConfig)

                    return (
                      <button
                        key={lvl}
                        disabled={isPassed || lvl > fusionConfig.maxLevel}
                        onClick={() => handleSelectTargetLevel(lvl)}
                        className={`p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 sm:gap-1 relative ${
                          isPassed
                            ? 'bg-slate-900/40 border-slate-800/60 opacity-40 cursor-not-allowed text-slate-500'
                            : isSelected
                            ? 'bg-gradient-to-b from-amber-500/25 to-slate-900 border-amber-500 shadow-glow-amber text-white'
                            : isReachable
                            ? 'bg-slate-900/80 border-slate-700 hover:border-amber-500/40 text-slate-300'
                            : 'bg-slate-900/30 border-slate-800 text-slate-600 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-[11px] sm:text-xs font-black">
                          Lv.{lvl}
                        </span>
                        <span className="text-[8px] sm:text-[10px] text-amber-300/80 font-mono">
                          {'✦'.repeat(lvl)}
                        </span>
                        {!isPassed && (
                          <span className={`text-[9px] sm:text-[10px] font-bold ${isReachable ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {reqCopiesForThis} نسخ
                          </span>
                        )}
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                            ✓
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Interactive Copies Counter / Stepper */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sliders size={14} className="text-amber-400" />
                      تحديد عدد النسخ المراد استهلاكها:
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      يمكنك تعديل عدد النسخ بالزيادة أو النقصان، أو اختيار الرتبة المستهدفة مباشرة بالأعلى.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
                    <button
                      type="button"
                      disabled={targetLevel <= currentFusionLevel + 1 || isFusing}
                      onClick={() => handleStepCopies(-1)}
                      className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black flex items-center justify-center transition-colors border border-slate-700"
                      title="تقليل عدد النسخ والمستوى"
                    >
                      <Minus size={15} />
                    </button>

                    <div className="px-4 py-1.5 rounded-xl bg-slate-950 border border-amber-500/30 text-center min-w-[90px] shadow-inner">
                      <span className="font-mono text-base font-black text-amber-400 block leading-tight">
                        {requiredCopies}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold block">نسخ مستهلكة</span>
                    </div>

                    <button
                      type="button"
                      disabled={targetLevel >= maxPossible.maxTargetLevel || isFusing}
                      onClick={() => handleStepCopies(1)}
                      className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black flex items-center justify-center transition-colors shadow-glow-amber"
                      title="زيادة عدد النسخ والمستوى"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                {/* Optional Manual Duplicate Picker Accordion */}
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setManualSelectionOpen(!manualSelectionOpen)}
                    className="w-full p-3 flex items-center justify-between text-slate-300 hover:text-white transition-colors"
                  >
                    <span className="font-bold flex items-center gap-2">
                      <Layers size={14} className="text-amber-400" />
                      اختيار النسخ المحددة للاستهلاك يدويًا بالأرقام التسلسلية (اختياري)
                    </span>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <span>{manualSelectionOpen ? 'إخفاء القائمة' : `${availableDuplicates.length} نسخ متوفرة`}</span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${manualSelectionOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {manualSelectionOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="p-3 pt-0 border-t border-slate-800/60 space-y-2"
                      >
                        <p className="text-[10px] text-slate-400">
                          حدد {requiredCopies} نسخ لاستهلاكها في الدمج. البطاقات المحمية كمفضلة محجوبة من الاستهلاك تلقائيًا.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                          {availableDuplicates.map(copy => {
                            const isPicked = effectiveCopiesToConsume.includes(copy.id)
                            return (
                              <div
                                key={copy.id}
                                onClick={() => toggleSelectDuplicate(copy.id, copy.is_favorite)}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                  copy.is_favorite
                                    ? 'bg-rose-950/20 border-rose-500/30 opacity-60 cursor-not-allowed'
                                    : isPicked
                                    ? 'bg-amber-500/20 border-amber-500/60 shadow-glow-amber text-white'
                                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                                }`}
                              >
                                <div className="min-w-0">
                                  <span className="font-mono font-black text-xs block text-amber-300">
                                    #{copy.serial_number}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    Lv.{copy.evolution_level || 1} {copy.fusion_level ? `✦F${copy.fusion_level}` : ''}
                                  </span>
                                </div>

                                {copy.is_favorite ? (
                                  <span className="text-rose-400 text-[10px] flex items-center gap-0.5" title="بطاقة مفضلة محمية">
                                    <Lock size={12} />
                                  </span>
                                ) : (
                                  <div className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                                    isPicked ? 'bg-amber-400 border-amber-400 text-slate-950 font-black' : 'border-slate-600'
                                  }`}>
                                    {isPicked && '✓'}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Copies Breakdown Alert */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <Layers size={16} />
                    </div>
                    <div>
                      <span className="text-slate-300 font-bold block">
                        تفاصيل استهلاك النسخ:
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        ستستهلك <strong className="text-amber-400 font-mono">{requiredCopies}</strong> نسخ مكررة من مخزونك.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">المتوفر:</span>
                      <strong className="text-white">{availableDuplicates.length}</strong>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 rotate-180" />
                    <div>
                      <span className="text-slate-500 block text-[10px]">المستهلك:</span>
                      <strong className="text-amber-400">-{requiredCopies}</strong>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 rotate-180" />
                    <div>
                      <span className="text-slate-500 block text-[10px]">المتبقي:</span>
                      <strong className="text-emerald-400">{availableDuplicates.length - requiredCopies}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Comparison Grid */}
              {currentStats && projectedStats && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Swords size={14} className="text-amber-400" />
                    مقارنة الإحصائيات قبل وبعد الدمج في القتال الفعلي:
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-xs">
                    {/* HP */}
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                      <div className="flex items-center gap-1.5 text-red-400">
                        <Heart size={14} className="shrink-0" />
                        <span className="font-bold text-[11px] sm:text-xs">HP (الصحة):</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-slate-400 font-bold">{currentStats.hp}</span>
                        {!isMaxLevel && (
                          <>
                            <ChevronRight size={12} className="text-emerald-400 rotate-180 shrink-0" />
                            <span className="text-emerald-400 font-black">
                              {projectedStats.hp}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ATK */}
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <Swords size={14} className="shrink-0" />
                        <span className="font-bold text-[11px] sm:text-xs">ATK (الهجوم):</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-slate-400 font-bold">{currentStats.atk}</span>
                        {!isMaxLevel && (
                          <>
                            <ChevronRight size={12} className="text-emerald-400 rotate-180 shrink-0" />
                            <span className="text-emerald-400 font-black">
                              {projectedStats.atk}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* DEF */}
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                      <div className="flex items-center gap-1.5 text-blue-400">
                        <Shield size={14} className="shrink-0" />
                        <span className="font-bold text-[11px] sm:text-xs">DEF (الدفاع):</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-slate-400 font-bold">{currentStats.def}</span>
                        {!isMaxLevel && (
                          <>
                            <ChevronRight size={12} className="text-emerald-400 rotate-180 shrink-0" />
                            <span className="text-emerald-400 font-black">
                              {projectedStats.def}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* SPEED */}
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Gauge size={14} className="shrink-0" />
                        <span className="font-bold text-[11px] sm:text-xs">السرعة:</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-slate-400 font-bold">{currentStats.speed}</span>
                        {!isMaxLevel && (
                          <>
                            <ChevronRight size={12} className="text-emerald-400 rotate-180 shrink-0" />
                            <span className="text-emerald-400 font-black">
                              {projectedStats.speed}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* CRIT RATE */}
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                      <div className="flex items-center gap-1.5 text-purple-400">
                        <Zap size={14} className="shrink-0" />
                        <span className="font-bold text-[11px] sm:text-xs">CRIT:</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-slate-400 font-bold">{currentStats.crit_rate}%</span>
                        {!isMaxLevel && (
                          <>
                            <ChevronRight size={12} className="text-emerald-400 rotate-180 shrink-0" />
                            <span className="text-emerald-400 font-black">
                              {projectedStats.crit_rate}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* SHIELD / HEAL */}
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                      <div className="flex items-center gap-1.5 text-teal-400">
                        <Award size={14} className="shrink-0" />
                        <span className="font-bold text-[11px] sm:text-xs">دروع وشفاء:</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-slate-400 font-bold">
                          +{Math.round(currentFusionLevel * fusionConfig.bonusShieldHealPercent)}%
                        </span>
                        {!isMaxLevel && (
                          <>
                            <ChevronRight size={12} className="text-emerald-400 rotate-180 shrink-0" />
                            <span className="text-emerald-400 font-black">
                              +{Math.round(targetLevel * fusionConfig.bonusShieldHealPercent)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400 leading-relaxed text-center sm:text-right w-full sm:w-auto">
                  {isMaxLevel ? (
                    <span className="text-emerald-400 font-bold flex items-center justify-center sm:justify-start gap-1.5">
                      <CheckCircle2 size={16} /> وصلت هذه البطاقة إلى أقصى مستوى دمج ممكن (Lv.{fusionConfig.maxLevel}) ✨
                    </span>
                  ) : !canAffordCopies ? (
                    <span className="text-rose-400 font-medium">
                      ⚠️ عدد النسخ المكررة غير كافٍ. تحتاج {requiredCopies - availableDuplicates.length} نسخ إضافية للوصول إلى Lv.{targetLevel}.
                    </span>
                  ) : (
                    <span>
                      جاهز للتنفيذ: سيتم استهلاك <strong className="text-amber-400 font-mono">{requiredCopies}</strong> نسخ لترقية البطاقة إلى{' '}
                      <strong className="text-white font-mono">Lv.{targetLevel}</strong>.
                    </span>
                  )}
                </div>

                <button
                  disabled={isFusing || isMaxLevel || !canAffordCopies || !fusionConfig.enabled}
                  onClick={() => setConfirmModalOpen(true)}
                  className={`w-full sm:w-auto btn-primary px-8 py-3 text-sm font-black flex items-center justify-center gap-2 shadow-glow-amber ${
                    isFusing || isMaxLevel || !canAffordCopies || !fusionConfig.enabled
                      ? 'opacity-50 cursor-not-allowed shadow-none'
                      : ''
                  }`}
                >
                  {isFusing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      جارٍ دمج البطاقات...
                    </>
                  ) : isMaxLevel ? (
                    'أقصى رتبة مكتملة ✨'
                  ) : (
                    <>
                      <Sparkles size={16} />
                      تأكيد دمج {requiredCopies} نسخ
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-16 text-center border border-slate-800 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Layers size={28} />
              </div>
              <h3 className="text-base font-black text-white">اختر بطاقة مكررة من القائمة الجانبية</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                اختر البطاقة التي تمتلك منها نسخاً زائدة لفتح طاولة الدمج ومقارنة قوة الإحصائيات قبل وبعد الدمج.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModalOpen && selectedGroup && selectedBaseCopy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-card rounded-3xl p-5 sm:p-7 max-w-sm sm:max-w-md w-full border border-amber-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">تأكيد استهلاك النسخ وإتمام الدمج</h3>
                  <p className="text-xs text-slate-400">عملية غير قابلة للإلغاء بعد التنفيذ</p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>البطاقة الأساسية المستهدفة:</span>
                  <span className="font-bold text-white">
                    {selectedGroup.name} (#{selectedBaseCopy.serial_number})
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>مستوى الدمج بعد العملية:</span>
                  <span className="font-black text-amber-400">
                    Lv.{targetLevel} {'✦'.repeat(targetLevel)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>عدد النسخ التي سيتم استهلاكها:</span>
                  <span className="font-black text-rose-400 font-mono">
                    {requiredCopies} نسخ
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>الأرقام التسلسلية المستهلكة:</span>
                  <span className="font-mono text-amber-300 font-bold truncate max-w-[160px]">
                    {effectiveCopiesToConsume.map(id => {
                      const item = availableDuplicates.find(d => d.id === id)
                      return item ? `#${item.serial_number}` : ''
                    }).filter(Boolean).join(', ') || 'تلقائي'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>النسخ المتبقية في المخزون:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {availableDuplicates.length - requiredCopies} نسخ
                  </span>
                </div>
              </div>

              <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                💡 سيتم حذف النسخ المستهلكة من مخزونك بصورة ذرية آمنة على السيرفر، مع الاحتفاظ برقم تسلسلي للبطاقة الأساسية ورفع إحصائياتها فوراً.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  className="btn-secondary flex-1 py-2.5 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleExecuteFusion}
                  className="btn-primary flex-1 py-2.5 text-xs font-black shadow-glow-amber"
                >
                  تأكيد واستهلاك النسخ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Celebration Modal - Centered Viewport Overlay */}
      <AnimatePresence>
        {successAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="glass-card rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 border border-amber-500/40 shadow-glow-amber relative"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-purple-500 to-indigo-600 p-1 mx-auto shadow-glow-amber">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-300">
                  <Sparkles size={36} />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                اكتمل الدمج بنجاح
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                تم الارتقاء برتبة الدمج إلى{' '}
                <span className="text-amber-300 font-black font-mono">Lv.{lastResult?.new_fusion_level}</span> ورفع جميع إحصائيات المعركة!
              </p>
              <button
                type="button"
                onClick={() => setSuccessAnimation(false)}
                className="btn-primary w-full py-2.5 text-xs font-bold shadow-glow-amber"
              >
                متابعة
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
