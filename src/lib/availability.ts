import type { Business } from "@/types"

export type WeekdayAvailability = {
  enabled: boolean
  open: string
  close: string
  breaks: AvailabilityBreak[]
}

export type AvailabilityBreak = {
  start: string
  end: string
}

export type WeeklyAvailability = Record<string, WeekdayAvailability>

export const DEFAULT_OPENING_TIME = "09:00"
export const DEFAULT_CLOSING_TIME = "18:00"
export const DEFAULT_WORKING_DAYS = [0, 1, 2, 3, 4]

export const WEEK_DAYS = [
  { value: 0, label: "ראשון" },
  { value: 1, label: "שני" },
  { value: 2, label: "שלישי" },
  { value: 3, label: "רביעי" },
  { value: 4, label: "חמישי" },
  { value: 5, label: "שישי" },
  { value: 6, label: "שבת" },
]

export const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const totalMinutes = index * 15
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
})

export function timeToMinutes(time: string | null | undefined) {
  if (!time) return null
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

export function normalizeTime(
  time: string | null | undefined,
  fallback: string
) {
  return time?.slice(0, 5) || fallback
}

export function getBusinessWorkingDays(business: Business | null) {
  const workingDays = business?.working_days
  if (Array.isArray(workingDays)) return workingDays
  if (typeof workingDays === "string") {
    try {
      const parsed = JSON.parse(workingDays)
      if (Array.isArray(parsed)) {
        return parsed.filter((day) => typeof day === "number")
      }
    } catch {
      return DEFAULT_WORKING_DAYS
    }
  }
  return DEFAULT_WORKING_DAYS
}

export function createDefaultWeeklyAvailability(): WeeklyAvailability {
  return WEEK_DAYS.reduce<WeeklyAvailability>((availability, day) => {
    availability[String(day.value)] = {
      enabled: DEFAULT_WORKING_DAYS.includes(day.value),
      open: DEFAULT_OPENING_TIME,
      close: DEFAULT_CLOSING_TIME,
      breaks: [],
    }
    return availability
  }, {})
}

function normalizeDayAvailability(
  value:
    | (Partial<WeekdayAvailability> & {
        break_enabled?: boolean
        break_start?: string | null
        break_end?: string | null
      })
    | null
    | undefined,
  fallback: WeekdayAvailability
): WeekdayAvailability {
  const breaks = Array.isArray(value?.breaks)
    ? value.breaks
        .map((item) => ({
          start: normalizeTime(item?.start, ""),
          end: normalizeTime(item?.end, ""),
        }))
        .filter((item) => item.start && item.end)
    : value?.break_enabled && value.break_start && value.break_end
      ? [
          {
            start: normalizeTime(value.break_start, ""),
            end: normalizeTime(value.break_end, ""),
          },
        ]
      : fallback.breaks

  return {
    enabled:
      typeof value?.enabled === "boolean" ? value.enabled : fallback.enabled,
    open: normalizeTime(value?.open, fallback.open),
    close: normalizeTime(value?.close, fallback.close),
    breaks,
  }
}

function parseWeeklyAvailability(raw: Business["weekly_availability"]) {
  if (!raw) return null
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Partial<WeeklyAvailability>
    } catch {
      return null
    }
  }
  if (typeof raw === "object") return raw as Partial<WeeklyAvailability>
  return null
}

export function buildWeeklyAvailabilityFromBusiness(
  business: Business | null
): WeeklyAvailability {
  const legacyWorkingDays = getBusinessWorkingDays(business)
  const legacyOpen = normalizeTime(business?.opening_time, DEFAULT_OPENING_TIME)
  const legacyClose = normalizeTime(
    business?.closing_time,
    DEFAULT_CLOSING_TIME
  )
  const fallback = WEEK_DAYS.reduce<WeeklyAvailability>((availability, day) => {
    availability[String(day.value)] = {
      enabled: legacyWorkingDays.includes(day.value),
      open: legacyOpen,
      close: legacyClose,
      breaks: [],
    }
    return availability
  }, {})

  const parsed = parseWeeklyAvailability(business?.weekly_availability)
  if (!parsed) return fallback

  return WEEK_DAYS.reduce<WeeklyAvailability>((availability, day) => {
    const key = String(day.value)
    availability[key] = normalizeDayAvailability(parsed[key], fallback[key])
    return availability
  }, {})
}

export function getAvailabilityForDate(business: Business | null, date: Date) {
  const availability = buildWeeklyAvailabilityFromBusiness(business)
  return availability[String(date.getDay())]
}

export function validateWeeklyAvailability(availability: WeeklyAvailability) {
  for (const day of WEEK_DAYS) {
    const config = availability[String(day.value)]
    if (!config.enabled) continue

    if (!config.open) return `${day.label}: שעת פתיחה חובה`
    if (!config.close) return `${day.label}: שעת סגירה חובה`

    const open = timeToMinutes(config.open)
    const close = timeToMinutes(config.close)
    if (open === null || close === null || close <= open) {
      return `${day.label}: שעת הסגירה חייבת להיות אחרי שעת הפתיחה`
    }

    const normalizedBreaks = config.breaks ?? []
    const sortedBreaks = normalizedBreaks
      .map((item, index) => ({ ...item, index }))
      .sort(
        (a, b) => (timeToMinutes(a.start) ?? 0) - (timeToMinutes(b.start) ?? 0)
      )

    for (const currentBreak of sortedBreaks) {
      if (!currentBreak.start) return `${day.label}: תחילת הפסקה חובה`
      if (!currentBreak.end) return `${day.label}: סוף הפסקה חובה`

      const breakStart = timeToMinutes(currentBreak.start)
      const breakEnd = timeToMinutes(currentBreak.end)
      if (breakStart === null || breakEnd === null || breakEnd <= breakStart) {
        return `${day.label}: סוף ההפסקה חייב להיות אחרי תחילת ההפסקה`
      }
      if (breakStart < open || breakEnd > close) {
        return `${day.label}: ההפסקה חייבת להיות בתוך שעות הפעילות`
      }
    }

    for (let index = 1; index < sortedBreaks.length; index += 1) {
      const previousBreakEnd = timeToMinutes(sortedBreaks[index - 1].end)
      const currentBreakStart = timeToMinutes(sortedBreaks[index].start)
      if (
        previousBreakEnd !== null &&
        currentBreakStart !== null &&
        currentBreakStart < previousBreakEnd
      ) {
        return `${day.label}: הפסקות לא יכולות לחפוף`
      }
    }
  }

  const hasActiveDay = WEEK_DAYS.some(
    (day) => availability[String(day.value)]?.enabled
  )
  if (!hasActiveDay) return "יש לבחור לפחות יום עבודה אחד."

  return null
}

export function getLegacyAvailabilityFields(availability: WeeklyAvailability) {
  const enabledDays = WEEK_DAYS.filter(
    (day) => availability[String(day.value)]?.enabled
  )
  const firstEnabled = enabledDays[0]
  const firstConfig = firstEnabled
    ? availability[String(firstEnabled.value)]
    : null

  return {
    opening_time: firstConfig?.open ?? DEFAULT_OPENING_TIME,
    closing_time: firstConfig?.close ?? DEFAULT_CLOSING_TIME,
    working_days: enabledDays.map((day) => day.value),
  }
}

export function slotOverlapsBreak(
  slotStartMinutes: number,
  durationMinutes: number,
  dayAvailability: WeekdayAvailability
) {
  const slotEndMinutes = slotStartMinutes + durationMinutes
  return (dayAvailability.breaks ?? []).some((currentBreak) => {
    const breakStart = timeToMinutes(currentBreak.start)
    const breakEnd = timeToMinutes(currentBreak.end)
    if (breakStart === null || breakEnd === null) return false
    return slotStartMinutes < breakEnd && slotEndMinutes > breakStart
  })
}
