'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Reservation } from '@/types'
import Button from '@/components/ui/Button'
import NewReservationModal from '@/components/admin/NewReservationModal'

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
    date: `${s.getMonth() + 1}/${s.getDate()}（${dow}）`,
    time: `${fmt(s)} 〜 ${fmt(e)}`,
  }
}

function toMonthParam(year: number, month: number) {
  return `${year}-${month.toString().padStart(2, '0')}`
}

type ReservationWithUser = Reservation & {
  user?: { id: number; name: string; email: string; phone: string | null } | null
}

export default function AdminReservationsPage() {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1) // 1-indexed
  const [showModal, setShowModal] = useState(false)

  const queryClient = useQueryClient()
  const monthParam  = toMonthParam(year, month)

  const { data: reservations = [], isLoading } = useQuery<ReservationWithUser[]>({
    queryKey: ['admin-reservations', monthParam],
    queryFn: () =>
      api.get('/admin/reservations', { params: { month: monthParam } }).then((r) => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/reservations/${id}/cancel`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-reservations', monthParam] }),
  })

  const goToPrevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12) }
    else setMonth((m) => m - 1)
  }

  const goToNextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1) }
    else setMonth((m) => m + 1)
  }

  const active     = reservations.filter((r) => r.status !== 'cancelled')
  const cancelled  = reservations.filter((r) => r.status === 'cancelled')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">予約管理</h1>
        <Button onClick={() => setShowModal(true)}>＋ 新規予約</Button>
      </div>

      {/* 月ナビゲーション */}
      <div className="flex items-center gap-4">
        <button
          onClick={goToPrevMonth}
          className="px-3 py-1.5 border rounded text-sm text-gray-600 hover:bg-gray-50"
        >
          ← 前月
        </button>
        <span className="font-semibold">{year}年{month}月</span>
        <button
          onClick={goToNextMonth}
          className="px-3 py-1.5 border rounded text-sm text-gray-600 hover:bg-gray-50"
        >
          翌月 →
        </button>
      </div>

      {/* 予約一覧 */}
      <div className="bg-white rounded-lg shadow-sm">
        {isLoading ? (
          <p className="p-6 text-gray-400 text-sm">読み込み中...</p>
        ) : active.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">この月の予約はありません</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">日時</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">顧客</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">ステータス</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {active.map((r) => {
                const { date, time } = formatRange(r.start_datetime, r.end_datetime)
                const customerName   = r.user?.name ?? r.customer_name ?? '（管理者登録）'
                const customerPhone  = r.user?.phone ?? r.customer_phone

                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{date}</p>
                      <p className="text-gray-500">{time}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{customerName}</p>
                      {customerPhone && <p className="text-gray-500">{customerPhone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="danger"
                        isLoading={cancelMutation.isPending && cancelMutation.variables === r.id}
                        onClick={() => {
                          if (confirm('この予約をキャンセルしますか？')) {
                            cancelMutation.mutate(r.id)
                          }
                        }}
                        className="text-xs py-1 px-2"
                      >
                        キャンセル
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* キャンセル済み（折りたたみ表示） */}
      {cancelled.length > 0 && (
        <details className="bg-white rounded-lg shadow-sm">
          <summary className="px-4 py-3 text-sm text-gray-500 cursor-pointer select-none">
            キャンセル済み ({cancelled.length}件)
          </summary>
          <table className="w-full text-sm border-t">
            <tbody className="divide-y">
              {cancelled.map((r) => {
                const { date, time } = formatRange(r.start_datetime, r.end_datetime)
                const customerName   = r.user?.name ?? r.customer_name ?? '（管理者登録）'
                return (
                  <tr key={r.id} className="opacity-50">
                    <td className="px-4 py-3">
                      <p>{date}</p>
                      <p className="text-gray-500">{time}</p>
                    </td>
                    <td className="px-4 py-3">{customerName}</td>
                    <td className="px-4 py-3 text-gray-400">キャンセル済</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </details>
      )}

      {showModal && (
        <NewReservationModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            queryClient.invalidateQueries({ queryKey: ['admin-reservations', monthParam] })
          }}
        />
      )}
    </div>
  )
}
