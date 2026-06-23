export type User = {
  id: number
  name: string
  email: string
  phone: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export type Reservation = {
  id: number
  user_id: number | null
  start_datetime: string
  end_datetime: string
  status: 'pending' | 'confirmed' | 'cancelled'
  total_price: number
  customer_name: string | null
  customer_phone: string | null
  reserved_by_admin: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type PricingRule = {
  id: number
  name: string
  day_type: 'weekday' | 'weekend' | 'holiday'
  start_time: string
  end_time: string
  price_per_hour: number
  is_active: boolean
}

export type ClosedDay = {
  id: number
  date: string
  type: 'regular' | 'special' | 'national'
  reason: string | null
}

export type BusinessSettings = {
  opening_time: string
  closing_time: string
  slot_minutes: string
}
