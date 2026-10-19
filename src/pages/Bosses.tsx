import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Trophy, Shield, Zap, Sparkles, AlertCircle, RefreshCw, Eye, Skull, Lock, Gift } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { BossArena } from '../components/challenges/BossArena'
import { PlayerTitleBadge } from '../components/shared/PlayerTitleBadge'
import { calculateCardStats } from '../lib/cardStats'
import toast from 'react-hot-toast'

interface Boss {
  id: string
  name: string
  title: string
  avatar_url: string
  banner_url?: string
  description?: string
  difficulty: 'Hard' | 'Nightmare' | 'Abyssal' | 'Impossible'
  ai_level: 'Tactical' | 'Advanced' | 'Mastermind'
  theme_color?: string
  hp: number
  atk: number
  def: number
  spd: number
  crit_rate: number
  win_points: number
  first_blood_points: number
  exclusive_title_id?: string
  exclusive_card_id?: string
  deck_cards?: any[]
  is_active: boolean
  first_blood_player_id?: string
  reward_items?: any[]
  rewards?: any
}

export function BossesPage() {
  const { player, refreshProfile } = useAuth()
  const [bosses, setBosses] = useState<Boss[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null)
  const [activeBattleBoss, setActiveBattleBoss] = useState<Boss | null>(null)
  const [titlesMap, setTitlesMap] = useState<Record<string, any>>({})
  const [cardsMap, setCardsMap] = useState<Record<string, any>>({})
  const [playerCards, setPlayerCards] = useState<any[]>([])

  useEffect(() => {
    fetchBosses()
    if (player?.id) {
      loadPlayerCards()
    }
  }, [player?.id])

  const loadPlayerCards = async () => {
    if (!player?.id) return
    try {
      const { data } = await supabase
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

      if (data && data.length > 0) {
        const mapped = data.map((pc: any) => {
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
            image_path: c.image_path || '/characters/changli.webp',
            element: c.element || 'Fusion',
            rarity: c.rarity || 'common',
            stats: calcStats,
            raw_stats: c.stats,
            evolution_level: pc.evolution_level || 1,
            fusion_level: pc.fusion_level || 0,
            serial_number: pc.serial_number,
          }
        })
        setPlayerCards(mapped)
      }
    } catch (e) {
      console.warn('Error loading player cards in Bosses:', e)
    }
  }

  const fetchBosses = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bosses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      const normalized = (data || []).map((b: any) => ({
        ...b,
        hp: Number(b.stats?.hp ?? b.hp ?? 10000),
        atk: Number(b.stats?.atk ?? b.atk ?? 300),
        def: Number(b.stats?.def ?? b.def ?? 150),
        spd: Number(b.stats?.speed ?? b.spd ?? 100),
        crit_rate: Number(b.stats?.crit_rate ?? b.crit_rate ?? 20),
        win_points: Number(b.rewards?.points ?? b.win_points ?? 500),
        first_blood_points: Number(b.rewards?.first_blood_points ?? b.first_blood_points ?? 1000),
        banner_url: b.banner_url || b.cover_image_url || b.avatar_url,
        exclusive_title_id: b.exclusive_title_id || b.rewards?.exclusive_title_id,
        difficulty: b.difficulty || 'Nightmare',
        ai_level: b.ai_level || 'Advanced',
        reward_items: b.rewards?.items || [],
        deck: b.deck || [],
        deck_cards: b.deck || [],
      }))
      setBosses(normalized)

      // Fetch titles and cards for badge previews
      const { data: titlesData } = await supabase.from('titles').select('*')
      if (titlesData) {
        const map: Record<string, any> = {}
        titlesData.forEach(t => { map[t.id] = t })
        setTitlesMap(map)
      }

      const { data: cardsData } = await supabase.from('cards').select('id, name, rarity, element, image_path')
      if (cardsData) {
        const cMap: Record<string, any> = {}
        cardsData.forEach(c => { cMap[c.id] = c })
        setCardsMap(cMap)
      }
    } catch (err: any) {
      console.error('Failed to fetch bosses:', err)
      toast.error('فشل تحميل قائمة الزعماء')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Impossible':
        return { label: 'مستحيل (Impossible)', bg: 'bg-red-950/80 text-red-400 border-red-500/50' }
      case 'Abyssal':
        return { label: 'سحيق (Abyssal)', bg: 'bg-purple-950/80 text-purple-400 border-purple-500/50' }
      case 'Nightmare':
        return { label: 'كابوس (Nightmare)', bg: 'bg-amber-950/80 text-amber-400 border-amber-500/50' }
      default:
        return { label: 'صعب (Hard)', bg: 'bg-blue-950/80 text-blue-400 border-blue-500/50' }
    }
  }

  const getAiBadge = (ai: string) => {
    switch (ai) {
      case 'Mastermind':
        return { label: 'عبقري (Mastermind)', color: 'text-rose-400' }
      case 'Advanced':
        return { label: 'متقدم (Advanced)', color: 'text-amber-400' }
      default:
        return { label: 'تكتيكي (Tactical)', color: 'text-emerald-400' }
    }
  }

  return (
    <div className="min-h-screen text-slate-100 pb-20 pt-20 px-3 sm:px-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 mb-8 border border-red-500/30 bg-gradient-to-r from-red-950/60 via-purple-950/40 to-slate-900/80 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40">
              <Skull size={14} className="animate-pulse" />
              الزعماء الأسطوريون (Legendary Bosses)
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              تحدَّ عمالقة عالم <span className="gradient-text-primary">WuWa</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              اختر تشكيلتك من بطاقة واحدة حتى 5 بطاقات، واجه ذكاء اصطناعي متطور في حلبة معارك مباشرة، واحصل على ألقاب حصرية ومكافآت أول انتصار (First Blood)!
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 border border-primary-500/40 flex items-center justify-center text-primary-400 font-black">
              {bosses.filter(b => b.is_active).length}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">الزعماء النشطون حالياً</div>
              <div className="text-sm font-bold text-white">تحديات يومية مفتوحة</div>
            </div>
          </div>
        </div>

        {/* Glow Accent */}
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl bg-red-600/20 pointer-events-none" />
      </div>

      {/* Bosses Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <RefreshCw size={36} className="text-primary-400 animate-spin" />
          <p className="text-slate-400 text-sm">جاري استدعاء الزعماء الأسطوريين...</p>
        </div>
      ) : bosses.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-4">
          <Skull size={48} className="mx-auto text-slate-500" />
          <h3 className="text-xl font-bold text-white">لا يوجد زعماء نشطون حالياً</h3>
          <p className="text-slate-400 text-sm">سيقوم المشرف بإطلاق زعماء أسطوريين قريباً، تفقد الصفحة لاحقاً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bosses.map((boss) => {
            const diff = getDifficultyBadge(boss.difficulty)
            const ai = getAiBadge(boss.ai_level)
            const exclusiveTitle = boss.exclusive_title_id ? titlesMap[boss.exclusive_title_id] : null

            return (
              <motion.div
                key={boss.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="group relative rounded-3xl overflow-hidden border border-slate-700/60 bg-slate-900/70 hover:border-red-500/50 transition-all shadow-xl flex flex-col"
              >
                {/* Banner / Avatar Header */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={boss.banner_url || boss.avatar_url || '/logo.jpeg'}
                    alt={boss.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                  {/* Difficulty & Status badges */}
                  <div className="absolute top-3 right-3 flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${diff.bg}`}>
                      {diff.label}
                    </span>
                    {!boss.is_active && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        معطل
                      </span>
                    )}
                  </div>

                  {/* AI Badge */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 border border-white/10 backdrop-blur-md">
                    <Zap size={12} className={ai.color} />
                    <span className={ai.color}>ذكاء: {ai.label}</span>
                  </div>
                </div>

                {/* Boss Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs text-primary-400 font-semibold tracking-wide">
                      {boss.title || 'زعيم أسطوري'}
                    </div>
                    <h3 className="text-xl font-black text-white mt-0.5 group-hover:text-red-400 transition-colors">
                      {boss.name}
                    </h3>
                    <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {boss.description || 'زعيم مرعب يمتلك قدرات خارقة وذكاء تكتيكي متطور.'}
                    </p>
                  </div>

                  {/* Boss Stats Snapshot */}
                  <div className="grid grid-cols-4 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-center text-xs">
                    <div>
                      <div className="text-slate-500 text-[10px]">الصحة</div>
                      <div className="font-bold text-emerald-400 mt-0.5">{(boss.hp || 10000).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">الهجوم</div>
                      <div className="font-bold text-red-400 mt-0.5">{boss.atk}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">الدفاع</div>
                      <div className="font-bold text-blue-400 mt-0.5">{boss.def}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">السرعة</div>
                      <div className="font-bold text-amber-400 mt-0.5">{boss.spd}</div>
                    </div>
                  </div>

                  {/* Victory Rewards Display */}
                  <div className="space-y-2.5 bg-gradient-to-b from-red-950/30 to-slate-950/60 border border-amber-500/20 rounded-2xl p-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                      <span className="flex items-center gap-1.5">
                        <Trophy size={13} className="text-amber-400" />
                        مكافآت النصر المتاحة:
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {boss.reward_items?.length || 0} جوائز
                      </span>
                    </div>

                    {/* Points Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-[11px]">
                        +{boss.win_points} نقطة فوز
                      </span>
                      {boss.first_blood_points > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-[11px]">
                          +{boss.first_blood_points} First Blood
                        </span>
                      )}
                    </div>

                    {/* Custom Rewards Items (Cards & Titles) */}
                    {boss.reward_items && boss.reward_items.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                        {boss.reward_items.slice(0, 3).map((r: any, rIdx: number) => {
                          if (r.is_secret) {
                            return (
                              <div key={rIdx} className="p-1.5 rounded-xl bg-slate-900/80 border border-amber-500/20 flex items-center gap-2 text-xs">
                                <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-amber-400 shrink-0">
                                  🔒
                                </div>
                                <span className="text-[11px] font-black text-amber-300">مكافأة سرية غامضة ❓</span>
                                <span className="text-[9px] text-slate-400 mr-auto">تُكشف عند الفوز</span>
                              </div>
                            )
                          }

                          const isCard = r.type === 'card'
                          const card = isCard ? cardsMap[r.card_id] : null
                          const title = !isCard ? titlesMap[r.title_id] : null

                          let dropTag = 'مضمون'
                          let dropTagColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          if (r.drop_type === 'first_victory_only') {
                            dropTag = 'أول فوز'
                            dropTagColor = 'text-purple-300 bg-purple-500/10 border-purple-500/30'
                          } else if (r.drop_type === 'first_blood_only') {
                            dropTag = 'First Blood'
                            dropTagColor = 'text-red-400 bg-red-500/10 border-red-500/30'
                          } else if (r.drop_type === 'chance') {
                            dropTag = `فرصة ${r.drop_rate || 20}%`
                            dropTagColor = 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                          }

                          return (
                            <div key={rIdx} className="p-1.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                {isCard ? (
                                  <img
                                    src={card?.image_path || '/characters/changli.webp'}
                                    alt={card?.name}
                                    className="w-6 h-7 object-cover rounded-md border border-slate-700 shrink-0"
                                  />
                                ) : (
                                  <span className="text-sm shrink-0">{title?.icon || '👑'}</span>
                                )}
                                <span className="text-[11px] font-bold text-white truncate">
                                  {isCard ? (card?.name || 'بطاقة نادرة') : (title?.name_ar || 'لقب شرفي')}
                                </span>
                              </div>
                              <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold shrink-0 ${dropTagColor}`}>
                                {dropTag}
                              </span>
                            </div>
                          )
                        })}

                        {boss.reward_items.length > 3 && (
                          <div className="text-[10px] text-slate-400 text-center font-bold">
                            +{boss.reward_items.length - 3} جوائز أخرى إضافية!
                          </div>
                        )}
                      </div>
                    )}

                    {/* Legacy Title if not in items */}
                    {exclusiveTitle && (!boss.reward_items || !boss.reward_items.some((i: any) => i.title_id === boss.exclusive_title_id)) && (
                      <div className="pt-1 flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400 text-[11px]">لقب حصري:</span>
                        <PlayerTitleBadge title={exclusiveTitle} />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2">
                    <button
                      disabled={!boss.is_active}
                      onClick={() => setActiveBattleBoss(boss)}
                      className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                        boss.is_active
                          ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white hover:brightness-110 active:scale-[0.98]'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Swords size={18} />
                      تحدَّ الزعيم الآن
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Live Battle Arena Modal */}
      {activeBattleBoss && (
        <BossArena
          isOpen={true}
          boss={activeBattleBoss}
          currentUserId={player?.id}
          currentUsername={player?.username}
          playerCards={playerCards}
          onClose={() => {
            setActiveBattleBoss(null)
            refreshProfile?.()
          }}
          onVictory={() => {
            refreshProfile?.()
            fetchBosses()
          }}
        />
      )}
    </div>
  )
}
