'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { BusinessSettings, ClosedDay } from '@/types'
import ReservationModal from './ReservationModal'

type TimeSlot = { start: string; end: string }

type ReservedSlot = {
  id: number
  start_datetime: string
  end_datetime: string
}

type Props = {
  settings: BusinessSettings
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function toYYYYMMDD(date: Date): string {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

function generateTimeSlots(openingTime: string, closingTime: string, slotMinutes: number): TimeSlot[] {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const fmt = (min: number) => {
    const h = Math.floor(min / 60).toString().padStart(2, '0')
    const m = (min % 60).toString().padStart(2, '0')
    return `${h}:${m}`
  }

  const start = toMin(openingTime)
  const end = toMin(closingTime)
  const slots: TimeSlot[] = []

  for (let t = start; t + slotMinutes <= end; t += slotMinutes) {
    slots.push({ start: fmt(t), end: fmt(t + slotMinutes) })
  }

  return slots
}

function isSlotTaken(slot: TimeSlot, date: string, reservations: ReservedSlot[]): boolean {
  // "2024-01-15 10:00:00" → replace space with T for Date parsing
  const sStart = new Date(`${date}T${slot.start}:00`)
  const sEnd   = new Date(`${date}T${slot.end}:00`)

  return reservations.some((r) => {
    const rStart = new Date(r.start_datetime.replace(' ', 'T'))
    const rEnd   = new Date(r.end_datetime.replace(' ', 'T'))
    return sStart < rEnd && sEnd > rStart
  })
}

export default function Calendar({ settings }: Props) {
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  const todayStr = toYYYYMMDD(todayDate)

  const [year, setYear]               = useState(todayDate.getFullYear())
  const [month, setMonth]             = useState(todayDate.getMonth()) // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  const queryClient = useQueryClient()

  // 全定休日を取得（変更が少ないので長めにキャッシュ）
  const { data: closedDays = [] } = useQuery<ClosedDay[]>({
    queryKey: ['closed-days'],
    queryFn: () => api.get('/closed-days').then((r) => r.data),
    staleTime: 1000 * 60 * 30,
  })

  // 選択した日の予約済み枠
  const { data: reservedSlots = [], isFetching: isFetchingSlots } = useQuery<ReservedSlot[]>({
    queryKey: ['availability', selectedDate],
    queryFn: () =>
      api.get('/reservations/availability', { params: { date: selectedDate } }).then((r) => r.data),
    enabled: selectedDate !== null,
  })

  // 定休日の日付セット（"YYYY-MM-DD" で比較）
  const closedDateSet = new Set(
    closedDays.map((d) => (d.date as string).substring(0, 10))
  )

  const slotMinutes = parseInt(settings.slot_minutes, 10)
  const timeSlots   = generateTimeSlots(settings.opening_time, settings.closing_time, slotMinutes)

  // カレンダーグリッドの生成
  const firstDay    = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow    = firstDay.getDay() // 0=日〜6=土

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const goToPrevMonth = () => {
    setSelectedDate(null)
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }

  const goToNextMonth = () => {
    setSelectedDate(null)
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  const handleDayClick = (day: number) => {
    const dateStr = toYYYYMMDD(new Date(year, month, day))
    if (dateStr < todayStr) return
    if (closedDateSet.has(dateStr)) return
    setSelectedDate(dateStr)
    setSelectedSlot(null)
  }

  const getDayMeta = (day: number) => {
    const dateStr = toYYYYMMDD(new Date(year, month, day))
    const dow     = (startDow + day - 1) % 7
    return {
      dateStr,
      isPast:    dateStr < todayStr,
      isClosed:  closedDateSet.has(dateStr),
      isToday:   dateStr === todayStr,
      isSelected: dateStr === selectedDate,
      isWeekend: dow === 0 || dow === 6,
      isSunday:  dow === 0,
      isSaturday: dow === 6,
    }
  }

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const dow = new Date(y, m - 1, d).getDay()
    return `${y}年${m}月${d}日（${WEEKDAYS[dow]}）`
  }

  return (
    <div className="space-y-6">
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="px-3 py-1.5 rounded border text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ← 前月
        </button>
        <h3 className="text-base font-semibold">
          {year}年{month + 1}月
        </h3>
        <button
          onClick={goToNextMonth}
          className="px-3 py-1.5 rounded border text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          翌月 →
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e${idx}`} />

          const { isPast, isClosed, isToday, isSelected, isSunday, isSaturday } = getDayMeta(day)
          const disabled = isPast || isClosed

          let cls =
            'relative h-11 rounded flex flex-col items-center justify-center text-sm transition-colors select-none '

          if (isSelected) {
            cls += 'bg-green-600 text-white font-medium '
          } else if (disabled) {
            cls += 'text-gray-300 cursor-not-allowed '
          } else if (isToday) {
            cls += 'border-2 border-green-500 text-green-700 font-semibold cursor-pointer hover:bg-green-50 '
          } else {
            cls += 'cursor-pointer hover:bg-gray-100 '
            if (isSunday) cls += 'text-red-500 '
            else if (isSaturday) cls += 'text-blue-500 '
          }

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              disabled={disabled}
              className={cls}
            >
              {day}
              {isClosed && !isPast && (
                <span className="text-xs leading-none text-gray-300">休</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded border-2 border-green-500 inline-block" />今日
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-green-600 inline-block" />選択中
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-gray-100 border border-gray-200 inline-block" />予約可
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-white border border-gray-200 inline-block text-center leading-4 text-gray-300">休</span>定休日
        </span>
      </div>

      {/* 時間帯一覧 */}
      {selectedDate && (
        <div className="border-t pt-5">
          <h4 className="font-medium mb-3 text-sm">
            {formatDate(selectedDate)} の空き時間
          </h4>

          {isFetchingSlots ? (
            <p className="text-gray-400 text-sm">読み込み中...</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {timeSlots.map((slot) => {
                const taken = isSlotTaken(slot, selectedDate, reservedSlots)
                return (
                  <button
                    key={`${slot.start}-${slot.end}`}
                    onClick={() => !taken && setSelectedSlot(slot)}
                    disabled={taken}
                    className={`py-2 px-2 rounded text-xs border transition-colors ${
                      taken
                        ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                        : 'bg-white text-green-700 border-green-300 hover:bg-green-50 hover:border-green-500 cursor-pointer'
                    }`}
                  >
                    <div className="font-medium">{slot.start}</div>
                    <div className="text-gray-400">〜 {slot.end}</div>
                    {taken && <div className="text-gray-300 mt-0.5">予約済</div>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 予約モーダル */}
      {selectedSlot && selectedDate && (
        <ReservationModal
          date={selectedDate}
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onSuccess={() => {
            setSelectedSlot(null)
            queryClient.invalidateQueries({ queryKey: ['availability', selectedDate] })
          }}
        />
      )}
    </div>
  )
}
