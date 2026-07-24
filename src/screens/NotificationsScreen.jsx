import {
  ArrowLeft,
  Bell,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  Clock3,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { SectionHeader } from '../components/common.jsx'
import { assets } from '../data/appData.js'
import { appointmentStatusLabel } from '../utils/appointments.js'
import { formatReadableDate } from '../utils/booking.js'

export function NotificationsScreen({ apiOnline, pastAppointments, upcomingAppointments, onBack, onOpenProfile }) {
  const recentHistory = pastAppointments.slice(0, 2)

  return (
    <section className="screen notifications-screen">
      <header className="detail-topbar">
        <button className="icon-button" type="button" aria-label="Voltar" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <img className="detail-logo" src={assets.logo} alt="Rotation Barber" />
        <span className={apiOnline ? 'notification-status online' : 'notification-status'}>
          {apiOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
        </span>
      </header>

      <section className="page-title">
        <span className="eyebrow">Centro de avisos</span>
        <h1>Notificações</h1>
      </section>

      <section className="notification-hero">
        <Bell size={24} />
        <div>
          <strong>{upcomingAppointments.length} reservas futuras</strong>
          <span>As marcações ficam sincronizadas com o site e a app.</span>
        </div>
      </section>

      <section className="section-block">
        <SectionHeader action="Abrir perfil" title="Próximas" onAction={onOpenProfile} />
        <div className="notification-list">
          {upcomingAppointments.length === 0 && (
            <article className="empty-card">
              <CalendarDays size={24} />
              <div>
                <strong>Sem avisos novos</strong>
                <span>Quando marcares um serviço, ele aparece aqui.</span>
              </div>
            </article>
          )}

          {upcomingAppointments.map((appointment) => (
            <NotificationCard appointment={appointment} key={appointment.id} title="Reserva ativa" />
          ))}
        </div>
      </section>

      {recentHistory.length > 0 && (
        <section className="section-block">
          <SectionHeader mutedAction={`${recentHistory.length} recentes`} title="Histórico" />
          <div className="notification-list">
            {recentHistory.map((appointment) => (
              <NotificationCard
                appointment={appointment}
                history
                key={appointment.id}
                title={appointmentStatusLabel(appointment.status)}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  )
}

function NotificationCard({ appointment, history = false, title }) {
  return (
    <article className={history ? 'notification-card history' : 'notification-card'}>
      <span>{history ? <Clock3 size={19} /> : <CalendarCheck size={19} />}</span>
      <div>
        <strong>{title}</strong>
        <p>{appointment.service.name} com {appointment.barber.name}</p>
        <small>{formatReadableDate(appointment.appointmentDate)} · {appointment.appointmentTime}</small>
      </div>
      {!history && <ChevronRight size={18} />}
    </article>
  )
}
