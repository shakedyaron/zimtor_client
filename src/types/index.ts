export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  phone: string | null
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
  created_at: string
  services?: Service
}
