import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, Search, Edit2, Trash2, ImageOff, Loader2, X, Check, ArrowUpDown
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { ImageUpload, CharacterImage } from '../shared/ImageUpload'
import { Modal, ConfirmDialog, EmptyState, LoadingSpinner } from '../shared/UI'
import type { Character } from '../../types/database'
import toast from 'react-hot-toast'

export function AdminCharacters() {
  const { admin } = useAuth()
  const [characters, setCharacters] = useState<Character[]>([])
  const [filtered, setFiltered] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [editChar, setEditChar] = useState<Character | null>(null)
  const [deleteChar, setDeleteChar] = useState<Character | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({ name: '', alternate_name: '', image_path: '' })

  useEffect(() => { loadCharacters() }, [])
  useEffect(() => {
    setFiltered(
      search
        ? characters.filter(c => 
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.alternate_name || '').toLowerCase().includes(search.toLowerCase())
          )
        : characters
    )
  }, [characters, search])

  const loadCharacters = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
    if (data) { setCharacters(data); setFiltered(data) }
    setLoading(false)
  }

  const openAdd = () => {
    setForm({ name: '', alternate_name: '', image_path: '' })
    setAddModal(true)
  }

  const openEdit = (char: Character) => {
    setEditChar(char)
    setForm({ name: char.name, alternate_name: char.alternate_name || '', image_path: char.image_path || '' })
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('اسم الشخصية مطلوب')
    if (!admin?.id) return

    setIsSaving(true)
    try {
      const { data, error } = await supabase.rpc('admin_save_character', {
        p_admin_id: admin.id,
        p_char_id: editChar?.id ?? null,
        p_name: form.name.trim(),
        p_alternate_name: form.alternate_name.trim() || null,
        p_image_path: form.image_path || null,
        p_display_order: editChar ? editChar.display_order : characters.length,
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشلت العملية')

      toast.success(editChar ? 'تم تحديث الشخصية بنجاح' : 'تمت إضافة الشخصية بنجاح')
      if (editChar) {
        setEditChar(null)
      } else {
        setAddModal(false)
      }
      await loadCharacters()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteChar || !admin?.id) return
    setIsDeleting(true)
    try {
      if (deleteChar.image_path) {
        await supabase.storage.from('character-images').remove([deleteChar.image_path])
      }

      const { data, error } = await supabase.rpc('admin_delete_character', {
        p_admin_id: admin.id,
        p_char_id: deleteChar.id,
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'فشل الحذف')

      toast.success('تم حذف الشخصية')
      setDeleteChar(null)
      await loadCharacters()
    } catch (err) {
      toast.error('فشل الحذف: ' + (err instanceof Error ? err.message : 'خطأ غير معروف'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">إدارة الشخصيات</h1>
          <p className="text-slate-400 text-sm mt-1">{characters.length} شخصية مسجلة</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={18} />
          إضافة شخصية
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="البحث بالاسم..."
          className="input-field pr-10 py-2 text-sm"
        />
      </div>

      {/* Characters Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner text="جارٍ التحميل..." />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ImageOff size={48} />}
          title={search ? 'لا توجد نتائج' : 'لا توجد شخصيات بعد'}
          description={search ? 'جرّب مصطلح بحث مختلف' : 'ابدأ بإضافة الشخصيات من الزر أعلاه'}
          action={!search ? <button onClick={openAdd} className="btn-primary">إضافة شخصية</button> : undefined}
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          {filtered.map(char => (
            <motion.div
              key={char.id}
              variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
              className="glass-card rounded-2xl overflow-hidden group"
            >
              <div className="aspect-square relative">
                <CharacterImage imagePath={char.image_path} name={char.name} size="xl" className="rounded-none" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => openEdit(char)}
                    className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white hover:bg-primary-600 transition-colors"
                    title="تعديل"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteChar(char)}
                    className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-2 text-center">
                <p className="text-xs font-semibold text-white truncate">{char.name}</p>
                {char.alternate_name && (
                  <p className="text-xs text-slate-500 truncate">{char.alternate_name}</p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={addModal || !!editChar}
        onClose={() => { setAddModal(false); setEditChar(null); }}
        title={editChar ? 'تعديل الشخصية' : 'إضافة شخصية جديدة'}
      >
        <div className="p-6 space-y-5">
          <div>
            <label className="field-label">اسم الشخصية *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="مثال: Jiyan أو جيان"
              className="input-field"
            />
          </div>
          <div>
            <label className="field-label">الاسم البديل (اختياري)</label>
            <input
              type="text"
              value={form.alternate_name}
              onChange={e => setForm(f => ({ ...f, alternate_name: e.target.value }))}
              placeholder="اسم بديل أو ترجمة"
              className="input-field"
            />
          </div>
          <ImageUpload
            bucket="character-images"
            currentPath={form.image_path || null}
            onUploaded={(path: string) => setForm(f => ({ ...f, image_path: path }))}
            label="صورة الشخصية"
            aspectRatio="square"
          />
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !form.name.trim()}
              className="btn-primary flex-1"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {isSaving ? 'جارٍ الحفظ...' : (editChar ? 'حفظ التعديلات' : 'إضافة')}
            </button>
            <button
              onClick={() => { setAddModal(false); setEditChar(null); }}
              disabled={isSaving}
              className="btn-secondary flex-1"
            >
              <X size={16} />
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteChar}
        onClose={() => setDeleteChar(null)}
        onConfirm={handleDelete}
        title="حذف الشخصية"
        message={`هل أنت متأكد من حذف "${deleteChar?.name}"؟ سيتم حذف الصورة أيضاً. لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف نهائياً"
        cancelLabel="إلغاء"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
