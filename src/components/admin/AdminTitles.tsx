import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Sparkles, Plus, Edit2, Trash2, Award, UserCheck, UserX, RefreshCw, X, Check, Search, Shield, Image } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PlayerTitleBadge } from '../shared/PlayerTitleBadge'
import toast from 'react-hot-toast'

interface TitleRecord {
  id?: string
  name_ar: string
  name_en?: string
  description?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  animation_style: 'legendary_glow' | 'mythic_flame' | 'abyssal_void' | 'solaris_radiance' | 'phantom'
  color: string
  icon?: string
  is_exclusive: boolean
  source_type: 'event' | 'boss' | 'achievement' | 'admin'
  is_active: boolean
}

export function AdminTitles() {
  const [titles, setTitles] = useState<TitleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTitle, setEditingTitle] = useState<TitleRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Grant modal state
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [selectedTitleForGrant, setSelectedTitleForGrant] = useState<TitleRecord | null>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [playerSearch, setPlayerSearch] = useState('')
  const [granting, setGranting] = useState(false)

  // Revoke / Holders modal state
  const [revokeModalOpen, setRevokeModalOpen] = useState(false)
  const [selectedTitleForRevoke, setSelectedTitleForRevoke] = useState<TitleRecord | null>(null)
  const [titleHolders, setTitleHolders] = useState<any[]>([])
  const [loadingHolders, setLoadingHolders] = useState(false)
  const [revokePlayerSearch, setRevokePlayerSearch] = useState('')
  const [revokingPlayerId, setRevokingPlayerId] = useState<string | null>(null)

  useEffect(() => {
    fetchTitles()
    fetchPlayers()
  }, [])

  const fetchTitles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTitles(data || [])
    } catch (err: any) {
      console.error('Fetch titles error:', err)
      toast.error('فشل تحميل الألقاب')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayers = async () => {
    try {
      const { data } = await supabase.from('players').select('id, username, balance').limit(100)
      setPlayers(data || [])
    } catch (err) {
      console.error('Fetch players error:', err)
    }
  }

  const handleOpenCreate = () => {
    setEditingTitle({
      name_ar: '',
      name_en: '',
      description: 'لقب أسطوري يُمنح للأبطال المتميزين.',
      rarity: 'legendary',
      animation_style: 'legendary_glow',
      color: '#eab308',
      icon: '👑',
      is_exclusive: true,
      source_type: 'boss',
      is_active: true,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (title: TitleRecord) => {
    setEditingTitle({ ...title })
    setIsModalOpen(true)
  }

  const handleSaveTitle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTitle) return
    if (!editingTitle.name_ar.trim()) return toast.error('يرجى كتابة الاسم بالعربية')

    setSaving(true)
    try {
      const payload = {
        name_ar: editingTitle.name_ar.trim(),
        name_en: editingTitle.name_en?.trim() || null,
        description: editingTitle.description?.trim() || '',
        rarity: editingTitle.rarity,
        animation_style: editingTitle.animation_style,
        color: editingTitle.color || '#eab308',
        icon: editingTitle.icon || '👑',
        is_exclusive: editingTitle.is_exclusive,
        source_type: editingTitle.source_type,
        is_active: editingTitle.is_active,
      }

      if (editingTitle.id) {
        const { error } = await supabase
          .from('titles')
          .update(payload)
          .eq('id', editingTitle.id)
        if (error) throw error
        toast.success('تم تحديث اللقب بنجاح')
      } else {
        const { error } = await supabase
          .from('titles')
          .insert([payload])
        if (error) throw error
        toast.success('تم إنشاء اللقب بنجاح')
      }

      setIsModalOpen(false)
      fetchTitles()
    } catch (err: any) {
      console.error('Error saving title:', err)
      toast.error('فشل حفظ اللقب: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleGrantTitle = async () => {
    if (!selectedTitleForGrant?.id || !selectedPlayerId) {
      return toast.error('يرجى اختيار اللاعب واللقب')
    }

    setGranting(true)
    try {
      const { error } = await supabase
        .from('player_titles')
        .insert([{
          player_id: selectedPlayerId,
          title_id: selectedTitleForGrant.id,
          obtained_via: 'admin_grant',
          is_equipped: false,
          unlocked_at: new Date().toISOString(),
        }])

      if (error) {
        if (error.code === '23505') {
          return toast.error('اللاعب يمتلك هذا اللقب بالفعل!')
        }
        throw error
      }

      toast.success('تم منح اللقب للاعب بنجاح! ✅')
      setGrantModalOpen(false)
      setSelectedPlayerId('')
      setPlayerSearch('')
    } catch (err: any) {
      console.error('Grant error:', err)
      toast.error('فشل منح اللقب: ' + (err.message || JSON.stringify(err)))
    } finally {
      setGranting(false)
    }
  }

  const filteredPlayers = players.filter(p =>
    p.username.toLowerCase().includes(playerSearch.toLowerCase())
  )

  const handleOpenHoldersModal = async (title: TitleRecord) => {
    setSelectedTitleForRevoke(title)
    setRevokeModalOpen(true)
    setLoadingHolders(true)
    setRevokePlayerSearch('')
    try {
      const { data, error } = await supabase
        .from('player_titles')
        .select(`
          id,
          player_id,
          title_id,
          unlocked_at,
          player:players(id, username, balance, equipped_title_id)
        `)
        .eq('title_id', title.id)

      if (error) throw error
      setTitleHolders(data || [])
    } catch (err: any) {
      console.error('Fetch holders error:', err)
      toast.error('فشل تحميل قائمة حاملي اللقب')
    } finally {
      setLoadingHolders(false)
    }
  }

  const handleRevokeTitleFromPlayer = async (playerId: string, titleId: string, playerName: string) => {
    if (!window.confirm(`هل أنت متأكد من سحب هذا اللقب من اللاعب [${playerName}]؟`)) return

    setRevokingPlayerId(playerId)
    try {
      const { error: delErr } = await supabase
        .from('player_titles')
        .delete()
        .eq('player_id', playerId)
        .eq('title_id', titleId)

      if (delErr) throw delErr

      // If this was the equipped title, unequip it
      await supabase
        .from('players')
        .update({ equipped_title_id: null })
        .eq('id', playerId)
        .eq('equipped_title_id', titleId)

      setTitleHolders(prev => prev.filter(h => h.player_id !== playerId))
      toast.success(`تم سحب اللقب من اللاعب ${playerName} بنجاح! ✅`)
    } catch (err: any) {
      console.error('Revoke title error:', err)
      toast.error('فشل سحب اللقب: ' + (err.message || 'حدث خطأ'))
    } finally {
      setRevokingPlayerId(null)
    }
  }

  const filteredHolders = titleHolders.filter(h =>
    (h.player?.username || '').toLowerCase().includes(revokePlayerSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400" size={24} />
            <h2 className="text-2xl font-black text-white">نظام الألقاب المتحركة (Animated Titles)</h2>
          </div>
          <p className="text-slate-400 text-sm">
            صمم ألقاباً متحركة بخمسة مؤثرات ضوئية مختلفة (Legendary Glow, Mythic Flame, Abyssal Void, Solaris Radiance, Phantom)، واربطها بالزعماء أو امنحها واسحبها من أي لاعب يدوياً.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-primary py-3 px-5 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary-500/20"
        >
          <Plus size={18} />
          إنشاء لقب أسطوري جديد
        </button>
      </div>

      {/* Titles Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="animate-spin text-primary-400" size={32} />
        </div>
      ) : titles.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-3">
          <Award size={40} className="mx-auto text-slate-500" />
          <p className="text-slate-300 font-bold">لا يوجد ألقاب مسجلة حالياً</p>
          <p className="text-slate-500 text-xs">اضغط على زر الإنشاء أعلاه لإضافة أول لقب متحرك.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {titles.map((title) => (
            <div
              key={title.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Live Animated Badge Preview */}
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold mb-1">المعاينة الحية:</div>
                    <PlayerTitleBadge title={title} />
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                    {title.rarity}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-black text-white">{title.name_ar}</h4>
                  {title.name_en && (
                    <div className="text-xs text-primary-400 font-semibold">{title.name_en}</div>
                  )}
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                    {title.description || 'لقب شرفي فخم'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 text-slate-300">
                  <div>المؤثر: <strong className="text-amber-400">{title.style || title.animation_style}</strong></div>
                  <div>المصدر: <strong className="text-primary-400">{title.source_type}</strong></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedTitleForGrant(title)
                      setGrantModalOpen(true)
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
                    title="منح اللقب للاعب معين"
                  >
                    <Award size={13} />
                    منح للاعب
                  </button>

                  <button
                    onClick={() => handleOpenHoldersModal(title)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
                    title="عرض حاملي هذا اللقب وإمكانية سحبه منهم"
                  >
                    <UserX size={13} />
                    سحب من لاعب
                  </button>
                </div>

                <button
                  onClick={() => handleOpenEdit(title)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                  title="تعديل"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && editingTitle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-8 flex flex-col"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <Trophy className="text-amber-400" size={20} />
                  <h3 className="text-lg font-black text-white">
                    {editingTitle.id ? 'تعديل اللقب' : 'إنشاء لقب جديد'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTitle} className="p-6 space-y-4">
                {/* Live Preview Box */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
                  <div className="text-xs text-slate-400 font-bold">المعاينة أثناء التصميم:</div>
                  <div className="flex justify-center">
                    <PlayerTitleBadge title={editingTitle} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">الاسم بالعربية *</label>
                    <input
                      type="text"
                      value={editingTitle.name_ar}
                      onChange={(e) => setEditingTitle({ ...editingTitle, name_ar: e.target.value })}
                      required
                      placeholder="مثال: قاهر الهاوية"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">الاسم بالإنجليزية</label>
                    <input
                      type="text"
                      value={editingTitle.name_en || ''}
                      onChange={(e) => setEditingTitle({ ...editingTitle, name_en: e.target.value })}
                      placeholder="مثال: Abyss Conqueror"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">الوصف</label>
                  <textarea
                    rows={2}
                    value={editingTitle.description || ''}
                    onChange={(e) => setEditingTitle({ ...editingTitle, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">الندرة</label>
                    <select
                      value={editingTitle.rarity}
                      onChange={(e) => setEditingTitle({ ...editingTitle, rarity: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-sm text-white focus:outline-none"
                    >
                      <option value="common">Common</option>
                      <option value="rare">Rare</option>
                      <option value="epic">Epic</option>
                      <option value="legendary">Legendary</option>
                      <option value="mythic">Mythic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">المؤثر الحركي (Animation)</label>
                    <select
                      value={editingTitle.animation_style}
                      onChange={(e) => setEditingTitle({ ...editingTitle, animation_style: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-sm text-white focus:outline-none"
                    >
                      <option value="legendary_glow">Legendary Glow (توهج دوري)</option>
                      <option value="mythic_flame">Mythic Flame (لهب ساطع)</option>
                      <option value="abyssal_void">Abyssal Void (ظلام الهاوية)</option>
                      <option value="solaris_radiance">Solaris Radiance (شعاع شمسي)</option>
                      <option value="phantom">Phantom (طيفي شبحي)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">الأيقونة التعبيرية</label>
                    <input
                      type="text"
                      value={editingTitle.icon || '👑'}
                      onChange={(e) => setEditingTitle({ ...editingTitle, icon: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-sm text-white text-center focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">مصدر اللقب</label>
                    <select
                      value={editingTitle.source_type}
                      onChange={(e) => setEditingTitle({ ...editingTitle, source_type: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-sm text-white"
                    >
                      <option value="boss">قتال الزعماء (Boss)</option>
                      <option value="event">إيفنت موسمي (Event)</option>
                      <option value="achievement">إنجاز (Achievement)</option>
                      <option value="admin">منح إداري حصري (Admin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">اللون الرئيسي</label>
                    <input
                      type="color"
                      value={editingTitle.color}
                      onChange={(e) => setEditingTitle({ ...editingTitle, color: e.target.value })}
                      className="w-full h-10 bg-slate-950 border border-slate-700 rounded-xl p-1 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-bold hover:bg-slate-700"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                  >
                    {saving ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                    {editingTitle.id ? 'حفظ التعديلات' : 'إنشاء اللقب'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grant Title Modal */}
      <AnimatePresence>
        {grantModalOpen && selectedTitleForGrant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Award className="text-amber-400" size={20} />
                  <h3 className="text-base font-black text-white">منح لقب للاعب</h3>
                </div>
                <button
                  onClick={() => setGrantModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                <div className="text-xs text-slate-400 mb-1">اللقب المحدد:</div>
                <PlayerTitleBadge title={selectedTitleForGrant} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">اختر اللاعب:</label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute right-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="بحث باسم اللاعب..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-800 rounded-2xl p-2 bg-slate-950/60">
                  {filteredPlayers.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlayerId(p.id)}
                      className={`w-full p-2.5 rounded-xl text-right text-xs font-bold flex items-center justify-between transition-all ${
                        selectedPlayerId === p.id
                          ? 'bg-primary-500/20 border border-primary-500 text-primary-300'
                          : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{p.username}</span>
                      <span className="text-[10px] text-slate-500">رصيد: {p.balance ?? '—'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGrantModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!selectedPlayerId || granting}
                  onClick={handleGrantTitle}
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  {granting ? <RefreshCw className="animate-spin" size={14} /> : <UserCheck size={14} />}
                  تأكيد المنح
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Revoke Title from Player Modal */}
      <AnimatePresence>
        {revokeModalOpen && selectedTitleForRevoke && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <UserX className="text-rose-400" size={20} />
                  <div>
                    <h3 className="text-base font-black text-white">سحب اللقب من اللاعبين</h3>
                    <p className="text-xs text-slate-400">إدارة وسحب لقب [{selectedTitleForRevoke.name_ar}] من اللاعبين المالكين له</p>
                  </div>
                </div>
                <button
                  onClick={() => setRevokeModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Title preview badge */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">اللقب المستهدف:</span>
                  <PlayerTitleBadge title={selectedTitleForRevoke} />
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-bold">
                  {titleHolders.length} لاعب يمتلكه
                </span>
              </div>

              {/* Search player input */}
              <div className="relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input
                  type="text"
                  placeholder="بحث عن لاعب بالاسم..."
                  value={revokePlayerSearch}
                  onChange={(e) => setRevokePlayerSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* List of players who own this title */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-60">
                {loadingHolders ? (
                  <div className="py-12 flex justify-center items-center">
                    <RefreshCw className="animate-spin text-rose-400" size={24} />
                  </div>
                ) : filteredHolders.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs font-bold border border-dashed border-slate-800 rounded-2xl">
                    {titleHolders.length === 0 ? 'لا يوجد أي لاعب يمتلك هذا اللقب حالياً' : 'لا توجد نتائج تطابق بحثك'}
                  </div>
                ) : (
                  filteredHolders.map((holder) => {
                    const isEquipped = holder.player?.equipped_title_id === selectedTitleForRevoke.id
                    const isRevoking = revokingPlayerId === holder.player_id

                    return (
                      <div
                        key={holder.id}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {holder.player?.username || 'لاعب غير معروف'}
                            </span>
                            {isEquipped && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                مجهّز حالياً ⭐
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            تاريخ الحصول: {new Date(holder.unlocked_at).toLocaleDateString('ar-EG-u-nu-latn')}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={isRevoking}
                          onClick={() => handleRevokeTitleFromPlayer(holder.player_id, selectedTitleForRevoke.id!, holder.player?.username || '')}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                        >
                          {isRevoking ? <RefreshCw className="animate-spin" size={13} /> : <UserX size={13} />}
                          سحب اللقب
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setRevokeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
