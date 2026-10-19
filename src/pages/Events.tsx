import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Swords, Filter, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getEventStatusClass, getEventStatusLabel, getImageUrl, formatRelativeDate } from '../lib/utils'
import { EmptyState, LoadingSpinner } from '../components/shared/UI'
import { CharacterImage } from '../components/shared/ImageUpload'
import type { EventWithCharacters, EventStatus } from '../types/database'

const STATUS_FILTERS: { label: string; value: EventStatus | 'all' }[] = [
  { label: 'الكل', value: 'all' },
  { label: 'مفتوح', value: 'open' },
  { label: 'مجدول', value: 'scheduled' },
  { label: 'مغلق', value: 'closed' },
  { label: 'مكتمل', value: 'completed' },
]

export function EventsListPage() {
  const [events, setEvents] = useState<EventWithCharacters[]>([])
  const [filtered, setFiltered] = useState<EventWithCharacters[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<EventStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => { loadEvents() }, [])

  useEffect(() => {
    let result = events
    if (status !== 'all') result = result.filter(e => e.status === status)
    if (search) result = result.filter(e => 
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.character_a.name.toLowerCase().includes(search.toLowerCase()) ||
      e.character_b.name.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(result)
  }, [events, status, search])

  const loadEvents = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select(`
        *,
        character_a:characters!events_character_a_id_fkey(*),
        character_b:characters!events_character_b_id_fkey(*),
        winner_character:characters!events_winner_character_id_fkey(*)
      `)
      .not('status', 'eq', 'draft')
      .order('created_at', { ascending: false })
    
    if (data) {
      setEvents(data as EventWithCharacters[])
      setFiltered(data as EventWithCharacters[])
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen pt-24 pb-16 max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">جميع الإيفنتات</h1>
        <p className="text-slate-400">شارك في الإيفنتات المفتوحة وراهن على شخصياتك المفضلة</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن إيفنت أو شخصية..."
            className="input-field pr-10 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                status === f.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="جارٍ تحميل الإيفنتات..." />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Swords size={48} />}
          title={search || status !== 'all' ? 'لا توجد نتائج' : 'لا توجد إيفنتات متاحة حالياً'}
          description={search || status !== 'all' ? 'جرّب تغيير معايير البحث' : 'ترقّب التحديات القادمة! سيتم إعلان الإيفنتات الجديدة قريباً.'}
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filtered.map(event => (
            <motion.div
              key={event.id}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            >
              <Link to={`/events/${event.id}`} className="block h-full">
                <div className="glass-card-hover rounded-2xl overflow-hidden h-full flex flex-col">
                  {event.cover_image_path && (
                    <div className="h-32 overflow-hidden flex-shrink-0">
                      <img
                        src={getImageUrl(event.cover_image_path, 'event-covers')}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <h3 className="font-bold text-white">{event.title}</h3>
                      <span className={`badge ${getEventStatusClass(event.status)} flex-shrink-0`}>
                        {getEventStatusLabel(event.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1 flex flex-col items-center gap-2">
                        <CharacterImage imagePath={event.character_a.image_path} name={event.character_a.name} size="md" />
                        <span className="text-xs font-medium text-slate-300 text-center line-clamp-1">{event.character_a.name}</span>
                      </div>
                      <div className="text-slate-600 font-black text-xl">VS</div>
                      <div className="flex-1 flex flex-col items-center gap-2">
                        <CharacterImage imagePath={event.character_b.image_path} name={event.character_b.name} size="md" />
                        <span className="text-xs font-medium text-slate-300 text-center line-clamp-1">{event.character_b.name}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
                      <span>مضاعف ×{event.multiplier}</span>
                      {event.closes_at && event.status === 'open' && (
                        <span className="text-amber-400">{formatRelativeDate(event.closes_at)}</span>
                      )}
                      {event.status === 'completed' && event.winner_character && (
                        <span className="text-amber-400">الفائز: {event.winner_character.name}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
