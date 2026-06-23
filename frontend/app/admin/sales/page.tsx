'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

type MonthlyRow  = { month: number; total: number; count: number }
type HourlyRow   = { hour: number; total: number; count: number }
type WeeklyRow   = { day_of_week: number; total: number; count: number }

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

type ChartRow = { label: string; value: number; count: number }

function BarChart({ items }: { items: ChartRow[] }) {
  const rows = items
  const maxValue = Math.max(...rows.map(r => r.value), 1)
  const maxCount = Math.max(...rows.map(r => r.count), 1)
  const useCount = rows.every(r => r.value === 0)

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const display = useCount ? row.count : row.value
        const max     = useCount ? maxCount : maxValue
        const pct     = Math.max((display / max) * 100, display > 0 ? 4 : 0)
        return (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="text-gray-500 w-14 text-right shrink-0">{row.label}</span>
            <div className="flex-1 bg-gray-100 rounded h-6 overflow-hidden">
              <div
                className="h-full bg-green-500 rounded flex items-center justify-end px-2 transition-all"
                style={{ width: `${pct}%` }}
              >
                {pct > 20 && (
                  <span className="text-xs text-white font-medium">
                    {useCount
                      ? `${row.count}件`
                      : `¥${row.value.toLocaleString()}`}
                  </span>
                )}
              </div>
            </div>
            <span className="text-gray-500 text-xs w-20 shrink-0">
              {useCount
                ? `${row.count}件`
                : `¥${row.value.toLocaleString()} / ${row.count}件`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function SalesPage() {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const monthParam = `${year}-${month.toString().padStart(2, '0')}`

  const { data: monthly = [] } = useQuery<MonthlyRow[]>({
    queryKey: ['sales-monthly', year],
    queryFn: () => api.get('/admin/sales/monthly', { params: { year } }).then(r => r.data),
  })

  const { data: hourly = [] } = useQuery<HourlyRow[]>({
    queryKey: ['sales-hourly', monthParam],
    queryFn: () =>
      api.get('/admin/sales/hourly', { params: { year, month } }).then(r => r.data),
  })

  const { data: weekly = [] } = useQuery<WeeklyRow[]>({
    queryKey: ['sales-weekly', monthParam],
    queryFn: () =>
      api.get('/admin/sales/weekly', { params: { year, month } }).then(r => r.data),
  })

  const goToPrevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const goToNextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  // 月別データを1〜12月で埋める
  const monthlyFull = Array.from({ length: 12 }, (_, i) => {
    const found = monthly.find(r => Number(r.month) === i + 1)
    return { label: `${i + 1}月`, value: found?.total ?? 0, count: found?.count ?? 0 }
  })

  // 時間帯データを営業時間に合わせて並べる（あるデータだけ表示）
  const hourlyRows = hourly.map(r => ({
    label: `${String(Number(r.hour)).padStart(2, '0')}時`,
    value: Number(r.total),
    count: Number(r.count),
  }))

  // 曜日データを日〜土で埋める
  const weeklyFull = Array.from({ length: 7 }, (_, i) => {
    const found = weekly.find(r => Number(r.day_of_week) === i)
    return { label: WEEKDAYS[i], value: found?.total ?? 0, count: found?.count ?? 0 }
  })

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">売上分析</h1>

      {/* 月別売上 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">月別（{year}年）</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setYear(y => y - 1)}
              className="px-2 py-1 border rounded text-sm text-gray-600 hover:bg-gray-50"
            >
              ←
            </button>
            <span className="text-sm font-medium w-16 text-center">{year}年</span>
            <button
              onClick={() => setYear(y => y + 1)}
              className="px-2 py-1 border rounded text-sm text-gray-600 hover:bg-gray-50"
            >
              →
            </button>
          </div>
        </div>
        <BarChart items={monthlyFull} />
      </section>

      {/* 時間帯別・曜日別 */}
      <div className="flex items-center gap-3">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* 時間帯別 */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold mb-4">時間帯別</h2>
          {hourlyRows.length === 0 ? (
            <p className="text-gray-400 text-sm">データがありません</p>
          ) : (
            <BarChart items={hourlyRows} />
          )}
        </section>

        {/* 曜日別 */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold mb-4">曜日別</h2>
          <BarChart items={weeklyFull} />
        </section>
      </div>
    </div>
  )
}
