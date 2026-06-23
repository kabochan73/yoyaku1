'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isInitialized } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isInitialized) return
    if (!token) { router.push('/auth/login'); return }   // トークンなし → 未ログイン
    if (user && !user.is_admin) router.push('/')          // ログイン済みだが管理者でない
  }, [isInitialized, token, user, router])

  // token はあるが /auth/me 完了前（user がまだ null）は何も表示しない
  if (!isInitialized || !token || !user?.is_admin) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <p className="text-xs text-gray-400 mb-6">管理者メニュー</p>
      {children}
    </div>
  )
}
