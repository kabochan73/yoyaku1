'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import api from '@/lib/axios'

export default function Header() {
  const { user, clearAuth } = useAuthStore()
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
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-green-700">
          フットサルコート予約
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/mypage" className="text-sm text-gray-600 hover:text-green-600">
                マイページ
              </Link>
              {user.is_admin && (
                <Link href="/admin" className="text-sm text-gray-600 hover:text-green-600">
                  管理
                </Link>
              )}
              <Button variant="ghost" onClick={handleLogout} className="text-sm py-1">
                ログアウト
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-600 hover:text-green-600">
                ログイン
              </Link>
              <Link href="/auth/register">
                <Button className="text-sm py-1">新規登録</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
