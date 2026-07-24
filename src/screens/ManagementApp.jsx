import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  LogOut,
  Mail,
  Newspaper,
  RefreshCw,
  Scissors,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import {
  addSubscriber,
  getManagementDashboard,
  removeSubscriber,
  updateAppointmentStatus,
} from '../api.js'
import { SectionHeader } from '../components/common.jsx'
import { assets } from '../data/appData.js'
import {
  formatShortDate,
  getDayNumber,
  getMonthShort,
  getWeekdayLong,
  getWeekdayShort,
} from '../utils/booking.js'
import { getInitials } from '../utils/profileImage.js'

const managementTabs = {
  admin: [
    { id: 'appointments', label: 'Agenda', icon: ClipboardList },
    { id: 'calendar', label: 'Calendário', icon: CalendarDays },
    { id: 'users', label: 'Utilizadores', icon: Users },
    { id: 'newsletter', label: 'Newsletter', icon: Newspaper },
    { id: 'finance', label: 'Finanças', icon: BarChart3 },
  ],
  barbeiro: [
    { id: 'appointments', label: 'Agenda', icon: ClipboardList },
    { id: 'calendar', label: 'Calendário', icon: CalendarDays },
    { id: 'finance', label: 'Resumo', icon: BarChart3 },
  ],
}

const statusLabels = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
}

export function ManagementApp({ currentUser, onLogout, setToast }) {
  const tabs = managementTabs[currentUser.role] || managementTabs.barbeiro
  const [activeTab, setActiveTab] = useState(tabs[0].id)
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscriberEmail, setSubscriberEmail] = useState('')

  const refreshManagement = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      setDashboard(await getManagementDashboard())
    } catch (error) {
      setToast(error.message)
    } finally {
      setLoading(false)
    }
  }, [setToast])

  useEffect(() => {
    refreshManagement()
  }, [refreshManagement])

  const changeAppointmentStatus = async (appointmentId, status) => {
    try {
      setDashboard(await updateAppointmentStatus(appointmentId, status))
      setToast(status === 'confirmed' ? 'Agendamento confirmado.' : 'Agendamento atualizado.')
    } catch (error) {
      setToast(error.message)
    }
  }

  const addNewsletterEmail = async (event) => {
    event.preventDefault()

    try {
      setDashboard(await addSubscriber(subscriberEmail))
      setSubscriberEmail('')
      setToast('Assinante adicionado.')
    } catch (error) {
      setToast(error.message)
    }
  }

  const deleteNewsletterEmail = async (subscriberId) => {
    try {
      setDashboard(await removeSubscriber(subscriberId))
      setToast('Assinante removido.')
    } catch (error) {
      setToast(error.message)
    }
  }

  const stats = dashboard?.stats || {}
  const appointments = dashboard?.appointments || []

  return (
    <section className="screen management-screen">
      {loading && <div className="loading-bar" />}

      <header className="management-topbar">
        <div className="management-brand">
          <img src={assets.logo} alt="Rotation Barber" />
          <div>
            <span className="eyebrow">{currentUser.role === 'admin' ? 'Admin' : 'Barbeiro'}</span>
            <strong>{currentUser.name}</strong>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" type="button" aria-label="Atualizar painel" onClick={() => refreshManagement({ silent: true })}>
            <RefreshCw size={18} />
          </button>
          <button className="icon-button" type="button" aria-label="Sair" onClick={onLogout}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="management-title">
        <span className="eyebrow">Painel de controlo</span>
        <h1>{currentUser.role === 'admin' ? 'Gestão geral' : 'A tua gestão'}</h1>
        <p>
          {currentUser.role === 'admin'
            ? 'Agendamentos, utilizadores, newsletter e finanças.'
            : 'Agendamentos e calendário associados à tua conta.'}
        </p>
      </section>

      <ManagementSummary stats={stats} role={currentUser.role} />
      <ManagementTabNav activeTab={activeTab} tabs={tabs} onChange={setActiveTab} />

      {activeTab === 'appointments' && (
        <ManagementAppointments
          appointments={appointments}
          role={currentUser.role}
          onStatusChange={changeAppointmentStatus}
        />
      )}

      {activeTab === 'calendar' && (
        <ManagementCalendar appointments={appointments} days={dashboard?.calendar || []} />
      )}

      {activeTab === 'users' && currentUser.role === 'admin' && (
        <ManagementUsers users={dashboard?.users || []} />
      )}

      {activeTab === 'newsletter' && currentUser.role === 'admin' && (
        <ManagementNewsletter
          email={subscriberEmail}
          subscribers={dashboard?.subscribers || []}
          onAdd={addNewsletterEmail}
          onEmailChange={setSubscriberEmail}
          onRemove={deleteNewsletterEmail}
        />
      )}

      {activeTab === 'finance' && (
        <ManagementFinance appointments={appointments} stats={stats} role={currentUser.role} />
      )}
    </section>
  )
}

function ManagementSummary({ stats, role }) {
  const items = [
    { label: 'Agendamentos', value: stats.total || 0, icon: ClipboardList },
    { label: 'Pendentes', value: stats.pending || 0, icon: Clock3 },
    { label: role === 'admin' ? 'Receita' : 'Confirmados', value: role === 'admin' ? formatMoney(stats.revenue) : stats.confirmed || 0, icon: role === 'admin' ? CreditCard : CheckCircle2 },
    { label: 'Hoje', value: stats.today || 0, icon: CalendarCheck },
  ]

  return (
    <section className="management-summary">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <article className="summary-card" key={item.label}>
            <Icon size={18} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        )
      })}
    </section>
  )
}

function ManagementTabNav({ activeTab, tabs, onChange }) {
  return (
    <nav className="management-tabs" aria-label="Gestão">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            className={activeTab === tab.id ? 'active' : ''}
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function ManagementAppointments({ appointments, role, onStatusChange }) {
  return (
    <section className="management-section">
      <SectionHeader title={role === 'admin' ? 'Lista de agendamentos' : 'Os teus agendamentos'} mutedAction={`${appointments.length} total`} />
      <div className="management-list">
        {appointments.length === 0 && (
          <article className="empty-card">
            <CalendarDays size={24} />
            <div>
              <strong>Sem agendamentos</strong>
              <span>Quando existirem marcações, aparecem aqui.</span>
            </div>
          </article>
        )}

        {appointments.map((appointment) => (
          <article className="management-appointment" key={appointment.id}>
            <div className="management-row-head">
              <div>
                <strong>{appointment.service.name}</strong>
                <span>{appointment.customer.email || appointment.customer.name}</span>
              </div>
              <StatusPill status={appointment.status} />
            </div>
            <div className="management-meta-grid">
              <span><CalendarDays size={14} />{formatShortDate(appointment.appointmentDate)}</span>
              <span><Clock3 size={14} />{appointment.appointmentTime}</span>
              <span><Scissors size={14} />{appointment.barber.email || appointment.barber.name}</span>
              <span><CreditCard size={14} />{appointment.paymentLabel}</span>
            </div>
            <div className="management-actions">
              {appointment.status === 'pending' && (
                <button type="button" className="success-action" onClick={() => onStatusChange(appointment.id, 'confirmed')}>
                  <Check size={15} />
                  Confirmar
                </button>
              )}
              {appointment.status === 'confirmed' && (
                <button type="button" className="success-action" onClick={() => onStatusChange(appointment.id, 'completed')}>
                  <CheckCircle2 size={15} />
                  Concluir
                </button>
              )}
              {['pending', 'confirmed'].includes(appointment.status) && (
                <button type="button" className="danger-action" onClick={() => onStatusChange(appointment.id, 'cancelled')}>
                  <X size={15} />
                  Cancelar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ManagementCalendar({ appointments, days }) {
  const sortedDays = useMemo(() => [...days].sort((a, b) => a.date.localeCompare(b.date)), [days])
  const defaultDate = sortedDays[0]?.date || ''
  const [selectedDate, setSelectedDate] = useState(defaultDate)

  useEffect(() => {
    if (sortedDays.length === 0) {
      if (selectedDate) setSelectedDate('')
      return
    }

    if (!selectedDate || !sortedDays.some((day) => day.date === selectedDate)) {
      setSelectedDate(sortedDays[0].date)
    }
  }, [selectedDate, sortedDays])

  const selectedDay = sortedDays.find((day) => day.date === selectedDate) || sortedDays[0]
  const selectedAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.appointmentDate === selectedDay?.date)
        .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime)),
    [appointments, selectedDay?.date],
  )
  const dayStats = selectedAppointments.reduce(
    (stats, appointment) => ({
      ...stats,
      total: stats.total + 1,
      [appointment.status]: (stats[appointment.status] || 0) + 1,
    }),
    { total: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0 },
  )

  return (
    <section className="management-section">
      <SectionHeader title="Calendário" mutedAction={`${sortedDays.length} dias`} />

      {sortedDays.length === 0 ? (
        <div className="calendar-stack">
          <article className="empty-card">
            <CalendarDays size={24} />
            <div>
              <strong>Calendário vazio</strong>
              <span>Não há agendamentos para apresentar.</span>
            </div>
          </article>
        </div>
      ) : (
        <>
          <div className="calendar-date-strip" aria-label="Dias com agendamentos">
            {sortedDays.map((day) => (
              <button
                className={day.date === selectedDay.date ? 'active' : ''}
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(day.date)}
              >
                <span>{getWeekdayShort(day.date)}</span>
                <strong>{getDayNumber(day.date)}</strong>
                <small>{day.total}</small>
              </button>
            ))}
          </div>

          <article className="calendar-focus-card">
            <div className="calendar-focus-date">
              <span>{getMonthShort(selectedDay.date)}</span>
              <strong>{getDayNumber(selectedDay.date)}</strong>
              <small>{getWeekdayLong(selectedDay.date)}</small>
            </div>
            <div className="calendar-focus-copy">
              <span className="eyebrow">Dia selecionado</span>
              <h2>{dayStats.total} {dayStats.total === 1 ? 'marcação' : 'marcações'}</h2>
              <div className="calendar-focus-stats">
                <span>{dayStats.confirmed} confirmadas</span>
                <span>{dayStats.pending} pendentes</span>
                <span>{dayStats.cancelled} canceladas</span>
              </div>
            </div>
          </article>

          <div className="calendar-timeline" aria-label="Marcações do dia">
            {selectedAppointments.length === 0 && (
              <article className="empty-card">
                <Clock3 size={24} />
                <div>
                  <strong>Dia livre</strong>
                  <span>Não há marcações neste dia.</span>
                </div>
              </article>
            )}

            {selectedAppointments.map((appointment) => (
              <article className="timeline-item" key={appointment.id}>
                <time>{appointment.appointmentTime}</time>
                <div className="timeline-dot" />
                <div className="timeline-card">
                  <div className="timeline-card-head">
                    <div>
                      <strong>{appointment.service.name}</strong>
                      <span>{appointment.customer.email || appointment.customer.name}</span>
                    </div>
                    <StatusPill status={appointment.status} />
                  </div>
                  <div className="timeline-card-meta">
                    <span><Scissors size={13} />{appointment.barber.name}</span>
                    <span><CreditCard size={13} />{appointment.paymentLabel}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function ManagementUsers({ users }) {
  return (
    <section className="management-section">
      <SectionHeader title="Utilizadores" mutedAction={`${users.length} contas`} />
      <div className="management-list">
        {users.map((user) => (
          <article className="user-row" key={user.id}>
            <div className="user-row-avatar">{getInitials(user.name || user.email)}</div>
            <div>
              <strong>{user.email}</strong>
              <span>{user.phone || 'N/A'}</span>
            </div>
            <RolePill role={user.role} />
          </article>
        ))}
      </div>
    </section>
  )
}

function ManagementNewsletter({ email, subscribers, onAdd, onEmailChange, onRemove }) {
  return (
    <section className="management-section">
      <SectionHeader title="Newsletter" mutedAction={`${subscribers.length} assinantes`} />
      <form className="newsletter-form" onSubmit={onAdd}>
        <div className="auth-input">
          <Mail size={18} />
          <input
            inputMode="email"
            placeholder="novo@email.com"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </div>
        <button className="primary-button" type="submit">Adicionar</button>
      </form>
      <div className="management-list">
        {subscribers.map((subscriber) => (
          <article className="subscriber-row" key={subscriber.id}>
            <div>
              <strong>{subscriber.email}</strong>
              <span>{subscriber.subscribedAt}</span>
            </div>
            <button type="button" className="danger-action compact" onClick={() => onRemove(subscriber.id)}>
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

function ManagementFinance({ appointments, stats, role }) {
  const statusItems = [
    { label: 'Confirmados', value: stats.confirmed || 0, status: 'confirmed' },
    { label: 'Pendentes', value: stats.pending || 0, status: 'pending' },
    { label: 'Cancelados', value: stats.cancelled || 0, status: 'cancelled' },
    { label: 'Concluídos', value: stats.completed || 0, status: 'completed' },
  ]

  return (
    <section className="management-section">
      <SectionHeader title={role === 'admin' ? 'Finanças' : 'Resumo'} mutedAction={`${appointments.length} movimentos`} />
      <div className="finance-grid">
        <article>
          <span>Receita total</span>
          <strong>{formatMoney(stats.revenue)}</strong>
        </article>
        <article>
          <span>Pagamentos pendentes</span>
          <strong>{formatMoney(stats.pendingPayments)}</strong>
        </article>
        <article>
          <span>No local</span>
          <strong>{formatMoney(stats.localPayments)}</strong>
        </article>
        <article>
          <span>Online</span>
          <strong>{formatMoney(stats.onlinePayments)}</strong>
        </article>
      </div>
      <div className="status-breakdown">
        {statusItems.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <StatusPill status={item.status} label={String(item.value)} />
          </div>
        ))}
      </div>
    </section>
  )
}

function StatusPill({ status, label = statusLabels[status] || status }) {
  return <span className={`status-pill ${status}`}>{label}</span>
}

function RolePill({ role }) {
  const label = role === 'barbeiro' ? 'Barbeiro' : role === 'admin' ? 'Admin' : 'Cliente'
  return <span className={`role-pill ${role}`}>{label}</span>
}

function formatMoney(value) {
  return `${Number(value || 0).toFixed(2).replace('.', ',')}€`
}
