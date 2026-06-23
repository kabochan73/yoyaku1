'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/axios'
import type { ClosedDay } from '@/types'
import Button from '@/components/ui/Button'

const TYPE_LABEL: Record<ClosedDay['type'], string> = {
  regular:  '定休日',
  special:  '臨時休業',
  national: '祝日',
}

const schema = z.object({
  date:   z.string().min(1, { message: '日付を入力してください' }),
  type:   z.enum(['regular', 'special', 'national']),
  reason: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function formatDate(dateStr: string) {
  const d = new Date((dateStr as string).substring(0, 10) + 'T00:00:00')
  const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`
}

export default function ClosedDaysPage() {
  const queryClient = useQueryClient()
  const [apiError, setApiError] = useState<string | null>(null)

  const { data: closedDays = [], isLoading } = useQuery<ClosedDay[]>({
    queryKey: ['closed-days'],
    queryFn: () => api.get('/closed-days').then((r) => r.data),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'special' },
  })

  const addMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/admin/closed-days', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closed-days'] })
      reset()
      setApiError(null)
    },
    onError: (err: unknown) => {
      setApiError(
        (err as { response?: { data?: { errors?: { date?: string[] }; message?: string } } })
          ?.response?.data?.errors?.date?.[0]
          ?? (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? '登録に失敗しました'
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/closed-days/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['closed-days'] }),
  })

  const onSubmit = (data: FormData) => {
    setApiError(null)
    addMutation.mutate(data)
  }

  const sorted = [...closedDays].sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">定休日管理</h1>

      {/* 追加フォーム */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold mb-4">定休日を追加</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">日付</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('date')}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">種別</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('type')}
              >
                <option value="special">臨時休業</option>
                <option value="regular">定休日</option>
                <option value="national">祝日</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                理由
                <span className="text-gray-400 font-normal ml-1">（任意）</span>
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="例：設備メンテナンス"
                {...register('reason')}
              />
            </div>
          </div>

          {apiError && <p className="text-red-500 text-sm">{apiError}</p>}

          <Button type="submit" isLoading={isSubmitting}>追加する</Button>
        </form>
      </section>

      {/* 定休日一覧 */}
      <section className="bg-white rounded-lg shadow-sm">
        {isLoading ? (
          <p className="p-6 text-gray-400 text-sm">読み込み中...</p>
        ) : sorted.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">登録された定休日はありません</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">日付</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">種別</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">理由</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(d.date as string)}</td>
                  <td className="px-4 py-3">{TYPE_LABEL[d.type]}</td>
                  <td className="px-4 py-3 text-gray-500">{d.reason ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="danger"
                      isLoading={deleteMutation.isPending && deleteMutation.variables === d.id}
                      onClick={() => {
                        if (confirm('この定休日を削除しますか？')) deleteMutation.mutate(d.id)
                      }}
                      className="text-xs py-1 px-2"
                    >
                      削除
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
