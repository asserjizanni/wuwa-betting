import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Plus, Search, Edit3, Copy, Trash2, Globe, EyeOff, 
  Layers, Palette, Type, Image as ImageIcon, Shield, Save, Check, 
  X, ArrowRight, Sliders, RefreshCw, Box, ExternalLink, Crown,
  Swords, Zap, Heart, ShieldAlert
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store'
import { CardRenderer } from '../shared/CardRenderer'
import { ELEMENT_MAP, RARITY_LABELS } from '../../lib/cardData'
import { ImageUpload } from '../shared/ImageUpload'
import { LoadingSpinner, EmptyState, ConfirmDialog, Modal } from '../shared/UI'
import type { Card, CardTemplate, CardSet, Character, CardRarity } from '../../types/database'
import toast from 'react-hot-toast'

const DEFAULT_GRADIENTS: Record<CardRarity, string> = {
  common: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  rare: 'linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)',
  epic: 'linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)',
  legendary: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)',
  mythic: 'linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)',
}

const DEFAULT_BORDER_COLORS: Record<CardRarity, string> = {
  common: '#64748b',
  rare: '#38bdf8',
  epic: '#c084fc',
  legendary: '#f59e0b',
  mythic: '#ec4899',
}

export interface CardCombatStats {
  hp: number
  atk: number
  def: number
  heal: number
  shield: number
  speed: number
  energy: number
  crit_rate: number
  crit_dmg: number
  lifesteal: number
  damage_reduction: number
  heal_bonus: number
  shield_bonus: number
  revive_count: number
  revive_hp_pct: number
}

export interface CardCombatSkill {
  id: string
  name: string
  description: string
  type: 'attack' | 'heal' | 'shield' | 'buff' | 'debuff' | 'passive' | 'revive'
  target: 'opponent' | 'self' | 'all'
  effect_type: 'damage' | 'heal' | 'shield' | 'damage_reduction' | 'atk_debuff' | 'def_debuff' | 'revive'
  value: number
  value_type: 'flat' | 'percentage'
  energy_cost: number
  cooldown: number
  max_uses: number
}

interface DesignerForm {
  name: string
  title: string
  subtitle: string
  decorative_text: string
  element: string
  rarity: CardRarity
  description: string
  character_id: string
  template_id: string
  set_id: string
  image_path: string
  background_image_path: string
  frame_image_path: string
  is_limited: boolean
  max_supply: string
  is_published: boolean
  // Design Overrides
  border_color: string
  bg_gradient: string
  border_width: number
  border_radius: number
  glow_color: string
  glow_spread: number
  holo_effect: 'none' | 'subtle_blue' | 'purple_pulse' | 'golden_rays' | 'rainbow_hologram'
  title_color: string
  subtitle_color: string
  badge_bg: string
  // Combat stats & skills
  stats: CardCombatStats
  skills: CardCombatSkill[]
}

const INITIAL_FORM: DesignerForm = {
  name: '',
  title: '',
  subtitle: '',
  decorative_text: 'RESONATOR',
  element: 'Spectro',
  rarity: 'common',
  description: '',
  character_id: '',
  template_id: '',
  set_id: '',
  image_path: '',
  background_image_path: '',
  frame_image_path: '',
  is_limited: false,
  max_supply: '',
  is_published: true,
  border_color: '#64748b',
  bg_gradient: DEFAULT_GRADIENTS.common,
  border_width: 2.5,
  border_radius: 20,
  glow_color: 'rgba(100, 116, 139, 0.5)',
  glow_spread: 15,
  holo_effect: 'none',
  title_color: '#ffffff',
  subtitle_color: '#94a3b8',
  badge_bg: 'rgba(100, 116, 139, 0.3)',
  stats: {
    hp: 1000,
    atk: 150,
    def: 60,
    heal: 80,
    shield: 120,
    speed: 100,
    energy: 100,
    crit_rate: 15,
    crit_dmg: 150,
    lifesteal: 10,
    damage_reduction: 5,
    heal_bonus: 10,
    shield_bonus: 10,
    revive_count: 0,
    revive_hp_pct: 30,
  },
  skills: [
    {
      id: 'skill-1',
      name: 'ضربة قاطعة',
      description: 'هجوم حاسم يلحق ضرراً إضافياً بالخصم',
      type: 'attack',
      target: 'opponent',
      effect_type: 'damage',
      value: 120,
      value_type: 'flat',
      energy_cost: 20,
      cooldown: 1,
      max_uses: 99,
    }
  ],
}

export function AdminCardDesigner() {
  const admin = useAuthStore(state => state.admin)
  const [cards, setCards] = useState<Card[]>([])
  const [templates, setTemplates] = useState<CardTemplate[]>([])
  const [sets, setSets] = useState<CardSet[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  // View state: 'list' | 'designer'
  const [viewMode, setViewMode] = useState<'list' | 'designer'>('list')
  const [activeTab, setActiveTab] = useState<'meta' | 'media' | 'frame' | 'holo' | 'edition' | 'combat'>('meta')
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [previewSize, setPreviewSize] = useState<'md' | 'lg' | 'xl'>('lg')
  const [deleteConfirm, setDeleteConfirm] = useState<Card | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveTemplateModal, setSaveTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('')

  // Filter state for list view
  const [search, setSearch] = useState('')
  const [rarityFilter, setRarityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  // Designer Form State
  const [form, setForm] = useState<DesignerForm>(INITIAL_FORM)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [cardsRes, templatesRes, setsRes, charsRes] = await Promise.all([
        supabase
          .from('cards')
          .select('*, character:characters(*), template:card_templates(*), set:card_sets(*)')
          .order('created_at', { ascending: false }),
        supabase.from('card_templates').select('*').order('name'),
        supabase.from('card_sets').select('*').order('name'),
        supabase.from('characters').select('*').eq('is_active', true).order('name'),
      ])

      if (cardsRes.data) setCards(cardsRes.data as Card[])
      if (templatesRes.data) setTemplates(templatesRes.data as CardTemplate[])
      if (setsRes.data) setSets(setsRes.data as CardSet[])
      if (charsRes.data) setCharacters(charsRes.data as Character[])
    } catch (err) {
      console.error(err)
      toast.error('فشل تحميل بيانات البطاقات')
    } finally {
      setLoading(false)
    }
  }

  // Handle character selection -> auto-fill image and names if empty
  const handleSelectCharacter = (charId: string) => {
    const selectedChar = characters.find(c => c.id === charId)
    setForm(prev => ({
      ...prev,
      character_id: charId,
      name: prev.name ? prev.name : (selectedChar ? selectedChar.name : ''),
      subtitle: prev.subtitle ? prev.subtitle : (selectedChar?.alternate_name || ''),
      image_path: prev.image_path ? prev.image_path : (selectedChar?.image_path || ''),
    }))
  }

  // Handle template selection -> copy styling presets
  const handleSelectTemplate = (templateId: string) => {
    const t = templates.find(item => item.id === templateId)
    if (!t) return

    setForm(prev => ({
      ...prev,
      template_id: templateId,
      rarity: t.rarity,
      border_color: t.border_color,
      bg_gradient: t.bg_gradient,
      border_width: t.frame_style.border_width ?? 2.5,
      border_radius: t.frame_style.border_radius ?? 20,
      glow_color: t.frame_style.glow_color ?? 'rgba(99,102,241,0.5)',
      glow_spread: t.frame_style.glow_spread ?? 15,
      holo_effect: t.frame_style.holo_effect || 'none',
      title_color: t.text_style.title_color ?? '#ffffff',
      subtitle_color: t.text_style.subtitle_color ?? '#94a3b8',
      badge_bg: t.text_style.badge_bg ?? 'rgba(99,102,241,0.3)',
    }))
  }

  // Handle rarity change -> adjust default theme if not customized
  const handleRarityChange = (rarity: CardRarity) => {
    const matchedTemplate = templates.find(t => t.rarity === rarity && t.is_default) || templates.find(t => t.rarity === rarity)
    if (matchedTemplate) {
      handleSelectTemplate(matchedTemplate.id)
    } else {
      setForm(prev => ({
        ...prev,
        rarity,
        border_color: DEFAULT_BORDER_COLORS[rarity],
        bg_gradient: DEFAULT_GRADIENTS[rarity],
      }))
    }
  }

  const openNewCard = () => {
    setEditingCardId(null)
    const defaultTemplate = templates.find(t => t.rarity === 'common' && t.is_default) || templates[0]
    setForm({
      ...INITIAL_FORM,
      template_id: defaultTemplate?.id || '',
      set_id: sets[0]?.id || '',
    })
    setViewMode('designer')
    setActiveTab('meta')
  }

  const openEditCard = (card: Card) => {
    setEditingCardId(card.id)
    const override = card.card_design_override || {}
    const frame = override.frame_style || card.template?.frame_style || {}
    const text = override.text_style || card.template?.text_style || {}

    setForm({
      name: card.name,
      title: card.title || '',
      subtitle: card.subtitle || '',
      decorative_text: card.decorative_text || 'RESONATOR',
      element: card.element || 'Spectro',
      rarity: card.rarity,
      description: card.description || '',
      character_id: card.character_id || '',
      template_id: card.template_id || '',
      set_id: card.set_id || '',
      image_path: card.image_path,
      background_image_path: card.background_image_path || '',
      frame_image_path: card.frame_image_path || '',
      is_limited: card.is_limited,
      max_supply: card.max_supply ? String(card.max_supply) : '',
      is_published: card.is_published,
      border_color: override.border_color || card.template?.border_color || DEFAULT_BORDER_COLORS[card.rarity],
      bg_gradient: override.bg_gradient || card.template?.bg_gradient || DEFAULT_GRADIENTS[card.rarity],
      border_width: frame.border_width ?? 2.5,
      border_radius: frame.border_radius ?? 20,
      glow_color: frame.glow_color ?? 'rgba(99,102,241,0.5)',
      glow_spread: frame.glow_spread ?? 15,
      holo_effect: frame.holo_effect || 'none',
      title_color: text.title_color ?? '#ffffff',
      subtitle_color: text.subtitle_color ?? '#94a3b8',
      badge_bg: text.badge_bg ?? 'rgba(99,102,241,0.3)',
      stats: (card.stats as any) || INITIAL_FORM.stats,
      skills: (card.skills as any) || INITIAL_FORM.skills,
    })
    setViewMode('designer')
    setActiveTab('meta')
  }

  const duplicateCard = (card: Card) => {
    openEditCard(card)
    setEditingCardId(null)
    setForm(prev => ({
      ...prev,
      name: `${card.name} (نسخة)`,
      is_published: false,
    }))
    toast.success('تم استنساخ البطاقة، يمكنك تعديلها وحفظها كبطاقة جديدة')
  }

  const handleTogglePublish = async (card: Card) => {
    if (!admin?.id) return
    try {
      const newStatus = !card.is_published
      const { data, error } = await supabase.rpc('admin_toggle_publish_card', {
        p_admin_id: admin.id,
        p_card_id: card.id,
        p_publish: newStatus,
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشلت العملية')

      toast.success(newStatus ? 'تم نشر البطاقة' : 'تم إلغاء نشر البطاقة')
      await loadAllData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل تغيير حالة النشر')
    }
  }

  const handleDeleteCard = async () => {
    if (!deleteConfirm || !admin?.id) return
    try {
      const { error } = await supabase.from('cards').delete().eq('id', deleteConfirm.id)
      if (error) {
        if (error.code === '23503') {
          throw new Error('لا يمكن حذف البطاقة لأن بعض اللاعبين يمتلكون نسخاً منها بالفعل. يمكنك إلغاء نشرها بدلاً من ذلك.')
        }
        throw error
      }
      toast.success('تم حذف تعريف البطاقة')
      setDeleteConfirm(null)
      await loadAllData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الحذف')
    }
  }

  const handleSaveCard = async (publishImmediate?: boolean) => {
    if (!form.name.trim()) return toast.error('يرجى كتابة اسم البطاقة')
    if (!form.image_path) return toast.error('يرجى تحديد أو رفع صورة للبطاقة')
    if (!admin?.id) return

    const maxSupply = form.is_limited && form.max_supply ? parseInt(form.max_supply) : null
    const shouldPublish = publishImmediate !== undefined ? publishImmediate : form.is_published

    setIsSaving(true)
    try {
      const designOverride = {
        border_color: form.border_color,
        bg_gradient: form.bg_gradient,
        frame_style: {
          border_width: form.border_width,
          border_radius: form.border_radius,
          glow_color: form.glow_color,
          glow_spread: form.glow_spread,
          holo_effect: form.holo_effect,
        },
        text_style: {
          title_color: form.title_color,
          subtitle_color: form.subtitle_color,
          badge_bg: form.badge_bg,
        },
      }

      const { data, error } = await supabase.rpc('admin_save_card', {
        p_admin_id: admin.id,
        p_card_id: editingCardId,
        p_template_id: form.template_id || null,
        p_character_id: form.character_id || null,
        p_set_id: form.set_id || null,
        p_name: form.name.trim(),
        p_title: form.title.trim() || null,
        p_subtitle: form.subtitle.trim() || null,
        p_decorative_text: form.decorative_text.trim() || 'RESONATOR',
        p_element: form.element,
        p_rarity: form.rarity,
        p_description: form.description.trim() || null,
        p_image_path: form.image_path,
        p_background_image_path: form.background_image_path || null,
        p_frame_image_path: form.frame_image_path || null,
        p_card_design_override: designOverride,
        p_is_limited: form.is_limited,
        p_max_supply: maxSupply,
        p_is_published: shouldPublish,
        p_stats: form.stats,
        p_skills: form.skills,
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشلت العملية')

      toast.success(editingCardId ? 'تم تحديث البطاقة بنجاح' : 'تم إنشاء البطاقة بنجاح')
      setViewMode('list')
      await loadAllData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) return toast.error('اسم القالب مطلوب')
    if (!admin?.id) return

    try {
      const { data, error } = await supabase.rpc('admin_save_template', {
        p_admin_id: admin.id,
        p_name: templateName.trim(),
        p_rarity: form.rarity,
        p_border_color: form.border_color,
        p_bg_gradient: form.bg_gradient,
        p_frame_style: {
          border_width: form.border_width,
          border_radius: form.border_radius,
          glow_color: form.glow_color,
          glow_spread: form.glow_spread,
          holo_effect: form.holo_effect,
        },
        p_text_style: {
          title_color: form.title_color,
          subtitle_color: form.subtitle_color,
          badge_bg: form.badge_bg,
        },
        p_layout_config: {
          aspect_ratio: '2/3',
          badge_position: 'top-right',
          text_align: 'center',
          show_resonator_badge: true,
        },
        p_is_default: false,
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشل حفظ القالب')

      toast.success('تم حفظ التصميم الحالي كقالب جديد بنجاح')
      setSaveTemplateModal(false)
      setTemplateName('')
      await loadAllData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الحفظ')
    }
  }

  // Filtered Cards for list view
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const matchSearch =
        !search ||
        card.name.toLowerCase().includes(search.toLowerCase()) ||
        (card.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (card.character?.name || '').toLowerCase().includes(search.toLowerCase())
      const matchRarity = rarityFilter === 'all' || card.rarity === rarityFilter
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && card.is_published) ||
        (statusFilter === 'draft' && !card.is_published)
      return matchSearch && matchRarity && matchStatus
    })
  }, [cards, search, rarityFilter, statusFilter])

  // Live preview card object for the designer
  const previewCard: Partial<Card> = useMemo(() => {
    const selectedSet = sets.find(s => s.id === form.set_id)
    return {
      name: form.name || 'اسم البطاقة',
      title: form.title || '',
      subtitle: form.subtitle || '',
      decorative_text: form.decorative_text || 'RESONATOR',
      element: form.element,
      rarity: form.rarity,
      image_path: form.image_path,
      background_image_path: form.background_image_path,
      is_limited: form.is_limited,
      max_supply: form.is_limited && form.max_supply ? parseInt(form.max_supply) : null,
      set: selectedSet || null,
      stats: form.stats,
      skills: form.skills,
      card_design_override: {
        border_color: form.border_color,
        bg_gradient: form.bg_gradient,
        frame_style: {
          border_width: form.border_width,
          border_radius: form.border_radius,
          glow_color: form.glow_color,
          glow_spread: form.glow_spread,
          holo_effect: form.holo_effect,
        },
        text_style: {
          title_color: form.title_color,
          subtitle_color: form.subtitle_color,
          badge_bg: form.badge_bg,
        },
      },
    }
  }, [form, sets])

  return (
    <div className="space-y-6">
      {/* View Mode: List vs Designer */}
      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Sparkles className="text-amber-400" size={24} />
                مصمم البطاقات وإدارة التجميع
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {cards.length} بطاقة منشأة ({cards.filter(c => c.is_published).length} منشورة)
              </p>
            </div>
            <button onClick={openNewCard} className="btn-primary">
              <Plus size={18} />
              تصميم بطاقة جديدة
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="البحث بالاسم أو العنوان أو الـ Resonator..."
                className="input-field pr-10 py-2 text-sm"
              />
            </div>

            {/* Rarity filter */}
            <select
              value={rarityFilter}
              onChange={e => setRarityFilter(e.target.value)}
              className="select-field w-auto text-sm py-2"
            >
              <option value="all">جميع الدرجات</option>
              <option value="common">Common (شائع)</option>
              <option value="rare">Rare (نادر)</option>
              <option value="epic">Epic (ملحمي)</option>
              <option value="legendary">Legendary (أسطوري)</option>
              <option value="mythic">Mythic (خرافي)</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="select-field w-auto text-sm py-2"
            >
              <option value="all">جميع الحالات</option>
              <option value="published">منشورة فقط</option>
              <option value="draft">مسودات</option>
            </select>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner text="جارٍ تحميل البطاقات..." />
            </div>
          ) : filteredCards.length === 0 ? (
            <EmptyState
              icon={<Sparkles size={48} />}
              title={search || rarityFilter !== 'all' ? 'لا توجد نتائج' : 'لم يتم إنشاء بطاقات بعد'}
              description="ابدأ الآن بتصميم أول بطاقة مستوحاة من شخصيات Wuthering Waves (Resonators)"
              action={<button onClick={openNewCard} className="btn-primary">تصميم أول بطاقة</button>}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredCards.map(c => (
                <div key={c.id} className="glass-card rounded-2xl p-3 flex flex-col items-center gap-3 relative group">
                  {/* Status Tag */}
                  <div className="absolute top-5 right-5 z-20">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${
                        c.is_published
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {c.is_published ? 'منشورة' : 'مسودة'}
                    </span>
                  </div>

                  {/* Card Renderer */}
                  <div className="w-full flex justify-center py-2">
                    <CardRenderer card={c} size="sm" interactive={false} />
                  </div>

                  {/* Action buttons */}
                  <div className="w-full grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-700/50">
                    <button
                      onClick={() => openEditCard(c)}
                      className="btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1"
                      title="تعديل في المصمم"
                    >
                      <Edit3 size={12} />
                      تعديل
                    </button>
                    <button
                      onClick={() => duplicateCard(c)}
                      className="btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1"
                      title="نسخ التصميم"
                    >
                      <Copy size={12} />
                      نسخ
                    </button>
                    <button
                      onClick={() => handleTogglePublish(c)}
                      className={`text-xs py-1.5 px-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors ${
                        c.is_published
                          ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                      }`}
                      title={c.is_published ? 'إلغاء النشر' : 'نشر'}
                    >
                      {c.is_published ? <EyeOff size={12} /> : <Globe size={12} />}
                      {c.is_published ? 'إخفاء' : 'نشر'}
                    </button>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(c)}
                    className="w-full text-xs py-1 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <Trash2 size={12} />
                    حذف البطاقة
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Designer View (Split Screen) */
        <div className="space-y-6">
          {/* Top Bar Navigation & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-primary-500/30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('list')}
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
              >
                <ArrowRight size={14} />
                العودة للقائمة
              </button>
              <div>
                <h2 className="text-lg font-black text-white">
                  {editingCardId ? `تعديل: ${form.name || 'بطاقة'}` : 'إنشاء وتصميم بطاقة جديدة'}
                </h2>
                <span className="text-xs text-slate-400">
                  معاينة فورية ثلاثية الأبعاد مع تأثيرات هولوغرافية كاملة
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSaveTemplateModal(true)}
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-1"
                title="حفظ هذه الإعدادات كقالب عام"
              >
                <Save size={14} />
                حفظ كقالب
              </button>

              <button
                onClick={() => handleSaveCard(false)}
                disabled={isSaving}
                className="btn-secondary text-xs px-4 py-2 font-bold"
              >
                حفظ كمسودة
              </button>

              <button
                onClick={() => handleSaveCard(true)}
                disabled={isSaving}
                className="btn-primary text-xs px-5 py-2 font-bold"
              >
                <Check size={14} />
                {isSaving ? 'جارٍ الحفظ...' : 'حفظ ونشر'}
              </button>
            </div>
          </div>

          {/* Main Workspace (Split Screen) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Live 3D Preview (5 Cols) */}
            <div className="lg:col-span-5 glass-card rounded-3xl p-6 flex flex-col items-center justify-center min-h-[550px] relative overflow-hidden border border-white/10 sticky top-4">
              {/* Star Background for preview */}
              <div className="absolute inset-0 bg-radial-gradient from-primary-950/40 via-[#0a0a16] to-[#040408] pointer-events-none" />

              {/* Preview Size Control Bar */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
                {(['md', 'lg', 'xl'] as const).map(sz => (
                  <button
                    key={sz}
                    onClick={() => setPreviewSize(sz)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                      previewSize === sz ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sz.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Hint badge */}
              <div className="absolute bottom-4 left-4 z-20 text-[11px] text-slate-500 flex items-center gap-1 pointer-events-none bg-black/50 px-2 py-1 rounded-md">
                <Sliders size={12} />
                حرّك الفأرة فوق البطاقة لتفعيل التأثير ثلاثي الأبعاد واللمعان
              </div>

              {/* 3D Card Live Render */}
              <div className="py-8">
                <CardRenderer
                  card={previewCard}
                  size={previewSize}
                  interactive={true}
                  serialNumber={form.is_limited ? 1 : null}
                />
              </div>
            </div>

            {/* Right Column: Customization Controls (7 Cols) */}
            <div className="lg:col-span-7 glass-card rounded-3xl p-6 space-y-6 border border-white/10">
              {/* Tabs Navigation */}
              <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3 overflow-x-auto">
                {[
                  { id: 'meta', label: 'البيانات الأساسية', icon: Type },
                  { id: 'combat', label: 'القتال والمهارات RPG', icon: Swords },
                  { id: 'media', label: 'الصور والوسائط', icon: ImageIcon },
                  { id: 'frame', label: 'الإطار والألوان', icon: Palette },
                  { id: 'holo', label: 'التأثير الهولوغرافي', icon: Sparkles },
                  { id: 'edition', label: 'النسخ المحدودة والنشر', icon: Shield },
                ].map(tab => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-500 to-indigo-600 text-white shadow-lg'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Tab 1: Metadata */}
              {activeTab === 'meta' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">اسم البطاقة الرئيسي *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="مثال: Changli - Vermilion Bird"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="field-label">العنوان أو اللقب (Title)</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="مثال: Master Strategist"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">العنوان الفرعي (Subtitle)</label>
                      <input
                        type="text"
                        value={form.subtitle}
                        onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                        placeholder="مثال: تشانغلي - مستشارة جينتشو"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="field-label">النص الزخرفي (Badge Text)</label>
                      <input
                        type="text"
                        value={form.decorative_text}
                        onChange={e => setForm(f => ({ ...f, decorative_text: e.target.value }))}
                        placeholder="مثال: LEGENDARY RESONATOR"
                        className="input-field uppercase tracking-wider"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Character selector */}
                    <div>
                      <label className="field-label">ربط بشخصية (Resonator)</label>
                      <select
                        value={form.character_id}
                        onChange={e => handleSelectCharacter(e.target.value)}
                        className="select-field"
                      >
                        <option value="">بدون ربط (مخصص)</option>
                        {characters.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.alternate_name ? `(${c.alternate_name})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Element */}
                    <div>
                      <label className="field-label">عنصر الـ Resonator (Element)</label>
                      <select
                        value={form.element}
                        onChange={e => setForm(f => ({ ...f, element: e.target.value }))}
                        className="select-field"
                      >
                        {Object.entries(ELEMENT_MAP).map(([key, val]) => (
                          <option key={key} value={key}>
                            {val.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Set */}
                    <div>
                      <label className="field-label">مجموعة البطاقة (Set)</label>
                      <select
                        value={form.set_id}
                        onChange={e => setForm(f => ({ ...f, set_id: e.target.value }))}
                        className="select-field"
                      >
                        <option value="">بدون مجموعة</option>
                        {sets.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.season || 'S1'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="field-label">وصف البطاقة (Story / Lore)</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                      placeholder="اكتب قصة أو وصف للـ Resonator وقدراته الفريدة..."
                      className="input-field resize-none text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Media & Images */}
              {activeTab === 'media' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-700/50 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon size={16} className="text-primary-400" />
                      صورة الشخصية الأساسية (Character Artwork) *
                    </h3>
                    <p className="text-xs text-slate-400">
                      يمكنك اختيار صورة من الشخصيات المسجلة مباشرة، أو رفع صورة خاصة بجودة عالية عبر الزر أدناه:
                    </p>

                    <ImageUpload
                      bucket="card-images"
                      currentPath={form.image_path || null}
                      onUploaded={path => setForm(f => ({ ...f, image_path: path }))}
                      label="رفع صورة جديدة للبطاقة"
                      aspectRatio="square"
                    />

                    {/* Quick Pick from Existing Character Assets */}
                    {characters.length > 0 && (
                      <div className="pt-2">
                        <label className="field-label text-xs">أو اختر صورة جاهزة من شخصيات الموقع:</label>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {characters.filter(c => c.image_path).map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setForm(f => ({ ...f, image_path: c.image_path || '' }))}
                              className={`flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                                form.image_path === c.image_path ? 'border-primary-400 scale-105' : 'border-slate-700 opacity-60 hover:opacity-100'
                              }`}
                              title={c.name}
                            >
                              <img src={c.image_path || ''} alt={c.name} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Optional Background Texture */}
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-700/50 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers size={16} className="text-indigo-400" />
                      خامة الخلفية الاختيارية (Background Texture)
                    </h3>
                    <p className="text-xs text-slate-400">
                      صورة إضافية تُدمج مع تدرج الخلفية لإضفاء تأثير خامة فضائية أو رونية ساحرة:
                    </p>
                    <ImageUpload
                      bucket="card-images"
                      currentPath={form.background_image_path || null}
                      onUploaded={path => setForm(f => ({ ...f, background_image_path: path }))}
                      label="رفع خامة خلفية (اختياري)"
                      aspectRatio="wide"
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Frame & Styling */}
              {activeTab === 'frame' && (
                <div className="space-y-5">
                  {/* Base Template / Preset Selection */}
                  <div>
                    <label className="field-label">اختيار القالب الأساسي (Base Template)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {templates.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelectTemplate(t.id)}
                          className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                            form.template_id === t.id
                              ? 'border-primary-400 bg-primary-500/15 shadow-md'
                              : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                          }`}
                        >
                          <span className="text-xs font-bold text-white">{t.name}</span>
                          <span className="text-[10px] font-mono mt-1" style={{ color: t.border_color }}>
                            {t.rarity.toUpperCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rarity */}
                  <div>
                    <label className="field-label">درجة الندرة (Rarity Tier)</label>
                    <div className="grid grid-cols-5 gap-2">
                      {(['common', 'rare', 'epic', 'legendary', 'mythic'] as CardRarity[]).map(r => {
                        const info = RARITY_LABELS[r]
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => handleRarityChange(r)}
                            className={`p-2 rounded-xl border text-center transition-all ${
                              form.rarity === r
                                ? 'border-primary-400 bg-primary-500/20 scale-105 shadow-md'
                                : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                            }`}
                          >
                            <span className="text-xs font-black block" style={{ color: info.color }}>
                              {info.stars} ★
                            </span>
                            <span className="text-[10px] text-slate-300 font-semibold block capitalize truncate mt-0.5">
                              {r}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Frame Color & Glow */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">لون الإطار الرئيسي (Border Color)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={form.border_color}
                          onChange={e => setForm(f => ({ ...f, border_color: e.target.value }))}
                          className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          value={form.border_color}
                          onChange={e => setForm(f => ({ ...f, border_color: e.target.value }))}
                          className="input-field text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="field-label">لون التوهج (Glow Color)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={form.glow_color}
                          onChange={e => setForm(f => ({ ...f, glow_color: e.target.value }))}
                          placeholder="rgba(99, 102, 241, 0.5)"
                          className="input-field text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Border Width & Radius Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="field-label text-xs">سماكة الإطار: {form.border_width}px</label>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        step="0.5"
                        value={form.border_width}
                        onChange={e => setForm(f => ({ ...f, border_width: parseFloat(e.target.value) }))}
                        className="w-full accent-primary-500"
                      />
                    </div>
                    <div>
                      <label className="field-label text-xs">استدارة الحواف: {form.border_radius}px</label>
                      <input
                        type="range"
                        min="8"
                        max="32"
                        step="2"
                        value={form.border_radius}
                        onChange={e => setForm(f => ({ ...f, border_radius: parseInt(e.target.value) }))}
                        className="w-full accent-primary-500"
                      />
                    </div>
                    <div>
                      <label className="field-label text-xs">انتشار التوهج: {form.glow_spread}px</label>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="2"
                        value={form.glow_spread}
                        onChange={e => setForm(f => ({ ...f, glow_spread: parseInt(e.target.value) }))}
                        className="w-full accent-primary-500"
                      />
                    </div>
                  </div>

                  {/* Background Gradient */}
                  <div>
                    <label className="field-label">تدرج ألوان الخلفية (CSS Background Gradient)</label>
                    <input
                      type="text"
                      value={form.bg_gradient}
                      onChange={e => setForm(f => ({ ...f, bg_gradient: e.target.value }))}
                      className="input-field text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Holographic & Foil Effects */}
              {activeTab === 'holo' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    المؤثرات الضوئية والهولوغرافية (Shine & Foil Shaders)
                  </h3>
                  <p className="text-xs text-slate-400">
                    اختر طبقة اللمعان الخاصة بالبطاقة التي تتفاعل فوراً مع حركة مؤشر الفأرة أو لمس الشاشة:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'none', title: 'بدون تأثير هولوغرافي', desc: 'مناسب للبطاقات الشائعة ذات التصميم البسيط', tag: 'Common' },
                      { id: 'subtle_blue', title: 'لمعان أزرق سماوي (Azure Shimmer)', desc: 'توهج موجي أزرق ينعكس برقة', tag: 'Rare' },
                      { id: 'purple_pulse', title: 'نبض كهرومغناطيسي بنفسجي (Violet Pulse)', desc: 'تموجات بنفسجية تتلألأ عند زوايا الضوء', tag: 'Epic' },
                      { id: 'golden_rays', title: 'أشعة شمسية ذهبية (Solar Flare Foil)', desc: 'حزمة ذهبية ساطعة تعبر سطح البطاقة', tag: 'Legendary' },
                      { id: 'rainbow_hologram', title: 'هولوغرام طيفي موشوري (Prism Astral Hologram)', desc: 'انعكاس قوس قزح هولوغرافي فاخر ومتحرك', tag: 'Mythic' },
                    ].map(h => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, holo_effect: h.id as any }))}
                        className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                          form.holo_effect === h.id
                            ? 'border-amber-400 bg-amber-500/10 shadow-lg'
                            : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{h.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
                            {h.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">{h.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: Edition & Publishing */}
              {activeTab === 'edition' && (
                <div className="space-y-5">
                  {/* Limited Edition Box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-transparent border border-amber-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                          <Crown size={16} />
                          بطاقة محدودة الإصدار (Limited Edition)
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          تحديد سقف أقصى للنسخ التي يمكن أن يمتلكها جميع اللاعبين (مثل 100 نسخة فقط برقم تسلسلي فريد).
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.is_limited}
                        onChange={e => setForm(f => ({ ...f, is_limited: e.target.checked }))}
                        className="w-5 h-5 accent-amber-500 cursor-pointer"
                      />
                    </div>

                    {form.is_limited && (
                      <div className="pt-2">
                        <label className="field-label text-xs">الحد الأقصى للنسخ المتاحة للتوزيع (Max Supply) *</label>
                        <input
                          type="number"
                          value={form.max_supply}
                          onChange={e => setForm(f => ({ ...f, max_supply: e.target.value }))}
                          placeholder="مثال: 100"
                          min="1"
                          max="100000"
                          className="input-field text-sm font-mono max-w-xs"
                        />
                        <span className="text-[11px] text-slate-400 block mt-1">
                          سيتوقف النظام تلقائياً عن منح هذه البطاقة في البوكسات بمجرد استنفاد هذا العدد.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Publish Switch */}
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-700/50 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Globe size={16} className="text-emerald-400" />
                        نشر البطاقة في النظام
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        البطاقات المنشورة فقط هي التي تظهر في متجر البوكسات، مجموعة اللاعبين، وسوق التبادل.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.is_published}
                      onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                      className="w-5 h-5 accent-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Tab 6: Combat Stats & RPG Skills */}
              {activeTab === 'combat' && (
                <div className="space-y-6">
                  {/* Top explanation note */}
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
                    <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-1.5">
                      <Swords size={16} />
                      نظام القتال الفعلي ومحرك المعارك (RPG Combat System)
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      هذه الإحصائيات تؤثر مباشرة في حسابات الضرر والامتصاص وحياة اللاعبين داخل مواجهات الـ PvP.
                      يتم احتساب الضرر بعد امتصاص الدرع أولاً، ثم تقليل الدفاع، مع دعم الإحياء والضربات الحرجة.
                    </p>
                  </div>

                  {/* Section 1: Basic Stats (Flat values) */}
                  <div>
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Zap size={14} />
                      1. الإحصائيات الأساسية (قيم ثابتة - Points)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="field-label text-[11px]">نقاط الحياة (HP)</label>
                        <input
                          type="number"
                          value={form.stats.hp}
                          onChange={e => {
                            const val = Math.max(1, parseInt(e.target.value) || 0)
                            setForm(f => ({ ...f, stats: { ...f.stats, hp: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="1"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">صحة البطاقة القصوى</span>
                      </div>
                      <div>
                        <label className="field-label text-[11px]">قوة الهجوم (ATK)</label>
                        <input
                          type="number"
                          value={form.stats.atk}
                          onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0)
                            setForm(f => ({ ...f, stats: { ...f.stats, atk: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="0"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">ضرر الهجوم الأساسي</span>
                      </div>
                      <div>
                        <label className="field-label text-[11px]">الدفاع (DEF)</label>
                        <input
                          type="number"
                          value={form.stats.def}
                          onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0)
                            setForm(f => ({ ...f, stats: { ...f.stats, def: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="0"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">تقليل الضرر المباشر</span>
                      </div>
                      <div>
                        <label className="field-label text-[11px]">قوة الدرع (SHIELD)</label>
                        <input
                          type="number"
                          value={form.stats.shield}
                          onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0)
                            setForm(f => ({ ...f, stats: { ...f.stats, shield: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="0"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">امتصاص ضرر قبل الـ HP</span>
                      </div>
                      <div>
                        <label className="field-label text-[11px]">قوة العلاج (HEAL)</label>
                        <input
                          type="number"
                          value={form.stats.heal}
                          onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0)
                            setForm(f => ({ ...f, stats: { ...f.stats, heal: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="0"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">استعادة نقاط الحياة</span>
                      </div>
                      <div>
                        <label className="field-label text-[11px]">السرعة (SPEED)</label>
                        <input
                          type="number"
                          value={form.stats.speed}
                          onChange={e => {
                            const val = Math.max(1, parseInt(e.target.value) || 0)
                            setForm(f => ({ ...f, stats: { ...f.stats, speed: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="1"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">أسبقية تنفيذ الأدوار</span>
                      </div>
                      <div>
                        <label className="field-label text-[11px]">الطاقة (ENERGY)</label>
                        <input
                          type="number"
                          value={form.stats.energy}
                          onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0)
                            setForm(f => ({ ...f, stats: { ...f.stats, energy: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="0"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">مخزون تفعيل المهارات</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Percentage & Tactical Stats */}
                  <div className="pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <ShieldAlert size={14} />
                      2. النسب المئوية والتكتيكات المتقدمة (% Percentages)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="field-label text-[11px]">نسبة الحرج (CRIT %) *</label>
                        <input
                          type="number"
                          value={form.stats.crit_rate}
                          onChange={e => {
                            const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                            setForm(f => ({ ...f, stats: { ...f.stats, crit_rate: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="0"
                          max="100"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">فرصة مضاعفة الضرر</span>
                      </div>
                      <div>
                        <label className="field-label text-[11px]">ضرر الحرج (CRIT DMG %)</label>
                        <input
                          type="number"
                          value={form.stats.crit_dmg}
                          onChange={e => {
                            const val = Math.max(100, parseInt(e.target.value) || 100)
                            setForm(f => ({ ...f, stats: { ...f.stats, crit_dmg: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="100"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">150% = 1.5x من الهجوم</span>
                      </div>
                      <div>
                        <label className="field-label text-[11px]">سرقة الحياة (LIFESTEAL %)</label>
                        <input
                          type="number"
                          value={form.stats.lifesteal}
                          onChange={e => {
                            const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                            setForm(f => ({ ...f, stats: { ...f.stats, lifesteal: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="0"
                          max="100"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">% من الضرر الفعلي الملحق</span>
                      </div>
                      <div>
                        <label className="field-label text-[11px]">تقليل الضرر (DMG RED %)</label>
                        <input
                          type="number"
                          value={form.stats.damage_reduction}
                          onChange={e => {
                            const val = Math.min(90, Math.max(0, parseInt(e.target.value) || 0))
                            setForm(f => ({ ...f, stats: { ...f.stats, damage_reduction: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="0"
                          max="90"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">خصم نسبي من الضرر الوارد</span>
                      </div>
                      <div>
                        <label className="field-label text-[11px]">تعزيز العلاج (HEAL BONUS %)</label>
                        <input
                          type="number"
                          value={form.stats.heal_bonus}
                          onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0)
                            setForm(f => ({ ...f, stats: { ...f.stats, heal_bonus: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="0"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">نسبة زيادة قوة العلاج</span>
                      </div>
                      <div>
                        <label className="field-label text-[11px]">تعزيز الدرع (SHIELD BONUS %)</label>
                        <input
                          type="number"
                          value={form.stats.shield_bonus}
                          onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0)
                            setForm(f => ({ ...f, stats: { ...f.stats, shield_bonus: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="0"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">نسبة زيادة متانة الدرع</span>
                      </div>
                      <div>
                        <label className="field-label text-[11px]">مرات الإحياء (REVIVE)</label>
                        <input
                          type="number"
                          value={form.stats.revive_count}
                          onChange={e => {
                            const val = Math.min(3, Math.max(0, parseInt(e.target.value) || 0))
                            setForm(f => ({ ...f, stats: { ...f.stats, revive_count: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="0"
                          max="3"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">العودة بعد وصول HP لصفر</span>
                      </div>
                      <div>
                        <label className="field-label text-[11px]">HP الإحياء (REVIVE HP %)</label>
                        <input
                          type="number"
                          value={form.stats.revive_hp_pct}
                          onChange={e => {
                            const val = Math.min(100, Math.max(10, parseInt(e.target.value) || 30))
                            setForm(f => ({ ...f, stats: { ...f.stats, revive_hp_pct: val } }))
                          }}
                          className="input-field text-sm font-mono"
                          min="10"
                          max="100"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">% المستعادة من HP الأقصى</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Combat Skills Builder */}
                  <div className="pt-4 border-t border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Zap size={14} />
                          3. المهارات والقدرات القتالية (Active & Passive Skills)
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          يمكن للبطاقة امتلاك عدة مهارات يتم تفعيلها باستهلاك الطاقة داخل المواجهة
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newSkill: CardCombatSkill = {
                            id: `skill-${Date.now()}`,
                            name: 'مهارة جديدة',
                            description: 'تأثير قتالي خاص',
                            type: 'attack',
                            target: 'opponent',
                            effect_type: 'damage',
                            value: 100,
                            value_type: 'flat',
                            energy_cost: 25,
                            cooldown: 1,
                            max_uses: 99,
                          }
                          setForm(f => ({ ...f, skills: [...f.skills, newSkill] }))
                        }}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                      >
                        <Plus size={14} />
                        إضافة مهارة
                      </button>
                    </div>

                    {form.skills.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-700 text-center text-xs text-slate-400">
                        لا توجد مهارات مخصصة لهذه البطاقة حتى الآن. انقر على &quot;إضافة مهارة&quot; لإنشاء مهارة جديدة.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {form.skills.map((skill, idx) => (
                          <div key={skill.id || idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                                ⚡ مهارة #{idx + 1}: {skill.name || 'بدون اسم'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setForm(f => ({
                                    ...f,
                                    skills: f.skills.filter((_, sIdx) => sIdx !== idx),
                                  }))
                                }}
                                className="text-red-400 hover:text-red-300 text-xs p-1 rounded-md hover:bg-red-500/10 flex items-center gap-1"
                              >
                                <Trash2 size={12} />
                                حذف
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="field-label text-[11px]">اسم المهارة</label>
                                <input
                                  type="text"
                                  value={skill.name}
                                  onChange={e => {
                                    const val = e.target.value
                                    setForm(f => {
                                      const updated = [...f.skills]
                                      updated[idx] = { ...updated[idx], name: val }
                                      return { ...f, skills: updated }
                                    })
                                  }}
                                  placeholder="مثال: رقصة اللهب الأزرق"
                                  className="input-field text-xs"
                                />
                              </div>
                              <div>
                                <label className="field-label text-[11px]">وصف المهارة</label>
                                <input
                                  type="text"
                                  value={skill.description}
                                  onChange={e => {
                                    const val = e.target.value
                                    setForm(f => {
                                      const updated = [...f.skills]
                                      updated[idx] = { ...updated[idx], description: val }
                                      return { ...f, skills: updated }
                                    })
                                  }}
                                  placeholder="مثال: إلحاق ضرر نار بنسبة 140% مع زيادة الدرع"
                                  className="input-field text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="field-label text-[11px]">نوع المهارة</label>
                                <select
                                  value={skill.type}
                                  onChange={e => {
                                    const val = e.target.value as any
                                    setForm(f => {
                                      const updated = [...f.skills]
                                      updated[idx] = { ...updated[idx], type: val }
                                      return { ...f, skills: updated }
                                    })
                                  }}
                                  className="select-field text-xs py-1.5"
                                >
                                  <option value="attack">هجوم قاطع (Attack)</option>
                                  <option value="heal">علاج فوري (Heal)</option>
                                  <option value="shield">درع حماية (Shield)</option>
                                  <option value="buff">تعزيز ذاتي (Buff)</option>
                                  <option value="debuff">إضعاف الخصم (Debuff)</option>
                                  <option value="revive">إحياء طارئ (Revive)</option>
                                </select>
                              </div>
                              <div>
                                <label className="field-label text-[11px]">المستهدف</label>
                                <select
                                  value={skill.target}
                                  onChange={e => {
                                    const val = e.target.value as any
                                    setForm(f => {
                                      const updated = [...f.skills]
                                      updated[idx] = { ...updated[idx], target: val }
                                      return { ...f, skills: updated }
                                    })
                                  }}
                                  className="select-field text-xs py-1.5"
                                >
                                  <option value="opponent">الخصم (Opponent)</option>
                                  <option value="self">الذات (Self)</option>
                                  <option value="all">الكل (All)</option>
                                </select>
                              </div>
                              <div>
                                <label className="field-label text-[11px]">نوع التأثير</label>
                                <select
                                  value={skill.effect_type}
                                  onChange={e => {
                                    const val = e.target.value as any
                                    setForm(f => {
                                      const updated = [...f.skills]
                                      updated[idx] = { ...updated[idx], effect_type: val }
                                      return { ...f, skills: updated }
                                    })
                                  }}
                                  className="select-field text-xs py-1.5"
                                >
                                  <option value="damage">ضرر مباشر (Damage)</option>
                                  <option value="heal">استعادة صحة (Heal)</option>
                                  <option value="shield">امتصاص درع (Shield)</option>
                                  <option value="damage_reduction">تقليل ضرر (Damage Reduction)</option>
                                  <option value="atk_debuff">إضعاف هجوم الخصم</option>
                                  <option value="def_debuff">كسر دفاع الخصم</option>
                                </select>
                              </div>
                              <div>
                                <label className="field-label text-[11px]">نوع القيمة</label>
                                <select
                                  value={skill.value_type}
                                  onChange={e => {
                                    const val = e.target.value as any
                                    setForm(f => {
                                      const updated = [...f.skills]
                                      updated[idx] = { ...updated[idx], value_type: val }
                                      return { ...f, skills: updated }
                                    })
                                  }}
                                  className="select-field text-xs py-1.5"
                                >
                                  <option value="flat">رقم ثابت (Flat Points)</option>
                                  <option value="percentage">نسبة مئوية (% Percentage)</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="field-label text-[11px]">مقدار التأثير ({skill.value_type === 'percentage' ? '%' : 'نقطة'})</label>
                                <input
                                  type="number"
                                  value={skill.value}
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 0
                                    setForm(f => {
                                      const updated = [...f.skills]
                                      updated[idx] = { ...updated[idx], value: val }
                                      return { ...f, skills: updated }
                                    })
                                  }}
                                  className="input-field text-xs font-mono"
                                />
                              </div>
                              <div>
                                <label className="field-label text-[11px]">تكلفة الطاقة</label>
                                <input
                                  type="number"
                                  value={skill.energy_cost}
                                  onChange={e => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0)
                                    setForm(f => {
                                      const updated = [...f.skills]
                                      updated[idx] = { ...updated[idx], energy_cost: val }
                                      return { ...f, skills: updated }
                                    })
                                  }}
                                  className="input-field text-xs font-mono"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="field-label text-[11px]">فترة الانتظار (Cooldown)</label>
                                <input
                                  type="number"
                                  value={skill.cooldown}
                                  onChange={e => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0)
                                    setForm(f => {
                                      const updated = [...f.skills]
                                      updated[idx] = { ...updated[idx], cooldown: val }
                                      return { ...f, skills: updated }
                                    })
                                  }}
                                  className="input-field text-xs font-mono"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="field-label text-[11px]">أقصى استخدام بالمباراة</label>
                                <input
                                  type="number"
                                  value={skill.max_uses}
                                  onChange={e => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1)
                                    setForm(f => {
                                      const updated = [...f.skills]
                                      updated[idx] = { ...updated[idx], max_uses: val }
                                      return { ...f, skills: updated }
                                    })
                                  }}
                                  className="input-field text-xs font-mono"
                                  min="1"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Quick Action Bar */}
              <div className="pt-4 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  الحالة الحالية: <strong className={form.is_published ? 'text-emerald-400' : 'text-amber-400'}>
                    {form.is_published ? 'سيتم نشرها فوراً' : 'مسودة خاصة بالإدارة'}
                  </strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveCard(false)}
                    disabled={isSaving}
                    className="btn-secondary text-xs px-4 py-2.5 font-bold"
                  >
                    حفظ كمسودة
                  </button>

                  <button
                    onClick={() => handleSaveCard(true)}
                    disabled={isSaving}
                    className="btn-primary text-xs px-6 py-2.5 font-bold"
                  >
                    <Check size={16} />
                    {isSaving ? 'جارٍ الحفظ...' : 'حفظ ونشر البطاقة'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      <Modal
        isOpen={saveTemplateModal}
        onClose={() => setSaveTemplateModal(false)}
        title="حفظ التصميم كقالب جديد"
      >
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-400">
            سيتم حفظ جميع خيارات الإطار والألوان والتوهج والتأثير الهولوغرافي لاستخدامها بنقرة واحدة لبطاقات أخرى:
          </p>
          <div>
            <label className="field-label">اسم القالب الجديد *</label>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="مثال: إطار جينتشو الأسطوري"
              className="input-field"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveAsTemplate}
              disabled={!templateName.trim()}
              className="btn-primary flex-1 text-xs py-2.5"
            >
              حفظ القالب
            </button>
            <button
              onClick={() => setSaveTemplateModal(false)}
              className="btn-secondary flex-1 text-xs py-2.5"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteCard}
        title="حذف تعريف البطاقة"
        message={`هل أنت متأكد من حذف بطاقة "${deleteConfirm?.name}"؟ إذا كان هناك لاعبون يمتلكون هذه البطاقة، سيتم منع الحذف لسلامة المحافظ.`}
        confirmLabel="تأكيد الحذف"
        cancelLabel="إلغاء"
        variant="danger"
      />
    </div>
  )
}
