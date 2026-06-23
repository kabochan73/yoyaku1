'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'
import type { Reservation } from '@/types'
import Button from '@/components/ui/Button'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

const STATUS_LABEL: Record<Reservation['status'], string> = {
  pending:   '予約中',
  confirmed: '予約確定',
  cancelled: 'キャンセル済',
}

const STATUS_COLOR: Record<Reservation['status'], string> = {
  pending:   'text-yellow-600',
  confirmed: 'text-green-600',
  cancelled: 'text-gray-400',
}

function formatRange(start: string, end: string) {
  const s = new Date(start.replace(' ', 'T'))
  const e = new Date(end.replace(' ', 'T'))
  const fmt = (d: Date) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  const dow = WEEKDAYS[s.getDay()]
  return {
    date: `${s.getFullYear()}年${s.getMonth() + 1}月${s.getDate()}日（${dow}）`,
    time: `${fmt(s)} 〜 ${fmt(e)}`,
  }
}

export default function MyPage() {
  const { user, isInitialized } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isInitialized && !user) router.push('/auth/login')
  }, [isInitialized, user, router])

  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ['my-reservations'],
    queryFn: () => api.get('/reservations').then((r) => r.data),
    enabled: !!user,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/reservations/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-reservations'] }),
  })

  if (!isInitialized || !user) return null

  const now = new Date()
  const upcoming = reservations.filter(
    (r) => new Date(r.start_datetime.replace(' ', 'T')) > now && r.status !== 'cancelled'
  )

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* プロフィール */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-xl font-bold mb-4">マイページ</h1>
        <div className="space-y-2 text-sm">
          <div className="flex gap-4">
            <span className="text-gray-500 w-24 shrink-0">名前</span>
            <span>{user.name}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-500 w-24 shrink-0">メールアドレス</span>
            <span>{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex gap-4">
              <span className="text-gray-500 w-24 shrink-0">電話番号</span>
              <span>{user.phone}</span>
            </div>
          )}
        </div>
      </section>

      {/* 今後の予約 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">今後の予約</h2>

        {isLoading ? (
          <p className="text-gray-400 text-sm">読み込み中...</p>
        ) : upcoming.length === 0 ? (
          <p className="text-gray-400 text-sm">今後の予約はありません</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((r) => {
              const { date, time } = formatRange(r.start_datetime, r.end_datetime)
              const isCancelling =
                cancelMutation.isPending && cancelMutation.variables === r.id

              return (
                <div key={r.id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{date}</p>
                    <p className="text-gray-600">{time}</p>
                    <p className={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</p>
                  </div>
                  <Button
                    variant="danger"
                    isLoading={isCancelling}
                    onClick={() => {
                      if (confirm('この予約をキャンセルしますか？')) {
                        cancelMutation.mutate(r.id)
                      }
                    }}
                    className="text-sm py-1 shrink-0"
                  >
                    キャンセル
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
