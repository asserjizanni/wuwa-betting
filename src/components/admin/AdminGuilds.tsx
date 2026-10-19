import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Shield, Trophy, Trash2, Check, X,
  Search, Loader2, RefreshCw, AlertTriangle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner, ConfirmDialog } from '../shared/UI'
import toast from 'react-hot-toast'

interface GuildRow {
  id: string
  name: string
  tag: string
  description: string
  badge: string
  color: string
  leader_id: string | null
  max_members: number
  is_active: boolean
  total_winnings: number
  level: number
  created_at: string
  leader_name?: string
  member_count?: number
}

export function AdminGuilds() {
  const { admin } = useAuth()
  const [guilds, setGuilds] = useState<GuildRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<GuildRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    loadGuilds()
  }, [])

  const loadGuilds = async () => {
    setLoading(true)
    try {
      const { data: guildsData, error } = await supabase
        .from('guilds')
        .select(`
          *,
          players:leader_id (username)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (guildsData) {
        // Count members for each guild
        const memberCountPromises = guildsData.map(async g => {
          const { count } = await supabase
            .from('guild_members')
            .select('*', { count: 'exact', head: true })
            .eq('guild_id', g.id)

          return {
            ...g,
            leader_name: (g.players as any)?.username || 'غير محدد',
            member_count: count || 0
          }
        })

        const resolvedGuilds = await Promise.all(memberCountPromises)
        setGuilds(resolvedGuilds)
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تحميل الكلانات')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (guild: GuildRow) => {
    setTogglingId(guild.id)
    try {
      const { error } = await supabase
        .from('guilds')
        .update({ is_active: !guild.is_active })
        .eq('id', guild.id)

      if (error) throw error
      toast.success(guild.is_active ? 'تم إيقاف الكلان' : 'تم تفعيل الكلان')
      await loadGuilds()
    } catch (err) {
      toast.error('فشل تغيير حالة الكلان')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (guild: GuildRow) => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('guilds')
        .delete()
        .eq('id', guild.id)

      if (error) throw error
      toast.success(`تم حذف كلان "${guild.name}"`)
      setDeleteConfirm(null)
      await loadGuilds()
    } catch (err) {
      toast.error('حدث خطأ أثناء الحذف')
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = guilds.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.tag.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="text-primary-400" />
            إدارة الكلانات والنقابات
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            مراقبة وتحكم في جميع كلانات اللاعبين، الأعضاء، ورتب الكلان.
          </p>
        </div>
        <button onClick={loadGuilds} className="btn-secondary text-xs self-start sm:self-auto gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          تحديث
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="البحث باسم الكلان أو التاج..."
          className="input-field pr-10 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner text="جارٍ جلب الكلانات..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-700/60">
          <Users size={48} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">لا توجد كلانات منشأة بعد</h3>
          <p className="text-slate-400 text-xs">يمكن للاعبين تأسيس كلاناتهم من صفحة الكلانات في الموقع</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-700/60">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>الكلان</th>
                  <th>التاج [TAG]</th>
                  <th>القائد</th>
                  <th>الأعضاء</th>
                  <th>المستوى</th>
                  <th>إجمالي الأرباح</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(g => (
                  <tr key={g.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-lg p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                          {g.badge || '🏰'}
                        </span>
                        <div>
                          <span className="font-bold text-white block">{g.name}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{g.description}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary-500/20 text-primary-300 border border-primary-500/30">
                        [{g.tag}]
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-300 font-semibold">{g.leader_name}</span>
                    </td>
                    <td>
                      <span className="text-xs text-white number-ltr">
                        {g.member_count} / {g.max_members}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300">
                        <Trophy size={12} /> Lvl {g.level}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-bold text-green-400 number-ltr">
                        +{g.total_winnings?.toLocaleString('ar-EG') || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        g.is_active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {g.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleActive(g)}
                          disabled={togglingId === g.id}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            g.is_active ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                          title={g.is_active ? 'إيقاف الكلان' : 'تفعيل'}
                        >
                          {togglingId === g.id ? <Loader2 size={12} className="animate-spin" /> : g.is_active ? <X size={13} /> : <Check size={13} />}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(g)}
                          className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                          title="حذف الكلان"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="حذف الكلان"
        message={`هل أنت متأكد من حذف كلان "${deleteConfirm?.name}" نهائياً؟ سيتم إلغاء عضوية جميع لاعبيه.`}
        confirmLabel="حذف الكلان"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
