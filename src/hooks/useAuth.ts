import { useEffect, useCallback } from 'react'
import { useAuthStore } from '../store'
import type { Player } from '../types/database'
import { supabase } from '../lib/supabase'

let globalAuthInitialized = false

export function useAuth() {
  const { player, admin, setPlayer, setAdmin, setLoading, setInitialized, logout, isLoading, isInitialized } = useAuthStore()

  const refreshPlayer = useCallback(async () => {
    if (!player?.id) return
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', player.id)
        .maybeSingle()
      
      if (!error && data) {
        if (data.account_status === 'banned') {
          logout()
        } else {
          setPlayer(data as Player)
        }
      }
    } catch (e) {
      console.error('Error refreshing player:', e)
    }
  }, [player?.id, setPlayer, logout])

  // One-time initialization: sync persisted state with DB (runs strictly once globally)
  useEffect(() => {
    if (globalAuthInitialized) return
    globalAuthInitialized = true

    let mounted = true

    const initializeAuth = async () => {
      // Read fresh values from the store at the time we run
      const state = useAuthStore.getState()
      const currentPlayer = state.player
      const currentAdmin = state.admin

      setLoading(true)

      try {
        if (currentPlayer?.id) {
          const { data: freshPlayer } = await supabase
            .from('players')
            .select('*')
            .eq('id', currentPlayer.id)
            .maybeSingle()

          if (mounted) {
            if (!freshPlayer) {
              // Player no longer exists in DB — clear session
              useAuthStore.getState().logout()
            } else if (freshPlayer.account_status === 'banned') {
              // Banned — force logout
              useAuthStore.getState().logout()
            } else {
              // active, suspended, or any other status — keep logged in with fresh data
              setPlayer(freshPlayer as Player)
            }
          }
        }

        if (currentAdmin?.id) {
          const { data: freshAdmin, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', currentAdmin.id)
            .eq('is_active', true)
            .maybeSingle()

          if (mounted) {
            if (freshAdmin) {
              // Got fresh data — update store
              setAdmin(freshAdmin)
            } else if (adminError) {
              // RLS blocked the query (no Supabase Auth session) — keep persisted admin
              // This is expected when admin logged in via custom RPC without auth.uid()
              console.warn('Admin re-validation skipped (RLS):', adminError.message)
              // Keep currentAdmin in store as-is (already there from persist)
            } else {
              // Explicit null with no error = admin truly gone/deactivated in DB
              setAdmin(null)
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscription for player balance
  useEffect(() => {
    if (!player?.id) return

    let channel: any = null

    try {
      const channelId = `player-realtime-${player.id}-${Math.random().toString(36).substring(2, 9)}`

      channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'players', filter: `id=eq.${player.id}` },
          (payload: any) => {
            if (payload?.new) {
              setPlayer(payload.new as Player)
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('Realtime channel error for player balance')
          }
        })
    } catch (err) {
      console.warn('Could not establish realtime connection:', err)
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch (_) {}
      }
    }
  }, [player?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = () => {
    logout()
  }

  return {
    player,
    admin,
    isLoading,
    isInitialized,
    isAuthenticated: !!player,
    isAdmin: !!admin,
    signOut,
    refreshPlayer,
  }
}
