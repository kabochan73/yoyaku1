'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import api from '@/lib/axios'

type TimeSlot = { start: string; end: string }

type Props = {
  date: string
  slot: TimeSlot
  onClose: () => void
  onSuccess: () => void
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export default function ReservationModal({ date, slot, onClose, onSuccess }: Props) {
  const { user } = useAuthStore()
  const router = useRouter()
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [y, m, d] = date.split('-').map(Number)
  const weekday = new Date(y, m - 1, d).getDay()
  const dateLabel = `${y}年${m}月${d}日（${WEEKDAYS[weekday]}）`

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      await api.post('/reservations', {
        start_datetime: `${date}T${slot.start}:00`,
        end_datetime:   `${date}T${slot.end}:00`,
        notes: notes || null,
      })
      onSuccess()
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? '予約に失敗しました。時間をおいて再度お試しください。'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">予約内容の確認</h3>

          <div className="bg-gray-50 rounded p-3 mb-4 space-y-1 text-sm">
            <p>
              <span className="text-gray-500 w-12 inline-block">日付</span>
              {dateLabel}
            </p>
            <p>
              <span className="text-gray-500 w-12 inline-block">時間</span>
              {slot.start} 〜 {slot.end}
            </p>
          </div>

          {!user ? (
            <div className="text-center space-y-3">
              <p className="text-gray-600 text-sm">予約するにはログインが必要です</p>
              <Button onClick={() => router.push('/auth/login')} className="w-full">
                ログインする
              </Button>
              <button
                onClick={onClose}
                className="block w-full text-sm text-gray-500 hover:underline"
              >
                閉じる
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  備考
                  <span className="text-gray-400 font-normal ml-1">（任意）</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="人数、ご要望など"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  戻る
                </button>
                <Button onClick={handleSubmit} isLoading={isSubmitting} className="flex-1">
                  予約を確定する
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
