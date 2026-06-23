'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/axios'
import type { PricingRule } from '@/types'
import Button from '@/components/ui/Button'

const DAY_TYPE_LABEL: Record<PricingRule['day_type'], string> = {
  weekday: '平日',
  weekend: '土日',
  holiday: '祝日',
}

const schema = z.object({
  name:           z.string().min(1, { message: 'プラン名を入力してください' }),
  day_type:       z.enum(['weekday', 'weekend', 'holiday']),
  start_time:     z.string().min(1, { message: '開始時間を入力してください' }),
  end_time:       z.string().min(1, { message: '終了時間を入力してください' }),
  price_per_hour: z.number().min(0, { message: '0以上の金額を入力してください' }),
})

type FormData = z.infer<typeof schema>

export default function PricingPage() {
  const queryClient = useQueryClient()
  const [apiError, setApiError] = useState<string | null>(null)

  const { data: rules = [], isLoading } = useQuery<PricingRule[]>({
    queryKey: ['pricing-rules'],
    queryFn: () => api.get('/pricing-rules').then((r) => r.data),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { day_type: 'weekday' },
  })

  const addMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/admin/pricing-rules', { ...data, is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] })
      reset()
      setApiError(null)
    },
    onError: (err: unknown) => {
      setApiError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? '登録に失敗しました'
      )
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (rule: PricingRule) =>
      api.put(`/admin/pricing-rules/${rule.id}`, { ...rule, is_active: !rule.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pricing-rules'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/pricing-rules/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pricing-rules'] }),
  })

  const onSubmit = (data: FormData) => {
    setApiError(null)
    addMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">料金設定</h1>

      {/* 追加フォーム */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold mb-4">料金プランを追加</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">プラン名</label>
              <input
                type="text"
                placeholder="例：平日・昼間"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('name')}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">区分</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('day_type')}
              >
                <option value="weekday">平日</option>
                <option value="weekend">土日</option>
                <option value="holiday">祝日</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">開始時間</label>
              <input
                type="time"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('start_time')}
              />
              {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">終了時間</label>
              <input
                type="time"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('end_time')}
              />
              {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">料金（円/時間）</label>
              <input
                type="number"
                min="0"
                step="100"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('price_per_hour', { valueAsNumber: true })}
              />
              {errors.price_per_hour && <p className="text-red-500 text-xs mt-1">{errors.price_per_hour.message}</p>}
            </div>
          </div>

          {apiError && <p className="text-red-500 text-sm">{apiError}</p>}

          <Button type="submit" isLoading={isSubmitting}>追加する</Button>
        </form>
      </section>

      {/* 料金プラン一覧 */}
      <section className="bg-white rounded-lg shadow-sm">
        {isLoading ? (
          <p className="p-6 text-gray-400 text-sm">読み込み中...</p>
        ) : rules.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">料金プランが登録されていません</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">プラン名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">区分</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">時間帯</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">料金/時間</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">有効</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {rules.map((rule) => (
                <tr key={rule.id} className={`hover:bg-gray-50 ${!rule.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{rule.name}</td>
                  <td className="px-4 py-3">{DAY_TYPE_LABEL[rule.day_type]}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {rule.start_time.slice(0, 5)} 〜 {rule.end_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    ¥{rule.price_per_hour.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleMutation.mutate(rule)}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        rule.is_active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${
                          rule.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="danger"
                      isLoading={deleteMutation.isPending && deleteMutation.variables === rule.id}
                      onClick={() => {
                        if (confirm('このプランを削除しますか？')) deleteMutation.mutate(rule.id)
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
