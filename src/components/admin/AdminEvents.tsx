import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Edit2, Trash2, Play, Pause, CheckCircle, XCircle,
  Loader2, Flame, Users, Eye, AlertCircle, Check, X
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { getEventStatusClass, getEventStatusLabel, getImageUrl, formatDate } from '../../lib/utils'
import { Modal, ConfirmDialog, EmptyState, LoadingSpinner } from '../shared/UI'
import { ImageUpload, CharacterImage } from '../shared/ImageUpload'
import type { EventWithCharacters, Character, EventStatus } from '../../types/database'
import toast from 'react-hot-toast'

type FormData = {
  title: string
  description: string
  character_a_id: string
  character_b_id: string
  multiplier: string
  max_bet_amount: string
  opens_at: string
  closes_at: string
  cover_image_path: string
  status: EventStatus
}

const INITIAL_FORM: FormData = {
  title: '',
  description: '',
  character_a_id: '',
  character_b_id: '',
  multiplier: '2',
  max_bet_amount: '',
  opens_at: '',
  closes_at: '',
  cover_image_path: '',
  status: 'draft',
}

export function AdminEvents() {
  const { admin } = useAuth()
  const [events, setEvents] = useState<EventWithCharacters[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [formModal, setFormModal] = useState(false)
  const [settleModal, setSettleModal] = useState<EventWithCharacters | null>(null)
  const [cancelModal, setCancelModal] = useState<EventWithCharacters | null>(null)
  const [editEvent, setEditEvent] = useState<EventWithCharacters | null>(null)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [selectedWinner, setSelectedWinner] = useState<string>('')
  const [settleCelebration, setSettleCelebration] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const [eventsRes, charsRes] = await Promise.all([
      supabase
        .from('events')
        .select(`
          *,
          character_a:characters!events_character_a_id_fkey(*),
          character_b:characters!events_character_b_id_fkey(*),
          winner_character:characters!events_winner_character_id_fkey(*)
        `)
        .order('created_at', { ascending: false }),
      supabase.from('characters').select('*').eq('is_active', true).order('name'),
    ])
    if (eventsRes.data) setEvents(eventsRes.data as EventWithCharacters[])
    if (charsRes.data) setCharacters(charsRes.data)
    setLoading(false)
  }

  const openCreate = () => {
    setEditEvent(null)
    setForm(INITIAL_FORM)
    setFormModal(true)
  }

  const openEdit = (event: EventWithCharacters) => {
    setEditEvent(event)
    setForm({
      title: event.title,
      description: event.description || '',
      character_a_id: event.character_a_id,
      character_b_id: event.character_b_id,
      multiplier: String(event.multiplier),
      max_bet_amount: event.max_bet_amount ? String(event.max_bet_amount) : '',
      opens_at: event.opens_at ? event.opens_at.slice(0, 16) : '',
      closes_at: event.closes_at ? event.closes_at.slice(0, 16) : '',
      cover_image_path: event.cover_image_path || '',
      status: event.status,
    })
    setFormModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('عنوان الإيفنت مطلوب')
    if (!form.character_a_id || !form.character_b_id) return toast.error('يجب اختيار شخصيتين')
    if (form.character_a_id === form.character_b_id) return toast.error('يجب أن تكون الشخصيتان مختلفتين')
    if (!admin?.id) return

    const multiplier = parseFloat(form.multiplier)
    if (isNaN(multiplier) || multiplier < 1 || multiplier > 100) return toast.error('المضاعف يجب أن يكون بين 1 و 100')

    if (form.opens_at && form.closes_at && new Date(form.closes_at) <= new Date(form.opens_at)) {
      return toast.error('وقت الإغلاق يجب أن يكون بعد وقت الفتح')
    }

    // Prevent editing multiplier if bets exist
    if (editEvent && editEvent.status !== 'draft' && String(editEvent.multiplier) !== form.multiplier) {
      return toast.error('لا يمكن تغيير المضاعف بعد بدء قبول الرهانات')
    }

    setIsSaving(true)
    try {
      const { data, error } = await supabase.rpc('admin_save_event', {
        p_admin_id: admin.id,
        p_event_id: editEvent?.id ?? null,
        p_title: form.title.trim(),
        p_description: form.description.trim() || null,
        p_character_a_id: form.character_a_id,
        p_character_b_id: form.character_b_id,
        p_multiplier: multiplier,
        p_max_bet_amount: form.max_bet_amount ? parseFloat(form.max_bet_amount) : null,
        p_opens_at: form.opens_at ? new Date(form.opens_at).toISOString() : null,
        p_closes_at: form.closes_at ? new Date(form.closes_at).toISOString() : null,
        p_cover_image_path: form.cover_image_path || null,
        p_status: form.status,
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'حدث خطأ')

      toast.success(editEvent ? 'تم تحديث الإيفنت' : 'تم إنشاء الإيفنت')
      setFormModal(false)
      await loadData()
    } catch (err: any) {
      toast.error(err?.message || 'حدث خطأ أثناء حفظ الإيفنت')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (event: EventWithCharacters, newStatus: EventStatus) => {
    if (!admin?.id) return
    const { data, error } = await supabase.rpc('admin_change_event_status', {
      p_admin_id: admin.id,
      p_event_id: event.id,
      p_new_status: newStatus,
    })
    if (error || !data?.success) { toast.error('فشل تغيير الحالة'); return }
    toast.success(`تم تغيير حالة الإيفنت إلى: ${getEventStatusLabel(newStatus)}`)
    await loadData()
  }

  const handleSettle = async () => {
    if (!settleModal || !selectedWinner || !admin?.id) return
    setIsSettling(true)
    try {
      const { data, error } = await supabase.rpc('settle_event', {
        p_event_id: settleModal.id,
        p_winner_character_id: selectedWinner,
        p_admin_id: admin.id,
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشلت التسوية')

      toast.success(`تمت التسوية! الفائزون: ${data.winners} | الخاسرون: ${data.losers} | المنح: ${data.total_paid?.toLocaleString('ar-EG')} نقطة`)
      setSettleCelebration(true)
      setTimeout(() => setSettleCelebration(false), 3000)
      setSettleModal(null)
      setSelectedWinner('')
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشلت التسوية')
    } finally {
      setIsSettling(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelModal || !admin?.id) return
    setIsCancelling(true)
    try {
      const { data, error } = await supabase.rpc('cancel_event', {
        p_event_id: cancelModal.id,
        p_admin_id: admin.id,
        p_reason: cancelReason || 'إلغاء من قبل المدير',
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشل الإلغاء')

      toast.success(`تم الإلغاء. استرداد ${data.refunded_bets} رهان (${data.total_refunded?.toLocaleString('ar-EG')} نقطة)`)
      setCancelModal(null)
      setCancelReason('')
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الإلغاء')
    } finally {
      setIsCancelling(false)
    }
  }

  const getStatusActions = (event: EventWithCharacters) => {
    const actions = []
    if (event.status === 'draft') {
      actions.push({ label: 'نشر', icon: Play, color: 'text-blue-400', onClick: () => handleStatusChange(event, 'scheduled') })
    }
    if (event.status === 'scheduled') {
      actions.push({ label: 'فتح الرهان', icon: Play, color: 'text-green-400', onClick: () => handleStatusChange(event, 'open') })
    }
    if (event.status === 'open') {
      actions.push({ label: 'إغلاق', icon: Pause, color: 'text-amber-400', onClick: () => handleStatusChange(event, 'closed') })
    }
    if (event.status === 'closed' || event.status === 'pending_result') {
      actions.push({ label: 'إعلان النتيجة', icon: CheckCircle, color: 'text-green-400', onClick: () => { setSettleModal(event); setSelectedWinner('') } })
    }
    if (!['completed', 'cancelled'].includes(event.status)) {
      actions.push({ label: 'إلغاء', icon: XCircle, color: 'text-red-400', onClick: () => setCancelModal(event) })
    }
    return actions
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">إدارة الإيفنتات</h1>
          <p className="text-slate-400 text-sm mt-1">{events.length} إيفنت مسجل</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={18} />
          إنشاء إيفنت
        </button>
      </div>

      {/* Events list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner text="جارٍ التحميل..." />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<Flame size={48} />}
          title="لا توجد إيفنتات"
          description="أنشئ أول إيفنت من الزر أعلاه"
          action={<button onClick={openCreate} className="btn-primary">إنشاء إيفنت</button>}
        />
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                {/* Cover */}
                {event.cover_image_path && (
                  <img
                    src={getImageUrl(event.cover_image_path, 'event-covers')}
                    alt={event.title}
                    className="w-20 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white truncate">{event.title}</h3>
                    <span className={`badge ${getEventStatusClass(event.status)} flex-shrink-0`}>
                      {getEventStatusLabel(event.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <CharacterImage imagePath={event.character_a.image_path} name={event.character_a.name} size="sm" className="w-5 h-5 flex-shrink-0" />
                      <span>{event.character_a.name}</span>
                    </div>
                    <span className="text-slate-700">VS</span>
                    <div className="flex items-center gap-1">
                      <CharacterImage imagePath={event.character_b.image_path} name={event.character_b.name} size="sm" className="w-5 h-5 flex-shrink-0" />
                      <span>{event.character_b.name}</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Flame size={12} className="text-orange-400" />×{event.multiplier}
                    </span>
                    {event.winner_character && (
                      <span className="text-amber-400">🏆 {event.winner_character.name}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Edit button (only for draft/scheduled) */}
                  {['draft', 'scheduled'].includes(event.status) && (
                    <button
                      onClick={() => openEdit(event)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      <Edit2 size={13} />
                      تعديل
                    </button>
                  )}

                  {/* View bets */}
                  <button
                    onClick={() => window.open(`/events/${event.id}`, '_blank')}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <Eye size={13} />
                    عرض
                  </button>

                  {/* Status actions */}
                  {getStatusActions(event).map((action, idx) => (
                    <button
                      key={idx}
                      onClick={action.onClick}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${action.color} hover:bg-white/10`}
                      style={{ border: '1px solid currentColor', opacity: 0.8 }}
                    >
                      <action.icon size={13} />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      <Modal
        isOpen={formModal}
        onClose={() => !isSaving && setFormModal(false)}
        title={editEvent ? 'تعديل الإيفنت' : 'إنشاء إيفنت جديد'}
        size="lg"
      >
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="field-label">عنوان الإيفنت *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="مثال: Jiyan ضد Calcharo" className="input-field" />
          </div>

          <div>
            <label className="field-label">وصف الإيفنت (اختياري)</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="تفاصيل إضافية..." className="input-field min-h-20 resize-none" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">الشخصية الأولى *</label>
              <select value={form.character_a_id} onChange={e => setForm(f => ({ ...f, character_a_id: e.target.value }))}
                className="select-field"
                disabled={Boolean(editEvent && !['draft'].includes(editEvent.status))}
              >
                <option value="">اختر شخصية...</option>
                {characters.map(c => (
                  <option key={c.id} value={c.id} disabled={c.id === form.character_b_id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">الشخصية الثانية *</label>
              <select value={form.character_b_id} onChange={e => setForm(f => ({ ...f, character_b_id: e.target.value }))}
                className="select-field"
                disabled={Boolean(editEvent && !['draft'].includes(editEvent.status))}
              >
                <option value="">اختر شخصية...</option>
                {characters.map(c => (
                  <option key={c.id} value={c.id} disabled={c.id === form.character_a_id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">
                المضاعف *
                {editEvent && editEvent.status !== 'draft' && (
                  <span className="text-red-400 text-xs mr-2">(لا يمكن التعديل)</span>
                )}
              </label>
              <input type="number" value={form.multiplier}
                onChange={e => setForm(f => ({ ...f, multiplier: e.target.value }))}
                className="input-field" min="1" max="100" step="0.5"
                disabled={editEvent !== null && editEvent.status !== 'draft'}
              />
            </div>
            <div>
              <label className="field-label">الحد الأقصى للرهان (اختياري)</label>
              <input type="number" value={form.max_bet_amount}
                onChange={e => setForm(f => ({ ...f, max_bet_amount: e.target.value }))}
                placeholder="بلا حد" className="input-field" min="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">وقت الفتح (اختياري)</label>
              <input type="datetime-local" value={form.opens_at}
                onChange={e => setForm(f => ({ ...f, opens_at: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="field-label">وقت الإغلاق (اختياري)</label>
              <input type="datetime-local" value={form.closes_at}
                onChange={e => setForm(f => ({ ...f, closes_at: e.target.value }))}
                className="input-field" />
            </div>
          </div>

          <div>
            <label className="field-label">الحالة</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as EventStatus }))}
              className="select-field">
              <option value="draft">مسودة</option>
              <option value="scheduled">مجدول</option>
              {editEvent && <option value="open">مفتوح للرهان</option>}
            </select>
          </div>

          <ImageUpload
            bucket="event-covers"
            currentPath={form.cover_image_path || null}
            onUploaded={(path: string) => setForm(f => ({ ...f, cover_image_path: path }))}
            label="صورة الغلاف (اختياري)"
            aspectRatio="wide"
          />

          <div className="flex gap-3 pt-2 border-t border-slate-700/50">
            <button onClick={handleSave} disabled={isSaving} className="btn-primary flex-1">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {isSaving ? 'جارٍ الحفظ...' : (editEvent ? 'حفظ التغييرات' : 'إنشاء الإيفنت')}
            </button>
            <button onClick={() => setFormModal(false)} disabled={isSaving} className="btn-secondary flex-1">
              <X size={16} /> إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Settle Modal */}
      <Modal isOpen={!!settleModal} onClose={() => !isSettling && setSettleModal(null)} title="إعلان النتيجة وتوزيع النقاط" size="sm">
        <div className="p-6 space-y-4">
          {settleModal && (
            <>
              <p className="text-slate-400 text-sm">اختر الشخصية الفائزة في إيفنت: <strong className="text-white">{settleModal.title}</strong></p>
              
              <div className="grid grid-cols-2 gap-3">
                {[settleModal.character_a, settleModal.character_b].map(char => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedWinner(char.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      selectedWinner === char.id
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <CharacterImage imagePath={char.image_path} name={char.name} size="md" className="mx-auto mb-2" />
                    <p className="text-sm font-semibold text-white">{char.name}</p>
                    {selectedWinner === char.id && <p className="text-xs text-amber-400 mt-1">🏆 الفائز</p>}
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                ⚠️ تنبيه: هذه العملية لا يمكن التراجع عنها. سيتم توزيع النقاط على الفائزين تلقائياً.
              </div>

              <div className="flex gap-3">
                <button onClick={handleSettle} disabled={isSettling || !selectedWinner} className="btn-success flex-1">
                  {isSettling ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {isSettling ? 'جارٍ التسوية...' : 'إعلان النتيجة وتوزيع النقاط'}
                </button>
                <button onClick={() => setSettleModal(null)} disabled={isSettling} className="btn-secondary">
                  <X size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={!!cancelModal} onClose={() => !isCancelling && setCancelModal(null)} title="إلغاء الإيفنت" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-slate-400 text-sm">إلغاء: <strong className="text-white">{cancelModal?.title}</strong></p>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            ⚠️ سيتم استرداد رهانات جميع المشاركين تلقائياً.
          </div>
          <div>
            <label className="field-label">سبب الإلغاء (اختياري)</label>
            <input type="text" value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              placeholder="أدخل سبب الإلغاء..." className="input-field" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleCancel} disabled={isCancelling} className="btn-danger flex-1">
              {isCancelling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              {isCancelling ? 'جارٍ الإلغاء...' : 'تأكيد الإلغاء'}
            </button>
            <button onClick={() => setCancelModal(null)} disabled={isCancelling} className="btn-secondary">
              <X size={16} />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
