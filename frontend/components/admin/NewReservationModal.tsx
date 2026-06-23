'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/axios'
import Button from '@/components/ui/Button'

const schema = z.object({
  date:           z.string().min(1, { message: '日付を入力してください' }),
  start_time:     z.string().min(1, { message: '開始時間を入力してください' }),
  end_time:       z.string().min(1, { message: '終了時間を入力してください' }),
  customer_name:  z.string().min(1, { message: '顧客名を入力してください' }),
  customer_phone: z.string().min(1, { message: '電話番号を入力してください' }),
  notes:          z.string().optional(),
})

type FormData = z.infer<typeof schema>

type Props = {
  onClose: () => void
  onSuccess: () => void
}

export default function NewReservationModal({ onClose, onSuccess }: Props) {
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setApiError(null)
    try {
      await api.post('/admin/reservations', {
        start_datetime:  `${data.date}T${data.start_time}:00`,
        end_datetime:    `${data.date}T${data.end_time}:00`,
        customer_name:   data.customer_name,
        customer_phone:  data.customer_phone,
        notes:           data.notes || null,
      })
      onSuccess()
    } catch (err: unknown) {
      setApiError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? '予約の作成に失敗しました'
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-5">新規予約（電話受付）</h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">日付</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  {...register('date')}
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
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
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">顧客名</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('customer_name')}
              />
              {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">電話番号</label>
              <input
                type="tel"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('customer_phone')}
              />
              {errors.customer_phone && <p className="text-red-500 text-xs mt-1">{errors.customer_phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                備考
                <span className="text-gray-400 font-normal ml-1">（任意）</span>
              </label>
              <textarea
                rows={2}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                {...register('notes')}
              />
            </div>

            {apiError && <p className="text-red-500 text-sm">{apiError}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1">
                予約を登録する
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
