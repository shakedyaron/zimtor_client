import { Check, Plus, Trash2 } from "lucide-react"
import {
  TIME_OPTIONS,
  WEEK_DAYS,
  type WeeklyAvailability,
  type WeekdayAvailability,
} from "@/lib/availability"
import { Label } from "@/components/ui/label"

type WeeklyAvailabilityEditorProps = {
  value: WeeklyAvailability
  onChange: (value: WeeklyAvailability) => void
}

export default function WeeklyAvailabilityEditor({
  value,
  onChange,
}: WeeklyAvailabilityEditorProps) {
  function updateDay(day: number, patch: Partial<WeekdayAvailability>) {
    const key = String(day)
    onChange({
      ...value,
      [key]: {
        ...value[key],
        ...patch,
      },
    })
  }

  return (
    <div className="space-y-3">
      {WEEK_DAYS.map((day) => {
        const config = value[String(day.value)]
        const breaks = config.breaks ?? []

        return (
          <div
            key={day.value}
            className={`rounded-2xl border p-3 transition-colors sm:p-4 ${
              config.enabled
                ? "border-indigo-300/14 bg-white/[0.04]"
                : "border-white/8 bg-white/[0.025]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-heading text-sm font-bold text-slate-100">
                  {day.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {config.enabled ? "פעיל" : "לא פעיל"}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateDay(day.value, { enabled: !config.enabled })
                }
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                  config.enabled
                    ? "border-indigo-300/30 bg-indigo-500/12 text-indigo-200"
                    : "border-white/8 bg-white/4 text-slate-400 hover:border-indigo-300/20 hover:text-slate-200"
                }`}
              >
                {config.enabled && <Check className="h-3.5 w-3.5" />}
                פעיל
              </button>
            </div>

            {config.enabled && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <TimeField
                    label="שעת פתיחה"
                    value={config.open}
                    onChange={(open) => updateDay(day.value, { open })}
                  />
                  <TimeField
                    label="שעת סגירה"
                    value={config.close}
                    onChange={(close) => updateDay(day.value, { close })}
                  />
                </div>

                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label className="text-xs text-slate-400">הפסקות</Label>
                      <p className="mt-1 text-xs text-slate-500">
                        {breaks.length > 0
                          ? `${breaks.length} הפסקות ביום זה`
                          : "ללא הפסקה"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateDay(day.value, {
                          breaks: [
                            ...breaks,
                            {
                              start: "13:00",
                              end: "14:00",
                            },
                          ],
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/16"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      הוסף הפסקה
                    </button>
                  </div>

                  {breaks.length === 0 ? (
                    <p className="mt-3 rounded-lg border border-white/6 bg-white/[0.025] px-3 py-2 text-xs text-slate-500">
                      ללא הפסקה
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {breaks.map((currentBreak, breakIndex) => (
                        <div
                          key={`${day.value}-${breakIndex}`}
                          className="rounded-xl border border-white/8 bg-white/[0.035] p-3"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-xs font-bold text-slate-300">
                              {currentBreak.start} - {currentBreak.end}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                updateDay(day.value, {
                                  breaks: breaks.filter(
                                    (_, index) => index !== breakIndex
                                  ),
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/15 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/16"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              מחק
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <TimeField
                              label="תחילת הפסקה"
                              value={currentBreak.start}
                              onChange={(start) =>
                                updateDay(day.value, {
                                  breaks: breaks.map((item, index) =>
                                    index === breakIndex
                                      ? { ...item, start }
                                      : item
                                  ),
                                })
                              }
                            />
                            <TimeField
                              label="סוף הפסקה"
                              value={currentBreak.end}
                              onChange={(end) =>
                                updateDay(day.value, {
                                  breaks: breaks.map((item, index) =>
                                    index === breakIndex
                                      ? { ...item, end }
                                      : item
                                  ),
                                })
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-400">{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base text-slate-100 shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-sm"
        dir="ltr"
      >
        {TIME_OPTIONS.map((time) => (
          <option key={time} value={time} className="bg-slate-950">
            {time}
          </option>
        ))}
      </select>
    </div>
  )
}
