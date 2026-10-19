import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Clock, Users, Flame } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDate, getImageUrl } from '../lib/utils'
import { EmptyState, LoadingSpinner } from '../components/shared/UI'
import { CharacterImage } from '../components/shared/ImageUpload'
import type { EventWithCharacters } from '../types/database'

export function HistoryPage() {
  const [events, setEvents] = useState<EventWithCharacters[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadHistory() }, [])

  const loadHistory = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select(`
        *,
        character_a:characters!events_character_a_id_fkey(*),
        character_b:characters!events_character_b_id_fkey(*),
        winner_character:characters!events_winner_character_id_fkey(*)
      `)
      .eq('status', 'completed')
      .order('settled_at', { ascending: false })
    
    if (data) setEvents(data as EventWithCharacters[])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="جارٍ تحميل السجل..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-16 max-w-5xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">سجل الإيفنتات</h1>
        <p className="text-slate-400">جميع الإيفنتات المكتملة ونتائجها</p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<Clock size={48} />}
          title="لا توجد إيفنتات مكتملة بعد"
          description="ستظهر النتائج هنا عند اكتمال الإيفنتات"
        />
      ) : (
        <div className="space-y-4">
          {events.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link to={`/events/${event.id}`}>
                <div className="glass-card-hover rounded-2xl overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Cover */}
                    {event.cover_image_path && (
                      <div className="w-full md:w-32 h-24 md:h-auto flex-shrink-0">
                        <img
                          src={getImageUrl(event.cover_image_path, 'event-covers')}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="font-bold text-white">{event.title}</h3>
                          {event.settled_at && (
                            <p className="text-xs text-slate-500 mt-0.5">{formatDate(event.settled_at)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
                          <Trophy size={12} className="text-amber-400" />
                          <span className="text-xs text-amber-400 font-semibold">مكتمل</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Char A */}
                        <div className={`flex-1 flex items-center gap-2 p-2 rounded-xl transition-colors ${event.winner_character_id === event.character_a_id ? 'bg-amber-500/10 border border-amber-500/30' : 'opacity-50'}`}>
                          <CharacterImage imagePath={event.character_a.image_path} name={event.character_a.name} size="sm" />
                          <div>
                            <p className="text-xs font-semibold text-white">{event.character_a.name}</p>
                            {event.winner_character_id === event.character_a_id && (
                              <p className="text-xs text-amber-400">🏆 فائز</p>
                            )}
                          </div>
                        </div>

                        <span className="text-slate-600 font-bold text-sm">VS</span>

                        {/* Char B */}
                        <div className={`flex-1 flex items-center gap-2 p-2 rounded-xl transition-colors ${event.winner_character_id === event.character_b_id ? 'bg-amber-500/10 border border-amber-500/30' : 'opacity-50'}`}>
                          <CharacterImage imagePath={event.character_b.image_path} name={event.character_b.name} size="sm" />
                          <div>
                            <p className="text-xs font-semibold text-white">{event.character_b.name}</p>
                            {event.winner_character_id === event.character_b_id && (
                              <p className="text-xs text-amber-400">🏆 فائز</p>
                            )}
                          </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-1 text-sm text-orange-400">
                          <Flame size={14} />
                          <span>×{event.multiplier}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
