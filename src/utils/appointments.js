export function getAppointmentTime(appointment) {
  if (!appointment?.appointmentDate) return 0

  const time = appointment.appointmentTime || '00:00'
  return new Date(`${appointment.appointmentDate}T${time}:00`).getTime()
}

export function categorizeAppointments(appointments, now = new Date()) {
  const nowTime = now.getTime()
  const activeStatuses = new Set(['pending', 'confirmed'])
  const upcoming = []
  const past = []

  for (const appointment of appointments) {
    const appointmentTime = getAppointmentTime(appointment)
    const isUpcoming = activeStatuses.has(appointment.status) && appointmentTime >= nowTime

    if (isUpcoming) {
      upcoming.push(appointment)
    } else {
      past.push(appointment)
    }
  }

  upcoming.sort((a, b) => getAppointmentTime(a) - getAppointmentTime(b))
  past.sort((a, b) => getAppointmentTime(b) - getAppointmentTime(a))

  return { upcoming, past }
}

export function getAppointmentCountdown(appointment, now = new Date()) {
  const diff = Math.max(0, getAppointmentTime(appointment) - now.getTime())
  const totalMinutes = Math.floor(diff / 60_000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  if (diff === 0) {
    return { days: 0, hours: 0, minutes: 0, label: 'Está na hora' }
  }

  if (days > 0) {
    return { days, hours, minutes, label: `Faltam ${days} dia${days === 1 ? '' : 's'}` }
  }

  if (hours > 0) {
    return { days, hours, minutes, label: `Faltam ${hours}h ${minutes}m` }
  }

  return { days, hours, minutes, label: `Faltam ${minutes} min` }
}

export function appointmentStatusLabel(status) {
  const labels = {
    pending: 'Pendente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Concluída',
  }

  return labels[status] || 'Guardada'
}
