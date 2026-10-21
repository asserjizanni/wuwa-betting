import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Skull, Plus, Edit2, Trash2, Eye, Shield, Zap, Trophy, Check, X, 
  RefreshCw, Sparkles, Layers, Award, Percent, HelpCircle, Lock,
  Search, Filter, ChevronDown, CheckCircle2, AlertCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { CardSelector } from '../shared/CardSelector'
import { PlayerTitleBadge } from '../shared/PlayerTitleBadge'
import { ImageUpload } from '../shared/ImageUpload'
import { getImageUrl } from '../../lib/utils'
import toast from 'react-hot-toast'

export interface BossRewardItem {
  id: string
  type: 'card' | 'title'
  card_id?: string | null
  title_id?: string | null
  drop_type: 'always' | 'first_victory_only' | 'first_blood_only' | 'chance'
  drop_rate?: number // 1 - 100
  quantity?: number // default 1
  max_claims_per_player?: number | null // null for unlimited, or 1
  is_secret?: boolean
}

interface BossRecord {
  id?: string
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
  deck_cards?: any[]
  is_active: boolean
  reward_items?: BossRewardItem[]
}

const RARITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  mythic: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },
  legendary: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' },
  epic: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  rare: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40' },
  common: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/40' },
}

export function AdminBosses() {
  const [bosses, setBosses] = useState<BossRecord[]>([])
  const [titles, setTitles] = useState<any[]>([])
  const [allCards, setAllCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBoss, setEditingBoss] = useState<BossRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deckModalOpen, setDeckModalOpen] = useState(false)

  // Sub-modal for configuring a Victory Reward Item
  const [rewardModalOpen, setRewardModalOpen] = useState(false)
  const [editingReward, setEditingReward] = useState<BossRewardItem | null>(null)
  const [rewardSearch, setRewardSearch] = useState('')
  const [rewardRarityFilter, setRewardRarityFilter] = useState('all')

  // Delete Boss state
  const [deleteConfirmBoss, setDeleteConfirmBoss] = useState<BossRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteBoss = async (boss: BossRecord) => {
    if (!boss.id) return
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('bosses')
        .delete()
        .eq('id', boss.id)

      if (error) throw error
      toast.success(`تم حذف الزعيم "${boss.name}" بنجاح! 🗑️`)
      setDeleteConfirmBoss(null)
      if (editingBoss?.id === boss.id) {
        setIsModalOpen(false)
      }
      fetchBosses()
    } catch (err: any) {
      console.error('Delete boss error:', err)
      toast.error('فشل حذف الزعيم: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    fetchBosses()
    fetchTitles()
    fetchCards()
  }, [])

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
        deck_cards: Array.isArray(b.deck) ? b.deck : (Array.isArray(b.deck_cards) ? b.deck_cards : []),
      }))
      setBosses(normalized)
    } catch (err: any) {
      console.error('Failed to fetch bosses:', err)
      toast.error('فشل تحميل الزعماء')
    } finally {
      setLoading(false)
    }
  }

  const fetchTitles = async () => {
    try {
      const { data } = await supabase.from('titles').select('*').order('rarity')
      setTitles(data || [])
    } catch (err) {
      console.error('Failed to fetch titles:', err)
    }
  }

  const fetchCards = async () => {
    try {
      const { data } = await supabase
        .from('cards')
        .select('id, name, title, element, rarity, image_path, stats')
        .order('rarity')
      setAllCards(data || [])
    } catch (err) {
      console.error('Failed to fetch cards:', err)
    }
  }

  const handleOpenCreate = () => {
    setEditingBoss({
      name: '',
      title: 'قائد الهاوية المرعب',
      avatar_url: '/logo.jpeg',
      banner_url: '',
      description: 'زعيم أسطوري ذو قوى تدميرية.',
      difficulty: 'Nightmare',
      ai_level: 'Advanced',
      theme_color: '#dc2626',
      hp: 12000,
      atk: 450,
      def: 250,
      spd: 120,
      crit_rate: 25,
      win_points: 500,
      first_blood_points: 2000,
      exclusive_title_id: titles[0]?.id || undefined,
      deck_cards: [],
      is_active: true,
      reward_items: [],
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (boss: BossRecord) => {
    setEditingBoss({ 
      ...boss,
      deck_cards: Array.isArray(boss.deck_cards) ? boss.deck_cards : ((boss as any).deck || []),
      reward_items: boss.reward_items || []
    })
    setIsModalOpen(true)
  }

  const handleToggleStatus = async (boss: BossRecord) => {
    try {
      const newStatus = !boss.is_active
      const { error } = await supabase
        .from('bosses')
        .update({ is_active: newStatus })
        .eq('id', boss.id)

      if (error) throw error
      toast.success(newStatus ? 'تم تفعيل الزعيم' : 'تم تعطيل الزعيم')
      fetchBosses()
    } catch (err: any) {
      toast.error('فشل تحديث الحالة: ' + err.message)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBoss) return
    if (!editingBoss.name.trim()) return toast.error('يرجى إدخال اسم الزعيم')

    setSaving(true)
    try {
      const payload = {
        p_boss_id: editingBoss.id || null,
        p_name: editingBoss.name.trim(),
        p_title: editingBoss.title || 'زعيم أسطوري',
        p_avatar_url: editingBoss.avatar_url || '/logo.jpeg',
        p_cover_image_url: editingBoss.banner_url || null,
        p_description: editingBoss.description || '',
        p_difficulty: editingBoss.difficulty,
        p_ai_level: editingBoss.ai_level,
        p_accent_color: editingBoss.theme_color || '#dc2626',
        p_is_active: editingBoss.is_active ?? true,
        p_stats: {
          hp: Number(editingBoss.hp) || 10000,
          atk: Number(editingBoss.atk) || 300,
          def: Number(editingBoss.def) || 150,
          speed: Number(editingBoss.spd) || 100,
          crit_rate: Number(editingBoss.crit_rate) || 20,
          crit_dmg: 160,
          shield: 300,
          heal: 150,
          revive_count: 0,
        },
        p_deck: editingBoss.deck_cards || [],
        p_rewards: {
          points: Number(editingBoss.win_points) || 500,
          first_blood_points: Number(editingBoss.first_blood_points) || 1000,
          exclusive_title_id: editingBoss.exclusive_title_id || null,
          items: editingBoss.reward_items || [],
        },
      }

      const { data, error } = await supabase.rpc('admin_save_boss', payload)
      if (error) throw error

      toast.success(editingBoss.id ? 'تم تحديث الزعيم ومكافآته بنجاح 👑' : 'تم إنشاء الزعيم ومكافآته بنجاح 🐉')
      setIsModalOpen(false)
      fetchBosses()
    } catch (err: any) {
      console.error('Save boss error:', err)
      toast.error('خطأ أثناء حفظ الزعيم: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Add / Edit Reward Item Handlers
  const handleOpenAddReward = (type: 'card' | 'title') => {
    setEditingReward({
      id: crypto.randomUUID(),
      type,
      card_id: type === 'card' && allCards.length > 0 ? allCards[0].id : null,
      title_id: type === 'title' && titles.length > 0 ? titles[0].id : null,
      drop_type: 'always',
      drop_rate: 100,
      quantity: 1,
      max_claims_per_player: 1,
      is_secret: false,
    })
    setRewardSearch('')
    setRewardRarityFilter('all')
    setRewardModalOpen(true)
  }

  const handleOpenEditReward = (reward: BossRewardItem) => {
    setEditingReward({ ...reward })
    setRewardSearch('')
    setRewardRarityFilter('all')
    setRewardModalOpen(true)
  }

  const handleSaveRewardItem = () => {
    if (!editingReward || !editingBoss) return
    if (editingReward.type === 'card' && !editingReward.card_id) {
      return toast.error('يرجى اختيار البطاقة')
    }
    if (editingReward.type === 'title' && !editingReward.title_id) {
      return toast.error('يرجى اختيار اللقب')
    }

    const currentList = (editingBoss.reward_items || []).filter(Boolean)
    const existingIndex = currentList.findIndex(r => r && r.id === editingReward.id)

    let updatedList: BossRewardItem[]
    if (existingIndex >= 0) {
      updatedList = [...currentList]
      updatedList[existingIndex] = editingReward
    } else {
      updatedList = [...currentList, editingReward]
    }

    setEditingBoss({
      ...editingBoss,
      reward_items: updatedList
    })
    setRewardModalOpen(false)
    toast.success('تم ضبط قاعدة المكافأة بنجاح!')
  }

  const handleDeleteRewardItem = (ruleId: string) => {
    if (!editingBoss) return
    const updated = (editingBoss.reward_items || []).filter(r => r && r.id !== ruleId)
    setEditingBoss({
      ...editingBoss,
      reward_items: updated
    })
    toast.success('تمت إزالة المكافأة')
  }

  // Lookup helpers
  const getCardById = (id?: string | null) => (id ? allCards.find(c => c && c.id === id) : null)
  const getTitleById = (id?: string | null) => (id ? titles.find(t => t && t.id === id) : null)

  const getRarityStyle = (rarity?: string | null) => {
    const key = (rarity || 'legendary').toLowerCase()
    return RARITY_COLORS[key] || RARITY_COLORS.legendary
  }

  // Filter cards & titles for picker modal
  const filteredCards = (allCards || []).filter(c => {
    if (!c || !c.id) return false
    const q = rewardSearch.trim().toLowerCase()
    const matchesSearch = !q || (c.name && c.name.toLowerCase().includes(q))
    const matchesRarity = rewardRarityFilter === 'all' || (c.rarity && c.rarity.toLowerCase() === rewardRarityFilter.toLowerCase())
    return matchesSearch && matchesRarity
  })

  const filteredTitles = (titles || []).filter(t => {
    if (!t || !t.id) return false
    const q = rewardSearch.trim().toLowerCase()
    const matchesSearch = !q || 
      (t.name_ar && t.name_ar.toLowerCase().includes(q)) || 
      (t.name_en && t.name_en.toLowerCase().includes(q))
    const matchesRarity = rewardRarityFilter === 'all' || (t.rarity && t.rarity.toLowerCase() === rewardRarityFilter.toLowerCase())
    return matchesSearch && matchesRarity
  })

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Skull className="text-red-400" size={24} />
            <h2 className="text-2xl font-black text-white">إدارة الزعماء الأسطوريين ومكافآت الفوز</h2>
          </div>
          <p className="text-slate-400 text-sm">
            أنشئ زعماء خارقين، حدد ذكاءهم الاصطناعي وإحصائياتهم، وخصص مكافآت الفوز من بطاقات نادرة وألقاب حصرية بقواعد وشروط متقدمة.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-primary py-3 px-5 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary-500/20"
        >
          <Plus size={18} />
          إنشاء زعيم أسطوري جديد
        </button>
      </div>

      {/* Bosses Table / Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="animate-spin text-primary-400" size={32} />
        </div>
      ) : bosses.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-3">
          <Skull size={40} className="mx-auto text-slate-500" />
          <p className="text-slate-300 font-bold">لا يوجد زعماء مسجلين حالياً</p>
          <p className="text-slate-500 text-xs">اضغط على زر الإنشاء أعلاه لإضافة أول زعيم للمنصة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bosses.map((boss) => {
            const rewardCount = (boss.reward_items?.length || 0) + (boss.exclusive_title_id ? 1 : 0)
            return (
              <div
                key={boss.id}
                className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="relative h-44 bg-slate-950 overflow-hidden">
                    <img
                      src={boss.banner_url || boss.avatar_url || '/logo.jpeg'}
                      alt={boss.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40 backdrop-blur-md">
                        {boss.difficulty}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 backdrop-blur-md">
                        ذكاء {boss.ai_level}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 text-right">
                      <span className="text-[11px] font-bold text-primary-400 block">{boss.title}</span>
                      <h4 className="text-lg font-black text-white">{boss.name}</h4>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {boss.description || 'زعيم أسطوري مسلح بقوى Resonance مظلمة.'}
                    </p>

                    <div className="grid grid-cols-4 gap-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-center text-xs">
                      <div>
                        <div className="text-slate-500 text-[10px]">HP</div>
                        <div className="font-bold text-emerald-400 font-mono number-ltr">{(boss.hp || 10000).toLocaleString('en-US')}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">ATK</div>
                        <div className="font-bold text-red-400">{boss.atk}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">DEF</div>
                        <div className="font-bold text-blue-400">{boss.def}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">SPD</div>
                        <div className="font-bold text-amber-400">{boss.spd}</div>
                      </div>
                    </div>

                    {/* Rewards Summary Pill */}
                    <div className="flex items-center justify-between text-xs bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                      <span className="flex items-center gap-1 text-amber-300 font-bold">
                        <Trophy size={14} className="text-amber-400" />
                        مكافآت الفوز:
                      </span>
                      <span className="font-mono font-bold text-white number-ltr">
                        +${boss.win_points} • <strong className="text-amber-400">{boss.reward_items?.length || 0}</strong> جوائز
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                  <button
                    onClick={() => handleToggleStatus(boss)}
                    className={`text-xs px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                      boss.is_active
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${boss.is_active ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                    {boss.is_active ? 'نشط' : 'معطل'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(boss)}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all text-xs font-bold flex items-center gap-1.5"
                      title="تعديل الزعيم والمكافآت"
                    >
                      <Edit2 size={14} />
                      تعديل ومكافآت
                    </button>
                    <button
                      onClick={() => setDeleteConfirmBoss(boss)}
                      className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500/30 transition-all text-xs font-bold flex items-center justify-center border border-red-500/20"
                      title="حذف الزعيم"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* CREATE / EDIT BOSS MODAL                                       */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isModalOpen && editingBoss && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-8 max-h-[92vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                <div className="flex items-center gap-2.5">
                  <Skull className="text-red-400" size={22} />
                  <h3 className="text-lg font-black text-white">
                    {editingBoss.id ? `تعديل الزعيم: ${editingBoss.name}` : 'إنشاء زعيم أسطوري جديد'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
                
                {/* 1. Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-primary-400" />
                    المعلومات الأساسية
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم الزعيم *</label>
                      <input
                        type="text"
                        value={editingBoss.name}
                        onChange={(e) => setEditingBoss({ ...editingBoss, name: e.target.value })}
                        required
                        placeholder="مثال: Crownless Sovereign"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">اللقب الشرفي</label>
                      <input
                        type="text"
                        value={editingBoss.title}
                        onChange={(e) => setEditingBoss({ ...editingBoss, title: e.target.value })}
                        placeholder="مثال: حارس الهاوية العظمى"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                    {/* Avatar Upload */}
                    <div className="space-y-2">
                      <ImageUpload
                        bucket="character-images"
                        currentPath={editingBoss.avatar_url || null}
                        onUploaded={(path: string) => {
                          const fullUrl = getImageUrl(path, 'character-images')
                          setEditingBoss((b) => b ? ({ ...b, avatar_url: fullUrl }) : null)
                        }}
                        label="صورة الزعيم الرمزية (Avatar) - رفع من الجهاز"
                        aspectRatio="square"
                      />
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">أو رابط مباشر للصورة الرمزية (اختياري):</label>
                        <input
                          type="text"
                          value={editingBoss.avatar_url}
                          onChange={(e) => setEditingBoss({ ...editingBoss, avatar_url: e.target.value })}
                          placeholder="https://... أو /logo.jpeg"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Banner Upload */}
                    <div className="space-y-2">
                      <ImageUpload
                        bucket="event-covers"
                        currentPath={editingBoss.banner_url || null}
                        onUploaded={(path: string) => {
                          const fullUrl = getImageUrl(path, 'event-covers')
                          setEditingBoss((b) => b ? ({ ...b, banner_url: fullUrl }) : null)
                        }}
                        label="صورة غلاف الزعيم (Banner) - رفع من الجهاز"
                        aspectRatio="wide"
                      />
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">أو رابط مباشر لغلاف الزعيم (اختياري):</label>
                        <input
                          type="text"
                          value={editingBoss.banner_url || ''}
                          onChange={(e) => setEditingBoss({ ...editingBoss, banner_url: e.target.value })}
                          placeholder="https://..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">وصف وقصة الزعيم</label>
                    <textarea
                      rows={2}
                      value={editingBoss.description || ''}
                      onChange={(e) => setEditingBoss({ ...editingBoss, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 2. Difficulty & AI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">مستوى الصعوبة</label>
                    <select
                      value={editingBoss.difficulty}
                      onChange={(e) => setEditingBoss({ ...editingBoss, difficulty: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="Hard">Hard - صعب</option>
                      <option value="Nightmare">Nightmare - كابوس</option>
                      <option value="Abyssal">Abyssal - سحيق</option>
                      <option value="Impossible">Impossible - مستحيل</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">مستوى الذكاء الاصطناعي (Combat AI)</label>
                    <select
                      value={editingBoss.ai_level}
                      onChange={(e) => setEditingBoss({ ...editingBoss, ai_level: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="Tactical">Tactical - تكتيكي أساسي</option>
                      <option value="Advanced">Advanced - متقدم (استهداف أولوية)</option>
                      <option value="Mastermind">Mastermind - عبقري (دفاع وهجوم استباقي)</option>
                    </select>
                  </div>
                </div>

                {/* 3. Boss Battle Stats */}
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-red-500/20 space-y-3">
                  <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <Zap size={14} />
                    إحصائيات المعركة المخصصة للزعيم (مستقلة عن بطاقات اللاعبين)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">الصحة (HP)</label>
                      <input
                        type="number"
                        min="1000"
                        value={editingBoss.hp}
                        onChange={(e) => setEditingBoss({ ...editingBoss, hp: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-emerald-400 font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">الهجوم (ATK)</label>
                      <input
                        type="number"
                        min="10"
                        value={editingBoss.atk}
                        onChange={(e) => setEditingBoss({ ...editingBoss, atk: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-red-400 font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">الدفاع (DEF)</label>
                      <input
                        type="number"
                        min="10"
                        value={editingBoss.def}
                        onChange={(e) => setEditingBoss({ ...editingBoss, def: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-blue-400 font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">السرعة (SPD)</label>
                      <input
                        type="number"
                        min="10"
                        value={editingBoss.spd}
                        onChange={(e) => setEditingBoss({ ...editingBoss, spd: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-amber-400 font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">ضربة حرجة (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editingBoss.crit_rate}
                        onChange={(e) => setEditingBoss({ ...editingBoss, crit_rate: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-purple-400 font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* 4. VICTORY REWARDS (مكافآت الفوز المخصصة)                      */}
                {/* ============================================================== */}
                <div className="bg-slate-950/80 p-5 rounded-3xl border border-amber-500/30 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="space-y-0.5">
                      <div className="text-sm font-black text-white flex items-center gap-2">
                        <Trophy size={18} className="text-amber-400" />
                        مكافآت الفوز (Victory Rewards)
                      </div>
                      <p className="text-xs text-slate-400">
                        حدد البطاقات والألقاب والجوائز ($) التي يربحها اللاعب عند هزيمة الزعيم مع قواعد ونسب سقوط مستقلة.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAddReward('card')}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center gap-1.5"
                      >
                        <Plus size={14} /> إضافة بطاقة مكافأة
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAddReward('title')}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold hover:bg-purple-500/30 transition-all flex items-center gap-1.5"
                      >
                        <Plus size={14} /> إضافة لقب مكافأة
                      </button>
                    </div>
                  </div>

                  {/* Points Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
                    <div>
                      <label className="block text-xs font-bold text-amber-300 mb-1">دولارات الفوز الأساسية (Win Cash $)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingBoss.win_points}
                        onChange={(e) => setEditingBoss({ ...editingBoss, win_points: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-amber-300 font-mono font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-red-400 mb-1">دولارات أول قاتل بالسيرفر (First Blood $)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingBoss.first_blood_points}
                        onChange={(e) => setEditingBoss({ ...editingBoss, first_blood_points: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-red-400 font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Configured Custom Rewards List */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-300">
                      قائمة الجوائز المحددة لهذا الزعيم ({editingBoss.reward_items?.length || 0}):
                    </div>

                    {(!editingBoss.reward_items || editingBoss.reward_items.length === 0) ? (
                      <div className="text-center py-6 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-4 space-y-2">
                        <Trophy size={28} className="mx-auto text-slate-600" />
                        <p className="text-slate-400 text-xs">لم تقم بإضافة بطاقات أو ألقاب مخصصة كمكافآت فوز لهذا الزعيم بعد.</p>
                        <div className="flex justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAddReward('card')}
                            className="text-xs text-amber-400 font-bold hover:underline"
                          >
                            + أضف بطاقة نادرة
                          </button>
                          <span className="text-slate-600">•</span>
                          <button
                            type="button"
                            onClick={() => handleOpenAddReward('title')}
                            className="text-xs text-purple-400 font-bold hover:underline"
                          >
                            + أضف لقباً شرفياً
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                        {(editingBoss.reward_items || []).filter(Boolean).map((r, idx) => {
                          const isCard = r.type === 'card'
                          const card = isCard ? getCardById(r.card_id) : null
                          const title = !isCard ? getTitleById(r.title_id) : null
                          const rarityStyle = getRarityStyle(card?.rarity || title?.rarity)

                          let dropLabel = 'مضمون (100%)'
                          let dropColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          if (r.drop_type === 'first_victory_only') {
                            dropLabel = 'أول فوز فقط'
                            dropColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          } else if (r.drop_type === 'first_blood_only') {
                            dropLabel = 'First Blood'
                            dropColor = 'bg-red-500/20 text-red-300 border-red-500/40'
                          } else if (r.drop_type === 'chance') {
                            dropLabel = `فرصة ${r.drop_rate || 20}%`
                            dropColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }

                          return (
                            <div
                              key={r.id || idx}
                              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {isCard ? (
                                  <div className="w-10 h-12 rounded-lg overflow-hidden bg-black/60 border border-amber-500/30 shrink-0">
                                    <img
                                      src={card?.image_path || '/characters/changli.webp'}
                                      alt={card?.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-lg shrink-0">
                                    {title?.icon || '👑'}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black text-white truncate">
                                      {isCard ? (card?.name || 'بطاقة محددة') : (title?.name_ar || 'لقب محدد')}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${rarityStyle.bg} ${rarityStyle.text} ${rarityStyle.border}`}>
                                      {card?.rarity || title?.rarity || 'legendary'}
                                    </span>
                                    {isCard && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                                        ×{r.quantity || 1}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-1 text-[11px]">
                                    <span className={`px-2 py-0.2 rounded-full border text-[10px] font-bold ${dropColor}`}>
                                      {dropLabel}
                                    </span>

                                    <span className="text-slate-400 text-[10px]">
                                      {r.max_claims_per_player === 1 ? 'مرة واحدة لكل لاعب' : 'غير محدود'}
                                    </span>

                                    {r.is_secret && (
                                      <span className="text-amber-400 text-[10px] flex items-center gap-0.5">
                                        <Lock size={10} /> مكافأة سرية
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditReward(r)}
                                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                  title="تعديل شروط المكافأة"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRewardItem(r.id)}
                                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                  title="حذف المكافأة"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Boss Deck Preview Button */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers size={14} className="text-primary-400" />
                      تشكيلة بطاقات الزعيم
                    </div>
                    <div className="text-xs text-slate-400">
                      تم اختيار <strong className="text-primary-400">{editingBoss.deck_cards?.length || 0}</strong> بطاقة للزعيم
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeckModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-primary-500/20 text-primary-300 border border-primary-500/30 text-xs font-bold hover:bg-primary-500/30 transition-all"
                  >
                    تحديد بطاقات التشكيلة
                  </button>
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  {editingBoss.id ? (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmBoss(editingBoss)}
                      className="px-4 py-2.5 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/30 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 border border-red-500/30"
                    >
                      <Trash2 size={15} />
                      حذف هذا الزعيم
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-bold hover:bg-slate-700"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary px-7 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-glow-blue"
                    >
                      {saving ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                      {editingBoss.id ? 'حفظ تعديلات الزعيم والمكافآت' : 'إنشاء الزعيم'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* REWARD ITEM PICKER & RULES MODAL                               */}
      {/* ============================================================== */}
      <AnimatePresence>
        {rewardModalOpen && editingReward && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 max-h-[92vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                <div className="flex items-center gap-2.5">
                  <Trophy className="text-amber-400" size={20} />
                  <h3 className="text-base font-black text-white">
                    تخصيص مكافأة فوز جديدة ({editingReward.type === 'card' ? 'بطاقة نادرة' : 'لقب شرفي'})
                  </h3>
                </div>
                <button
                  onClick={() => setRewardModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
                {/* Reward Type Toggle */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingReward({
                      ...editingReward,
                      type: 'card',
                      card_id: allCards[0]?.id || null
                    })}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      editingReward.type === 'card'
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    بطاقة نادرة (Card)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingReward({
                      ...editingReward,
                      type: 'title',
                      title_id: titles[0]?.id || null
                    })}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      editingReward.type === 'title'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    لقب شرفي (Title)
                  </button>
                </div>

                {/* Item Search & Filter */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={rewardSearch}
                      onChange={e => setRewardSearch(e.target.value)}
                      placeholder={editingReward.type === 'card' ? 'ابحث عن بطاقة...' : 'ابحث عن لقب...'}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <select
                    value={rewardRarityFilter}
                    onChange={e => setRewardRarityFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="all">جميع الدرجات</option>
                    <option value="mythic">Mythic</option>
                    <option value="legendary">Legendary</option>
                    <option value="epic">Epic</option>
                    <option value="rare">Rare</option>
                    <option value="common">Common</option>
                  </select>
                </div>

                {/* Items Grid Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    اختر {editingReward.type === 'card' ? 'البطاقة المطلوبة من قاعدة البيانات:' : 'اللقب المطلوب من النظام:'}
                  </label>

                  {editingReward.type === 'card' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                      {filteredCards.map(c => {
                        const isSelected = editingReward.card_id === c.id
                        const rarityStyle = RARITY_COLORS[c.rarity] || RARITY_COLORS.legendary
                        return (
                          <div
                            key={c.id}
                            onClick={() => setEditingReward({ ...editingReward, card_id: c.id })}
                            className={`p-2 rounded-2xl border cursor-pointer transition-all flex items-center gap-2 ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="w-10 h-12 rounded-lg overflow-hidden bg-black/60 shrink-0">
                              <img src={c.image_path || '/characters/changli.webp'} alt={c.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-black text-white block truncate">{c.name}</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${rarityStyle.text}`}>
                                  {c.rarity}
                                </span>
                                <span className="text-[9px] text-slate-400">{c.element}</span>
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 size={16} className="text-amber-400 shrink-0" />}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                      {filteredTitles.map(t => {
                        const isSelected = editingReward.title_id === t.id
                        const rarityStyle = RARITY_COLORS[t.rarity] || RARITY_COLORS.legendary
                        return (
                          <div
                            key={t.id}
                            onClick={() => setEditingReward({ ...editingReward, title_id: t.id })}
                            className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-400/50'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-lg">{t.icon || '👑'}</span>
                              <div className="min-w-0">
                                <span className="text-xs font-black text-white block truncate">{t.name_ar}</span>
                                <span className={`text-[10px] font-bold ${rarityStyle.text}`}>{t.rarity}</span>
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 size={16} className="text-purple-400 shrink-0" />}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Drop Rule Configuration */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3.5">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" />
                    قواعد وشروط الحصول على المكافأة
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">طريقة المنح (Drop Rule)</label>
                      <select
                        value={editingReward.drop_type}
                        onChange={e => setEditingReward({
                          ...editingReward,
                          drop_type: e.target.value as any
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="always">مضمون عند كل انتصار (100%)</option>
                        <option value="first_victory_only">عند أول انتصار للاعب فقط</option>
                        <option value="first_blood_only">لأول قاتل بالسيرفر فقط (First Blood)</option>
                        <option value="chance">نسبة احتمالية (بالحظ)</option>
                      </select>
                    </div>

                    {editingReward.drop_type === 'chance' && (
                      <div>
                        <label className="block text-[11px] font-bold text-amber-300 mb-1">
                          نسبة الاحتمال: {editingReward.drop_rate || 25}%
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={editingReward.drop_rate || 25}
                            onChange={e => setEditingReward({
                              ...editingReward,
                              drop_rate: Number(e.target.value)
                            })}
                            className="flex-1 accent-amber-500"
                          />
                          <span className="font-mono text-xs text-amber-400 font-bold w-12 text-left">
                            {editingReward.drop_rate || 25}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {editingReward.type === 'card' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">عدد النسخ الممنوحة (Quantity)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editingReward.quantity || 1}
                          onChange={e => setEditingReward({
                            ...editingReward,
                            quantity: Math.max(1, Number(e.target.value))
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">الحد الأقصى لمرات الحصول لكل لاعب</label>
                      <select
                        value={editingReward.max_claims_per_player === 1 ? '1' : 'unlimited'}
                        onChange={e => setEditingReward({
                          ...editingReward,
                          max_claims_per_player: e.target.value === '1' ? 1 : null
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                      >
                        <option value="1">مرة واحدة لكل لاعب (يمنع التكرار)</option>
                        <option value="unlimited">مرات غير محدودة (في كل فوز مستحق)</option>
                      </select>
                    </div>
                  </div>

                  {/* Secret Reward Toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <Lock size={14} className="text-amber-400" />
                      <div>
                        <span className="font-bold text-white block">مكافأة سرية غامضة</span>
                        <span className="text-[10px] text-slate-400">إخفاء اسم وتفاصيل المكافأة عن اللاعبين في شاشة الزعيم حتى الفوز</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editingReward.is_secret || false}
                      onChange={e => setEditingReward({
                        ...editingReward,
                        is_secret: e.target.checked
                      })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRewardModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRewardItem}
                    className="btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-glow-amber"
                  >
                    <Check size={14} />
                    تأكيد وإضافة المكافأة
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* Card Selector Sub-Modal for Boss Deck                           */}
      {/* ============================================================== */}
      <AnimatePresence>
        {deckModalOpen && editingBoss && (
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
                  <h3 className="text-lg font-black text-white">اختر بطاقات تشكيلة الزعيم (1 إلى 5 بطاقات)</h3>
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
                  mode="admin"
                  maxSelect={5}
                  selectedCardIds={
                    (editingBoss.deck_cards || [])
                      .filter(Boolean)
                      .map((c: any) => (typeof c === 'string' ? c : (c?.id || c?.card_id)))
                      .filter((id): id is string => typeof id === 'string' && Boolean(id))
                  }
                  onSelectionChange={(_selectedIds, selectedItems) => {
                    setEditingBoss({
                      ...editingBoss,
                      deck_cards: selectedItems,
                    })
                  }}
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDeckModalOpen(false)}
                  className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold"
                >
                  تأكيد واختيار ({editingBoss.deck_cards?.length || 0})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmBoss && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-red-500/40 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-center"
              dir="rtl"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
                <Trash2 size={28} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-white">تأكيد حذف الزعيم الأسطوري</h3>
                <p className="text-sm text-slate-300">
                  هل أنت متأكد من رغبتك في حذف الزعيم <strong className="text-red-400">"{deleteConfirmBoss.name}"</strong>؟
                </p>
                <p className="text-xs text-slate-400">
                  سيتم حذف الزعيم وجميع مكافآته وسجلاته من النظام فورياً. لا يمكن التراجع عن هذا الإجراء!
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDeleteBoss(deleteConfirmBoss)}
                  className="btn-primary flex-1 py-3 text-xs font-bold bg-red-600 hover:bg-red-500 text-white border-none flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30"
                >
                  {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {isDeleting ? 'جارٍ الحذف...' : 'نعم، حذف الزعيم نهائياً'}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmBoss(null)}
                  className="btn-secondary py-3 px-5 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
