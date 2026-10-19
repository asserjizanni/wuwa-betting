import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Player, Admin } from '../types/database'

interface AuthState {
  player: Player | null
  admin: Admin | null
  isLoading: boolean
  isInitialized: boolean
  setPlayer: (player: Player | null) => void
  setAdmin: (admin: Admin | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      player: null,
      admin: null,
      isLoading: false,
      isInitialized: false,
      setPlayer: (player) => set({ player }),
      setAdmin: (admin) => set({ admin }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      logout: () => set({ player: null, admin: null }),
    }),
    {
      name: 'wuwa-auth',
      partialize: (state) => ({
        player: state.player,
        admin: state.admin,
      }),
    }
  )
)

interface UIState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  loginModalOpen: boolean
  setLoginModalOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  loginModalOpen: false,
  setLoginModalOpen: (loginModalOpen) => set({ loginModalOpen }),
}))
