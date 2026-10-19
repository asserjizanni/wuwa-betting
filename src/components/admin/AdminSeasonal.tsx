import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, Plus, Calendar, Award, Check, X,
  Trash2, Loader2, Edit3, Flame, RefreshCw
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Modal, LoadingSpinner, ConfirmDialog } from '../shared/UI'
import toast from 'react-hot-toast'

interface SeasonalEvent {
  id: string
  title: string
  description: string
  badge: string
  event_type: string
  color: string
  status: 'draft' | 'active' | 'ended' | 'cancelled'
  start_date: string | null
  end_date: string | null
  max_participants: number | null
  rewards: any[]
  is_featured: boolean
  created_at: string
}

export function AdminSeasonal() {
  const { admin } = useAuth()
  const [events, setEvents] = useState<SeasonalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<SeasonalEvent | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<SeasonalEvent | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [badge, setBadge] = useState('🌟')
  const [eventType, setEventType] = useState('general')
  const [color, setColor] = useState('#6366f1')
  const [status, setStatus] = useState<'draft' | 'active' | 'ended' | 'cancelled'>('active')
  const [isFeatured, setIsFeatured] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('seasonal_events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setEvents(data)
    } catch (err) {
      toast.error('حدث خطأ أثناء تحميل الفعاليات الموسمية')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingEvent(null)
    setTitle('')
    setDescription('')
    setBadge('🌟')
    setEventType('general')
    setColor('#6366f1')
    setStatus('active')
    setIsFeatured(false)
    setModalOpen(true)
  }

  const openEditModal = (event: SeasonalEvent) => {
    setEditingEvent(event)
    setTitle(event.title)
    setDescription(event.description || '')
    setBadge(event.badge || '🌟')
    setEventType(event.event_type || 'general')
    setColor(event.color || '#6366f1')
    setStatus(event.status)
    setIsFeatured(event.is_featured || false)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return toast.error('أدخل عنوان الفعالية')
    if (!admin?.id) return

    setIsSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        badge,
        event_type: eventType,
        color,
        status,
        is_featured: isFeatured,
        created_by: admin.id,
      }

      if (editingEvent) {
        const { error } = await supabase
          .from('seasonal_events')
          .update(payload)
          .eq('id', editingEvent.id)
        if (error) throw error
        toast.success('تم تحديث الفعالية بنجاح')
      } else {
        const { error } = await supabase
          .from('seasonal_events')
          .insert([payload])
        if (error) throw error
        toast.success('تم إنشاء الفعالية الموسمية بنجاح')
      }

      setModalOpen(false)
      await loadEvents()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (event: SeasonalEvent) => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('seasonal_events')
        .delete()
        .eq('id', event.id)

      if (error) throw error
      toast.success('تم حذف الفعالية')
      setDeleteConfirm(null)
      await loadEvents()
    } catch (err) {
      toast.error('حدث خطأ أثناء الحذف')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="text-amber-400" />
            إدارة الأحداث والفعاليات الموسمية
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            إنشاء مواسم التحدي والبطولات الخاصة بمكافآت مضاعفة وبطاقات حصرية.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadEvents} className="btn-secondary text-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openCreateModal} className="btn-primary text-xs font-bold gap-1.5 shadow-glow-blue">
            <Plus size={15} /> إضافة فعالية جديدة
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner text="جارٍ جلب الفعاليات..." />
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-700/60">
          <Sparkles size={48} className="mx-auto text-amber-400/50 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">لا توجد فعاليات موسمية حالياً</h3>
          <p className="text-slate-400 text-xs mb-4">أنشئ موسماً جديداً لزيادة تفاعل وتنافس اللاعبين</p>
          <button onClick={openCreateModal} className="btn-primary text-xs">
            + إنشاء أول فعالية
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(ev => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-5 border border-slate-700/60 relative overflow-hidden flex flex-col justify-between"
              style={{ borderTop: `3px solid ${ev.color || '#6366f1'}` }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                    {ev.badge || '🌟'}
                  </span>
                  <div className="flex items-center gap-2">
                    {ev.is_featured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        مميّز ⭐
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      ev.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      ev.status === 'ended' ? 'bg-slate-700 text-slate-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {ev.status === 'active' ? 'نشط 🟢' : ev.status === 'ended' ? 'منتهي ⚪' : 'مسودة 🟡'}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-black text-white mb-1">{ev.title}</h3>
                <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">
                  {ev.description || 'لا يوجد وصف'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-[11px] text-slate-500 font-mono">
                  {ev.event_type}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(ev)}
                    className="w-8 h-8 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                    title="تعديل"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(ev)}
                    className="w-8 h-8 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !isSaving && setModalOpen(false)}
        title={editingEvent ? 'تعديل فعالية موسمية' : 'إضافة فعالية موسمية جديدة'}
        size="md"
      >
        <form onSubmit={handleSave} className="p-6 space-y-4" dir="rtl">
          <div>
            <label className="field-label text-xs font-bold text-slate-300 mb-1">عنوان الفعالية *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="مثال: موسم عاصفة الصدى الصيفي"
              className="input-field text-sm"
              required
            />
          </div>

          <div>
            <label className="field-label text-xs font-bold text-slate-300 mb-1">وصف الفعالية</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="اكتب تفاصيل الموسم والشروط والمكافآت..."
              className="input-field text-xs h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="field-label text-xs text-slate-300 mb-1">أيقونة / شارة (Emoji)</label>
              <input
                type="text"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder="🌟"
                className="input-field text-center text-lg py-1.5"
                maxLength={4}
              />
            </div>
            <div>
              <label className="field-label text-xs text-slate-300 mb-1">اللون السمتي</label>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="input-field h-10 p-1 cursor-pointer"
              />
            </div>
            <div>
              <label className="field-label text-xs text-slate-300 mb-1">الحالة</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="input-field text-xs py-2"
              >
                <option value="active">نشط (Active)</option>
                <option value="draft">مسودة (Draft)</option>
                <option value="ended">منتهي (Ended)</option>
                <option value="cancelled">ملغى (Cancelled)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={e => setIsFeatured(e.target.checked)}
              className="rounded text-primary-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isFeatured" className="text-xs text-slate-300 font-semibold cursor-pointer">
              تمييز الفعالية في الصفحة الرئيسية للجميع ⭐
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="btn-primary flex-1 py-2.5 text-xs font-bold gap-1.5"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {isSaving ? 'جارٍ الحفظ...' : 'حفظ الفعالية'}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary flex-1 py-2.5 text-xs"
            >
              <X size={14} /> إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="حذف الفعالية الموسمية"
        message={`هل أنت متأكد من حذف الفعالية "${deleteConfirm?.title}" نهائياً؟`}
        confirmLabel="حذف نهائي"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
