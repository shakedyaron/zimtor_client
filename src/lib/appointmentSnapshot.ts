import type { Appointment } from "@/types"

type ServiceSnapshotSource = Pick<
  Appointment,
  "service_name" | "service_price" | "service_duration_minutes"
> & {
  services?:
    | {
        name?: string | null
        price?: number | string | null
        duration_minutes?: number | string | null
      }
    | {
        name?: string | null
        price?: number | string | null
        duration_minutes?: number | string | null
      }[]
    | null
}

function joinedService(appointment: ServiceSnapshotSource) {
  const service = appointment.services
  if (Array.isArray(service)) return service[0] ?? null
  return service ?? null
}

function numberOrFallback(
  value: number | string | null | undefined,
  fallback: number
) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

export function appointmentServiceName(
  appointment: ServiceSnapshotSource,
  fallback = "שירות"
) {
  return appointment.service_name ?? joinedService(appointment)?.name ?? fallback
}

export function appointmentServicePrice(appointment: ServiceSnapshotSource) {
  return numberOrFallback(
    appointment.service_price ?? joinedService(appointment)?.price,
    0
  )
}

export function appointmentServiceDuration(
  appointment: ServiceSnapshotSource,
  fallback = 30
) {
  const duration = numberOrFallback(
    appointment.service_duration_minutes ??
      joinedService(appointment)?.duration_minutes,
    fallback
  )
  return duration > 0 ? duration : fallback
}
