import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Box as BoxIcon, Plus, Edit3, Trash2, Check, X, 
  Sparkles, Layers, Shield, Coins, AlertCircle, RefreshCw, 
  Eye, Calendar, ArrowRight, Percent, Award, Image as ImageIcon
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store'
import { LoadingSpinner, EmptyState, ConfirmDialog, Modal } from '../shared/UI'
import type { Card } from '../../types/database'
import toast from 'react-hot-toast'

interface BoxItem {
  id: string
  name: string
  name_ar: string
  description_ar: string
  image_url: string
  price: number
  multi_price: number
  multi_count: number
  badge: string
  accent_color: string
  pity_threshold: number
  guaranteed_rarity: string
  is_active: boolean
  is_limited: boolean
  duplicate_policy: string
  total_pulls: number
  sort_order: number
  starts_at?: string | null
  ends_at?: string | null
  created_at: string
  cards_count?: number
}

interface BoxCardRate {
  card_id: string
  weight: number
  drop_rate_pct: number
  card?: Card
}

interface BoxForm {
  name: string
  name_ar: string
  description_ar: string
  image_url: string
  price: number
  multi_price: number
  multi_count: number
  badge: string
  accent_color: string
  pity_threshold: number
  guaranteed_rarity: string
  is_active: boolean
  is_limited: boolean
  duplicate_policy: string
  starts_at: string
  ends_at: string
}

const INITIAL_FORM: BoxForm = {
  name: '',
  name_ar: '',
  description_ar: '',
  image_url: '',
  price: 100,
  multi_price: 900,
  multi_count: 10,
  badge: 'مميز',
  accent_color: '#f59e0b',
  pity_threshold: 80,
  guaranteed_rarity: 'legendary',
  is_active: true,
  is_limited: false,
  duplicate_policy: 'keep_copies',
  starts_at: '',
  ends_at: '',
}

export function AdminBoxes() {
  const admin = useAuthStore(state => state.admin)
  const [boxes, setBoxes] = useState<BoxItem[]>([])
  const [availableCards, setAvailableCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)

  // Edit/Create Modal
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null)
  const [form, setForm] = useState<BoxForm>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  // Card Rates Modal
  const [ratesModalBox, setRatesModalBox] = useState<BoxItem | null>(null)
  const [boxCards, setBoxCards] = useState<BoxCardRate[]>([])
  const [selectedCardToAdd, setSelectedCardToAdd] = useState('')
  const [newCardWeight, setNewCardWeight] = useState(10)
  const [savingRates, setSavingRates] = useState(false)

  // Delete
  const [deleteBox, setDeleteBox] = useState<BoxItem | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [boxesRes, cardsRes] = await Promise.all([
        supabase.from('boxes').select('*, box_cards(count)').order('sort_order', { ascending: true }),
        supabase.from('cards').select('*').order('name', { ascending: true }),
      ])

      if (boxesRes.data) {
        const formatted = (boxesRes.data as any[]).map(b => ({
          ...b,
          cards_count: b.box_cards?.[0]?.count || 0
        }))
        setBoxes(formatted as BoxItem[])
      }
      if (cardsRes.data) setAvailableCards(cardsRes.data as Card[])
    } catch (err) {
      console.error(err)
      toast.error('فشل تحميل الصناديق')
    } finally {
      setLoading(false)
    }
  }

  const openNewBoxModal = () => {
    setEditingBoxId(null)
    setForm(INITIAL_FORM)
    setFormModalOpen(true)
  }

  const openEditBoxModal = (box: BoxItem) => {
    setEditingBoxId(box.id)
    setForm({
      name: box.name,
      name_ar: box.name_ar || box.name,
      description_ar: box.description_ar || '',
      image_url: box.image_url || '',
      price: box.price,
      multi_price: box.multi_price || box.price * 9,
      multi_count: box.multi_count || 10,
      badge: box.badge || 'مميز',
      accent_color: box.accent_color || '#f59e0b',
      pity_threshold: box.pity_threshold || 80,
      guaranteed_rarity: box.guaranteed_rarity || 'legendary',
      is_active: box.is_active,
      is_limited: box.is_limited || false,
      duplicate_policy: box.duplicate_policy || 'keep_copies',
      starts_at: box.starts_at ? box.starts_at.substring(0, 16) : '',
      ends_at: box.ends_at ? box.ends_at.substring(0, 16) : '',
    })
    setFormModalOpen(true)
  }

  const handleSaveBox = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name_ar.trim()) return toast.error('يرجى إدخال اسم الصندوق')
    if (form.price <= 0) return toast.error('يجب أن يكون السعر أكبر من صفر')

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim() || form.name_ar.trim(),
        name_ar: form.name_ar.trim(),
        description_ar: form.description_ar.trim(),
        image_url: form.image_url.trim() || '/logo.jpeg',
        price: form.price,
        multi_price: form.multi_price,
        multi_count: form.multi_count,
        badge: form.badge.trim(),
        accent_color: form.accent_color,
        pity_threshold: form.pity_threshold,
        guaranteed_rarity: form.guaranteed_rarity,
        is_active: form.is_active,
        is_limited: form.is_limited,
        duplicate_policy: form.duplicate_policy,
        starts_at: form.is_limited && form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.is_limited && form.ends_at ? new Date(form.ends_at).toISOString() : null,
      }

      const { data: result, error } = await supabase.rpc('admin_save_box', {
        p_admin_id: admin?.id || null,
        p_box_id: editingBoxId || null,
        p_name: payload.name,
        p_name_ar: payload.name_ar,
        p_description_ar: payload.description_ar,
        p_image_url: payload.image_url,
        p_price: payload.price,
        p_multi_price: payload.multi_price,
        p_multi_count: payload.multi_count,
        p_badge: payload.badge,
        p_accent_color: payload.accent_color,
        p_is_active: payload.is_active,
        p_is_limited: payload.is_limited,
        p_starts_at: payload.starts_at,
        p_ends_at: payload.ends_at,
        p_pity_threshold: payload.pity_threshold,
        p_guaranteed_rarity: payload.guaranteed_rarity,
        p_duplicate_policy: payload.duplicate_policy,
        p_cards: []
      })

      if (error) throw error
      if (!result?.success) throw new Error(result?.message || 'فشل حفظ الصندوق')

      toast.success(editingBoxId ? 'تم تحديث الصندوق بنجاح! 📦' : 'تم إنشاء الصندوق بنجاح! 🎁')
      setFormModalOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل حفظ الصندوق')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleBoxStatus = async (box: BoxItem) => {
    try {
      const { data: result, error } = await supabase.rpc('admin_save_box', {
        p_admin_id: admin?.id || null,
        p_box_id: box.id,
        p_name_ar: box.name_ar,
        p_price: box.price,
        p_is_active: !box.is_active
      })

      if (error) throw error
      if (!result?.success) throw new Error(result?.message || 'فشل تعديل الحالة')

      toast.success(box.is_active ? 'تم تعطيل الصندوق' : 'تم تفعيل الصندوق')
      await loadData()
    } catch (err) {
      toast.error('فشل تغيير حالة الصندوق')
    }
  }

  const handleDeleteBox = async () => {
    if (!deleteBox) return
    try {
      // Call safe delete RPC or soft archive
      const { data: res, error } = await supabase.rpc('admin_delete_box', {
        p_admin_id: admin?.id || null,
        p_box_id: deleteBox.id
      })

      if (error || !res?.success) {
        // Fallback: Archive box so prior transaction history remains intact
        await supabase.rpc('admin_save_box', {
          p_admin_id: admin?.id || null,
          p_box_id: deleteBox.id,
          p_name_ar: deleteBox.name_ar,
          p_price: deleteBox.price,
          p_is_active: false
        })
        toast.success('تم أرشفة الصندوق بنجاح لحماية سجلات السحب السابقة 📦')
      } else {
        toast.success('تم حذف الصندوق ومحتوياته')
      }

      setDeleteBox(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل حذف الصندوق')
    }
  }

  // Manage Drop Rates & Cards
  const openRatesModal = async (box: BoxItem) => {
    setRatesModalBox(box)
    try {
      const { data } = await supabase
        .from('box_cards')
        .select('card_id, weight, drop_rate_pct, card:cards(*)')
        .eq('box_id', box.id)
        .order('drop_rate_pct', { ascending: false })

      if (data) {
        setBoxCards(data as any)
      } else {
        setBoxCards([])
      }
    } catch (err) {
      console.error(err)
      toast.error('فشل تحميل بطاقات الصندوق')
    }
  }

  const handleAddCardToBox = () => {
    if (!selectedCardToAdd) return toast.error('اختر بطاقة لإضافتها')
    if (boxCards.some(bc => bc.card_id === selectedCardToAdd)) {
      return toast.error('هذه البطاقة موجودة مسبقاً في هذا الصندوق')
    }

    const cardObj = availableCards.find(c => c.id === selectedCardToAdd)
    const newItems = [
      ...boxCards,
      {
        card_id: selectedCardToAdd,
        weight: newCardWeight,
        drop_rate_pct: 0,
        card: cardObj,
      },
    ]

    // Recalculate percentages
    const totalWeight = newItems.reduce((acc, curr) => acc + (curr.weight || 1), 0)
    const normalized = newItems.map(item => ({
      ...item,
      drop_rate_pct: Math.round(((item.weight || 1) / totalWeight) * 1000) / 10,
    }))

    setBoxCards(normalized)
    setSelectedCardToAdd('')
    setNewCardWeight(10)
  }

  const handleRemoveCardFromBox = (cardId: string) => {
    const remaining = boxCards.filter(bc => bc.card_id !== cardId)
    const totalWeight = remaining.reduce((acc, curr) => acc + (curr.weight || 1), 0)
    const normalized = remaining.map(item => ({
      ...item,
      drop_rate_pct: totalWeight > 0 ? Math.round(((item.weight || 1) / totalWeight) * 1000) / 10 : 0,
    }))
    setBoxCards(normalized)
  }

  const handleWeightChange = (cardId: string, newWeight: number) => {
    const updated = boxCards.map(bc => bc.card_id === cardId ? { ...bc, weight: Math.max(1, newWeight) } : bc)
    const totalWeight = updated.reduce((acc, curr) => acc + (curr.weight || 1), 0)
    const normalized = updated.map(item => ({
      ...item,
      drop_rate_pct: Math.round(((item.weight || 1) / totalWeight) * 1000) / 10,
    }))
    setBoxCards(normalized)
  }

  const handleEqualizeRates = () => {
    if (boxCards.length === 0) return
    const evenPct = Math.round((100 / boxCards.length) * 10) / 10
    const updated = boxCards.map(bc => ({
      ...bc,
      weight: 10,
      drop_rate_pct: evenPct
    }))
    setBoxCards(updated)
    toast.success('تمت موازنة النسب بالتساوي على جميع البطاقات')
  }

  const handleSaveBoxCards = async () => {
    if (!ratesModalBox) return
    setSavingRates(true)
    try {
      const totalWeight = boxCards.reduce((acc, curr) => acc + (curr.weight || 1), 0)
      const toInsert = boxCards.map(bc => ({
        card_id: bc.card_id,
        weight: bc.weight || 10,
        drop_rate_pct: totalWeight > 0 ? Math.round(((bc.weight || 1) / totalWeight) * 1000) / 10 : 0,
      }))

      const { data: res, error } = await supabase.rpc('admin_save_box', {
        p_admin_id: admin?.id || null,
        p_box_id: ratesModalBox.id,
        p_name_ar: ratesModalBox.name_ar,
        p_price: ratesModalBox.price,
        p_cards: toInsert
      })

      if (error) throw error
      if (!res?.success) throw new Error(res?.message || 'فشل حفظ نسب الصندوق')

      toast.success('تم حفظ محتويات ونسب الصندوق بنجاح ✨')
      setRatesModalBox(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل حفظ نسب الصندوق')
    } finally {
      setSavingRates(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BoxIcon className="text-amber-400" size={26} />
            إدارة صناديق السحب (Gacha Boxes)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            التحكم الكامل في أسعار السحب الفردي والجماعي (10x)، نظام الضمان (Pity)، ومحتويات ونسب كل صندوق.
          </p>
        </div>

        <button
          onClick={openNewBoxModal}
          className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2 font-bold shadow-glow-blue"
        >
          <Plus size={16} />
          إنشاء صندوق جديد
        </button>
      </div>

      {/* Boxes Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : boxes.length === 0 ? (
        <EmptyState
          icon={BoxIcon}
          title="لا توجد صناديق بعد"
          description="قم بإنشاء أول صندوق سحب ليتمكن اللاعبون من فتحه والحصول على البطاقات"
          action={{
            label: 'إنشاء أول صندوق',
            onClick: openNewBoxModal,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boxes.map(box => (
            <div
              key={box.id}
              className={`glass-card rounded-3xl p-5 border transition-all relative overflow-hidden flex flex-col justify-between group ${
                box.is_active ? 'border-slate-700/60 hover:border-amber-500/40' : 'border-red-900/40 opacity-75'
              }`}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ background: box.accent_color || '#6366f1' }}
              />

              {/* Status & Badge */}
              <div className="flex items-center justify-between mb-3 z-10">
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-sm"
                  style={{
                    backgroundColor: `${box.accent_color}20`,
                    borderColor: `${box.accent_color}50`,
                    color: box.accent_color,
                  }}
                >
                  {box.badge || 'جديد'}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    box.is_active
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {box.is_active ? 'مفعّل للمستخدمين' : 'معطّل مؤقتاً'}
                </span>
              </div>

              {/* Box Image & Title */}
              <div className="flex items-center gap-4 my-2 z-10">
                <img
                  src={box.image_url}
                  alt={box.name_ar}
                  className="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-lg group-hover:scale-105 transition-transform"
                />
                <div>
                  <h3 className="text-base font-black text-white">{box.name_ar || box.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {box.description_ar || 'صندوق سحب بطاقات مميزة'}
                  </p>
                  <span className="text-[11px] text-amber-400 font-mono font-bold block mt-1">
                    سحبة: ${box.price} | 10 سحبات: ${box.multi_price || box.price * 9}
                  </span>
                </div>
              </div>

              {/* Parameters info */}
              <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-2xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px]">الضمان (Pity):</span>
                  <strong className="text-amber-300 font-bold">{box.pity_threshold || 80} سحبة</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">البطاقات بالداخل:</span>
                  <strong className="text-emerald-300 font-bold">{box.cards_count || 0} بطاقة</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">إجمالي السحبات:</span>
                  <strong className="text-cyan-300 font-mono font-bold">{box.total_pulls || 0}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">نوع المدة:</span>
                  <strong className={box.is_limited ? 'text-amber-400' : 'text-emerald-400'}>
                    {box.is_limited ? 'محدود الوقت ⏳' : 'دائم ♾️'}
                  </strong>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => openRatesModal(box)}
                  className="btn-secondary text-xs py-2 px-2 flex items-center justify-center gap-1"
                  title="التحكم في البطاقات ونسب السحب"
                >
                  <Percent size={12} />
                  النسب والبطاقات
                </button>
                <button
                  onClick={() => openEditBoxModal(box)}
                  className="btn-secondary text-xs py-2 px-2 flex items-center justify-center gap-1"
                  title="تعديل الإعدادات والأسعار"
                >
                  <Edit3 size={12} />
                  تعديل
                </button>
                <button
                  onClick={() => handleToggleBoxStatus(box)}
                  className={`text-xs py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors ${
                    box.is_active
                      ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  }`}
                >
                  {box.is_active ? 'تعطيل' : 'تفعيل'}
                </button>
              </div>

              <div className="mt-2 text-center">
                <button
                  onClick={() => setDeleteBox(box)}
                  className="text-[11px] text-red-400/60 hover:text-red-400 hover:underline transition-colors"
                >
                  حذف أو أرشفة الصندوق
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Box Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingBoxId ? 'تعديل إعدادات الصندوق' : 'إنشاء صندوق سحب جديد'}
      >
        <form onSubmit={handleSaveBox} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">اسم الصندوق (بالعربية) *</label>
              <input
                type="text"
                value={form.name_ar}
                onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))}
                placeholder="مثال: صندوق صدى النجوم الأسطوري"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="field-label">اسم الصندوق (EN / ID)</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="مثال: Resonator Echo Box"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="field-label">وصف الصندوق ومميزاته</label>
            <textarea
              value={form.description_ar}
              onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))}
              placeholder="وصف مشوّق للبطاقات والشخصيات التي يحتويها الصندوق..."
              rows={2}
              className="input-field"
            />
          </div>

          <div>
            <label className="field-label">رابط صورة الصندوق (Image URL)</label>
            <input
              type="text"
              value={form.image_url}
              onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
              placeholder="https://... أو /logo.jpeg"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="field-label">سعر السحبة الواحدة (1x)</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: Math.max(1, parseInt(e.target.value) || 0) }))}
                className="input-field font-mono"
                min="1"
                required
              />
            </div>
            <div>
              <label className="field-label">سعر السحب الجماعي (10x)</label>
              <input
                type="number"
                value={form.multi_price}
                onChange={e => setForm(f => ({ ...f, multi_price: Math.max(1, parseInt(e.target.value) || 0) }))}
                className="input-field font-mono"
                min="1"
                required
              />
            </div>
            <div>
              <label className="field-label">عدد السحبات الجماعية</label>
              <input
                type="number"
                value={form.multi_count}
                onChange={e => setForm(f => ({ ...f, multi_count: Math.max(2, parseInt(e.target.value) || 10) }))}
                className="input-field font-mono"
                min="2"
                max="50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">نظام الضمان (عدد السحبات Pity)</label>
              <input
                type="number"
                value={form.pity_threshold}
                onChange={e => setForm(f => ({ ...f, pity_threshold: Math.max(1, parseInt(e.target.value) || 80) }))}
                className="input-field font-mono"
                min="1"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                سحب بطاقة مضمونة تلقائياً عند وصول العداد لهذا الرقم
              </span>
            </div>
            <div>
              <label className="field-label">الندرة المضمونة في الضمان</label>
              <select
                value={form.guaranteed_rarity}
                onChange={e => setForm(f => ({ ...f, guaranteed_rarity: e.target.value }))}
                className="select-field"
              >
                <option value="mythic">Mythic (ميثيك - 5 نجوم ذهبي)</option>
                <option value="legendary">Legendary (أسطوري)</option>
                <option value="epic">Epic (ملحمي)</option>
                <option value="rare">Rare (نادر)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">نص الشارة العلوية (Badge)</label>
              <input
                type="text"
                value={form.badge}
                onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                placeholder="مثال: مميز أو حصري"
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">لون الشارة المميز (HEX)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.accent_color}
                  onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={form.accent_color}
                  onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))}
                  className="input-field font-mono text-xs flex-1"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="field-label">سياسة معالجة البطاقات المكررة</label>
            <select
              value={form.duplicate_policy}
              onChange={e => setForm(f => ({ ...f, duplicate_policy: e.target.value }))}
              className="select-field"
            >
              <option value="keep_copies">الاحتفاظ بنسخ متعددة في محفظة اللاعب (أرقام تسلسلية مختلفة)</option>
              <option value="convert_shards">تحويل النسخ المكررة إلى شظايا تطوير (Shards)</option>
              <option value="duplicate_bonus">منح دولارات إضافية ($) مع الاحتفاظ بالنسخة</option>
            </select>
          </div>

          {/* Limited time banner switch */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Calendar size={16} className="text-amber-400" />
                  صندوق لفترة محدودة (Limited Time Event)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  تحديد موعد بداية ونهاية توفر هذا الصندوق في المتجر
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="field-label text-xs">تاريخ ووقت البداية</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="field-label text-xs">تاريخ ووقت النهاية</label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                    className="input-field text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Active switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-700">
            <span className="text-xs font-bold text-white">تفعيل الصندوق فوراً للمستخدمين</span>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-5 h-5 accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 py-2.5 text-xs font-bold"
            >
              {saving ? 'جارٍ الحفظ...' : editingBoxId ? 'تحديث الصندوق' : 'إنشاء الصندوق'}
            </button>
            <button
              type="button"
              onClick={() => setFormModalOpen(false)}
              className="btn-secondary flex-1 py-2.5 text-xs font-bold"
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Box Drop Rates & Cards Assigner Modal */}
      <Modal
        isOpen={!!ratesModalBox}
        onClose={() => setRatesModalBox(null)}
        title={`البطاقات ونسب السحب: ${ratesModalBox?.name_ar || ''}`}
      >
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Percent size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <strong className="text-amber-300 block mb-1">تحديد نسب ظهور البطاقات (Drop Rates):</strong>
                أضف البطاقات التي يمكن ربحها من هذا الصندوق مع تحديد وزن كل بطاقة (Weight).
                يقوم النظام تلقائياً باحتساب النسبة المئوية الدقيقة وضمان النزاهة على السيرفر.
              </div>
            </div>
            {boxCards.length > 0 && (
              <button
                type="button"
                onClick={handleEqualizeRates}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 shrink-0"
              >
                توزيع بالتساوي
              </button>
            )}
          </div>

          {/* Add card row */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-white">إضافة بطاقة إلى الصندوق</h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-7">
                <label className="field-label text-xs">اختر البطاقة</label>
                <select
                  value={selectedCardToAdd}
                  onChange={e => setSelectedCardToAdd(e.target.value)}
                  className="select-field text-xs py-2"
                >
                  <option value="">-- حدد بطاقة من مكتبة البطاقات --</option>
                  {availableCards.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.rarity.toUpperCase()} - {c.element})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="field-label text-xs">الوزن النسبي (Weight)</label>
                <input
                  type="number"
                  value={newCardWeight}
                  onChange={e => setNewCardWeight(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input-field text-xs font-mono py-2"
                  min="1"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddCardToBox}
                  className="btn-primary w-full py-2 text-xs font-bold"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>

          {/* Current Cards in Box Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center justify-between">
              <span>البطاقات المعتمدة داخل الصندوق ({boxCards.length})</span>
              <span className="text-amber-400 font-mono text-[11px]">
                مجموع النسب: {Math.round(boxCards.reduce((acc, c) => acc + (c.drop_rate_pct || 0), 0))}%
              </span>
            </h4>

            {boxCards.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-700 text-center text-xs text-slate-400">
                لا توجد بطاقات مخصصة لهذا الصندوق بعد. أضف بطاقات من القائمة أعلاه.
              </div>
            ) : (
              <div className="space-y-2">
                {boxCards.map(item => (
                  <div
                    key={item.card_id}
                    className="p-3 rounded-2xl bg-slate-900/40 border border-slate-700/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.card?.image_path || '/logo.jpeg'}
                        alt={item.card?.name}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{item.card?.name || 'بطاقة'}</span>
                        <span className="text-[10px] text-purple-300 uppercase">
                          {item.card?.rarity} • {item.card?.element}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">الاحتمال الفعلي</span>
                        <strong className="text-emerald-400 font-mono text-xs font-bold">
                          {item.drop_rate_pct}%
                        </strong>
                      </div>

                      <div className="w-20">
                        <span className="text-[10px] text-slate-400 block">الوزن</span>
                        <input
                          type="number"
                          value={item.weight}
                          onChange={e => handleWeightChange(item.card_id, parseInt(e.target.value) || 1)}
                          className="input-field text-xs font-mono py-1 px-2 w-full text-center"
                          min="1"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCardFromBox(item.card_id)}
                        className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              onClick={handleSaveBoxCards}
              disabled={savingRates || boxCards.length === 0}
              className="btn-primary flex-1 py-2.5 text-xs font-bold"
            >
              {savingRates ? 'جارٍ الحفظ...' : 'اعتماد وحفظ البطاقات والنسب'}
            </button>
            <button
              onClick={() => setRatesModalBox(null)}
              className="btn-secondary flex-1 py-2.5 text-xs font-bold"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteBox}
        onClose={() => setDeleteBox(null)}
        onConfirm={handleDeleteBox}
        title="حذف أو أرشفة صندوق السحب"
        message={`هل أنت متأكد من حذف أو أرشفة صندوق "${deleteBox?.name_ar || deleteBox?.name}"؟ ستبقى سجلات السحب السابقة محفوظة.`}
        confirmLabel="تأكيد"
        cancelLabel="إلغاء"
        variant="danger"
      />
    </div>
  )
}
