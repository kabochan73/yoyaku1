'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'
import type { Reservation } from '@/types'
import Button from '@/components/ui/Button'

// getDay() は 0(日)〜6(土) を返すので日本語曜日に変換するマップ
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

// ステータスを日本語・色クラスに変換するマップ
const STATUS_LABEL: Record<Reservation['status'], string> = {
  confirmed: '予約確定',
  cancelled: 'キャンセル済',
}

const STATUS_COLOR: Record<Reservation['status'], string> = {
  confirmed: 'text-green-600',
  cancelled: 'text-gray-400',
}

// Laravelが返す "2026-06-24 10:00:00" を "2026年6月24日（水）" "10:00 〜 11:00" に整形
function formatRange(start: string, end: string) {
  const s = new Date(start.replace(' ', 'T')) // ' ' → 'T' でISO形式に変換
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
  const { user, token, isInitialized } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  // 初期化完了後にtokenがなければログインページへリダイレクト
  useEffect(() => {
    if (!isInitialized) return
    if (!token) router.push('/auth/login')
  }, [isInitialized, token, router])

  // 自分の予約一覧を取得（userが確定してから実行）
  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ['my-reservations'],
    queryFn: () => api.get('/reservations').then((r) => r.data),
    enabled: !!user,
  })

  // キャンセルAPIを叩いて成功したら一覧を再取得
  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/reservations/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-reservations'] }),
  })

  // 認証確認中・未ログインは何も表示しない（画面チラつき防止）
  if (!isInitialized || !token || !user) return null

  // 現在より未来 かつ キャンセル済みでない予約だけ表示
  const now = new Date()
  const upcoming = reservations.filter(
    (r) => new Date(r.start_datetime.replace(' ', 'T')) > now && r.status !== 'cancelled'
  )

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* 今後の予約 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-xl font-bold mb-4">今後の予約</h1>

        {isLoading ? (
          <p className="text-gray-400 text-sm">読み込み中...</p>
        ) : upcoming.length === 0 ? (
          <p className="text-gray-400 text-sm">今後の予約はありません</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((r) => {
              const { date, time } = formatRange(r.start_datetime, r.end_datetime)
              // このカードのキャンセルボタンだけローディング表示にする
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
