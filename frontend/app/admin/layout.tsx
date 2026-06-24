'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import AdminHeader from '@/components/admin/AdminHeader'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isInitialized } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isInitialized) return
    if (!token) { router.push('/auth/login'); return }
    if (user && !user.is_admin) router.push('/')
  }, [isInitialized, token, user, router])

  if (!isInitialized || !token || !user?.is_admin) return null

  return (
    <>
      <AdminHeader />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </div>
    </>
  )
}
