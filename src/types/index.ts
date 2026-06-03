export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  phone: string | null
  opening_time?: string | null
  closing_time?: string | null
  working_days?: number[] | string | null
  logo_url?: string | null
  cover_image_url?: string | null
  description?: string | null
  whatsapp_url?: string | null
  instagram_url?: string | null
  address?: string | null
  business_theme?: string | null
  created_at: string
}

export interface Service {
  id: string
  business_id: string
  name: string
  duration_minutes: number
  price: number | null
  created_at: string
}

export interface Appointment {
  id: string
  business_id: string
  service_id: string | null
  customer_name: string
  customer_phone: string
  appointment_date: string
  appointment_time: string
  status: string
  manage_token?: string | null
  created_at: string
  services?: Service
}
