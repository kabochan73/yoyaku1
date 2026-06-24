'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import api from '@/lib/axios'

const NAV_ITEMS = [
  { href: '/admin',             label: '予約管理' },
  { href: '/admin/closed-days', label: '定休日'   },
  { href: '/admin/pricing',     label: '料金設定' },
  { href: '/admin/sales',       label: '売上分析' },
]

export default function AdminHeader() {
  const { clearAuth } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearAuth()
      router.push('/')
    }
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/" className="font-bold text-lg text-green-700 py-3">
          フットサルコート予約
        </Link>

        {/* 管理者ナビ */}
        <nav className="flex items-center">
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* ログアウト */}
        <Button variant="ghost" onClick={handleLogout} className="text-sm py-1">
          ログアウト
        </Button>
      </div>
    </header>
  )
}
