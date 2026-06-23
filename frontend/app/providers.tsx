'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

function AuthInitializer() {
  const { token, setAuth, clearAuth, initializeFromStorage, isInitialized } = useAuthStore()

  useEffect(() => {
    initializeFromStorage()
  }, [initializeFromStorage])

  // トークンがあれば /auth/me でユーザー情報を復元する
  useEffect(() => {
    if (!isInitialized || !token) return

    api.get('/auth/me')
      .then((res) => setAuth(res.data, token))
      .catch(() => clearAuth())
  }, [isInitialized, token, setAuth, clearAuth])

  return null
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 1000 * 60, // 1分間はキャッシュを新鮮とみなす
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      {children}
    </QueryClientProvider>
  )
}
