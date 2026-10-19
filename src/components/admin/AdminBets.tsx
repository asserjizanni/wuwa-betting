import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner, EmptyState } from '../shared/UI'
import { formatDate, getBetStatusClass, getBetStatusLabel } from '../../lib/utils'
import { BarChart2, Search, Filter } from 'lucide-react'
import type { Player } from '../../types/database'

interface BetRow {
  id: string
  stake: number
  multiplier_snapshot: number
  potential_payout: number
  status: string
  created_at: string
  settled_at: string | null
  player: Pick<Player, 'username'>
  event: { title: string }
  selected_character: { name: string }
}

export function AdminBets() {
  const [bets, setBets] = useState<BetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { loadBets() }, [])

  const loadBets = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bets')
      .select(`
        *,
        player:players!bets_player_id_fkey(username),
        event:events!bets_event_id_fkey(title),
        selected_character:characters!bets_selected_character_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(200)
    if (data) setBets(data as any)
    setLoading(false)
  }

  const filtered = bets.filter(b => {
    const matchesSearch = !search ||
      (b.player as any)?.username?.toLowerCase().includes(search.toLowerCase()) ||
      (b.event as any)?.title?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">إدارة الرهانات</h1>
        <p className="text-slate-400 text-sm mt-1">{bets.length} رهان مسجل</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="البحث باللاعب أو الإيفنت..." className="input-field pr-10 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field py-2 text-sm">
            <option value="all">جميع الحالات</option>
            <option value="confirmed">مؤكد</option>
            <option value="won">فائز</option>
            <option value="lost">خاسر</option>
            <option value="refunded">مسترد</option>
            <option value="cancelled">ملغى</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><LoadingSpinner text="جارٍ التحميل..." /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<BarChart2 size={48} />} title="لا توجد رهانات" description="لم يتم تسجيل أي رهانات بعد" />
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>اللاعب</th>
                  <th>الإيفنت</th>
                  <th className="hidden md:table-cell">الشخصية المختارة</th>
                  <th>مبلغ الرهان</th>
                  <th className="hidden sm:table-cell">المضاعف</th>
                  <th className="hidden lg:table-cell">المكافأة المحتملة</th>
                  <th>الحالة</th>
                  <th className="hidden xl:table-cell">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(bet => (
                  <tr key={bet.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold">
                          {(bet.player as any)?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-white">{(bet.player as any)?.username}</span>
                      </div>
                    </td>
                    <td className="text-slate-400 max-w-32 truncate">{(bet.event as any)?.title}</td>
                    <td className="hidden md:table-cell text-slate-300">{(bet.selected_character as any)?.name}</td>
                    <td className="font-bold text-white number-ltr">{bet.stake.toLocaleString('ar-EG')}</td>
                    <td className="hidden sm:table-cell text-orange-400">×{bet.multiplier_snapshot}</td>
                    <td className="hidden lg:table-cell text-green-400 number-ltr">{bet.potential_payout.toLocaleString('ar-EG')}</td>
                    <td>
                      <span className={`badge ${getBetStatusClass(bet.status)}`}>
                        {getBetStatusLabel(bet.status)}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell text-slate-500 text-xs">{formatDate(bet.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
