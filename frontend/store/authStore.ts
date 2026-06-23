'use client'

import { create } from 'zustand'
import type { User } from '@/types'

type AuthStore = {
  user: User | null
  token: string | null
  isInitialized: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  initializeFromStorage: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isInitialized: false,

  setAuth: (user, token) => {
    localStorage.setItem('auth_token', token)
    set({ user, token })
  },

  clearAuth: () => {
    localStorage.removeItem('auth_token')
    set({ user: null, token: null })
  },

  // ページリロード時に localStorage からトークンを復元する
  // トークンがあれば /auth/me を叩いてユーザー情報を取得するのは
  // AuthProvider（CC）側で行う
  initializeFromStorage: () => {
    const token = localStorage.getItem('auth_token')
    set({ token, isInitialized: true })
  },
}))
