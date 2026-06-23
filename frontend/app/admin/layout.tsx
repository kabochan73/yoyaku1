'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isInitialized) return
    if (!user) { router.push('/auth/login'); return }
    if (!user.is_admin) router.push('/')
  }, [isInitialized, user, router])

  if (!isInitialized || !user?.is_admin) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <p className="text-xs text-gray-400 mb-6">管理者メニュー</p>
      {children}
    </div>
  )
}
