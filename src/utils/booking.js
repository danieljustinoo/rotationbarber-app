export function slotIsTaken(slots, barberId, appointmentDate, appointmentTime) {
  return slots.some(
    (slot) =>
      String(slot.barberId) === String(barberId) &&
      slot.appointmentDate === appointmentDate &&
      slot.appointmentTime === appointmentTime,
  )
}

export function createTimeSlots() {
  const slots = []

  for (let hour = 9; hour <= 18; hour += 1) {
    slots.push(`${String(hour).padStart(2, '0')}:00`)
    slots.push(`${String(hour).padStart(2, '0')}:30`)
  }

  return slots
}

export function isTimeBlockedForSelection(slots, barbers, barberId, appointmentDate, appointmentTime) {
  if (!appointmentTime) return false

  if (barberId === 'any') {
    return barbers.length === 0 || barbers.every((barber) =>
      slotIsTaken(slots, barber.id, appointmentDate, appointmentTime),
    )
  }

  return slotIsTaken(slots, barberId, appointmentDate, appointmentTime)
}

export function countFreeBarbersForSlot(slots, barbers, appointmentDate, appointmentTime) {
  return barbers.filter((barber) => !slotIsTaken(slots, barber.id, appointmentDate, appointmentTime)).length
}

export function dayHasBookableSlots(slots, barbers, barberId, appointmentDate, timesToCheck) {
  return timesToCheck.some((time) => !isTimeBlockedForSelection(slots, barbers, barberId, appointmentDate, time))
}

export function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addDays(date, amount) {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  nextDate.setDate(nextDate.getDate() + amount)

  return nextDate
}

export function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getCalendarCells(monthDate) {
  const firstDay = getMonthStart(monthDate)
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const cells = Array.from({ length: firstDay.getDay() }, () => null)

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day)
    cells.push({
      day,
      iso: toISODate(date),
    })
  }

  return cells
}

export function formatMonthTitle(date) {
  return new Intl.DateTimeFormat('pt-PT', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatReadableDate(date) {
  if (!date) return 'Sem data'

  return new Intl.DateTimeFormat('pt-PT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

export function formatShortDate(date) {
  if (!date) return 'Sem data'

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

export function getDateObject(date) {
  return new Date(`${date}T00:00:00`)
}

export function getDayNumber(date) {
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit' }).format(getDateObject(date))
}

export function getMonthShort(date) {
  return new Intl.DateTimeFormat('pt-PT', { month: 'short' })
    .format(getDateObject(date))
    .replace('.', '')
}

export function getWeekdayShort(date) {
  return new Intl.DateTimeFormat('pt-PT', { weekday: 'short' })
    .format(getDateObject(date))
    .replace('.', '')
}

export function getWeekdayLong(date) {
  return new Intl.DateTimeFormat('pt-PT', { weekday: 'long' }).format(getDateObject(date))
}
