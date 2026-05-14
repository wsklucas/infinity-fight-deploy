import { create } from 'zustand'
import Cookies from 'js-cookie'
import { login as apiLogin, logout as apiLogout } from '../lib/api'

interface User {
  id: string
  name: string
  email: string
  role: 'INSTRUCTOR' | 'STUDENT' | 'ADMIN'
  academy: string
}

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => void
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  hydrate: () => {
    const stored = localStorage.getItem('user')
    if (stored) set({ user: JSON.parse(stored), loading: false })
    else set({ loading: false })
  },

  login: async (email, password) => {
    const data = await apiLogin(email, password)
    Cookies.set('access_token', data.access_token, { expires: 1/96 })
    Cookies.set('refresh_token', data.refresh_token, { expires: 7 })
    localStorage.setItem('user', JSON.stringify(data.user))
    set({ user: data.user })
  },

  logout: async () => {
    const refresh = Cookies.get('refresh_token')
    if (refresh) await apiLogout(refresh).catch(() => {})
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    localStorage.removeItem('user')
    set({ user: null })
  },
}))
