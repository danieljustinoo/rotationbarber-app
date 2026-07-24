import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Droplets,
  Mail,
  Phone,
  Scissors,
  Share2,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { assets, bookingCategories, bookingTimes } from '../data/appData.js'
import {
  addDays,
  addMonths,
  countFreeBarbersForSlot,
  dayHasBookableSlots,
  formatMonthTitle,
  formatReadableDate,
  getCalendarCells,
  getMonthStart,
  isTimeBlockedForSelection,
  toISODate,
} from '../utils/booking.js'

export function BookingScreen({
  barbers,
  bookedSlots,
  bookingEmailStatus,
  bookingSaved,
  currentUser,
  saving,
  services,
  initialService,
  initialBarberId,
  onBack,
  onConfirm,
  onShare,
}) {
  const initialCategory = initialService?.categorySlug || services[0]?.categorySlug || bookingCategories[0].id
  const initialBookingDate = addDays(new Date(), 1)
  const [step, setStep] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedServiceId, setSelectedServiceId] = useState(initialService?.id || services[0]?.id || '')
  const [selectedBarberId, setSelectedBarberId] = useState(initialBarberId || 'any')
  const [selectedDateIso, setSelectedDateIso] = useState(() => toISODate(initialBookingDate))
  const [selectedTime, setSelectedTime] = useState('')
  const [monthCursor, setMonthCursor] = useState(() => getMonthStart(initialBookingDate))
  const [clientForm, setClientForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
  })
  const minimumBookingDate = useMemo(() => addDays(new Date(), 1), [])
  const minimumBookingIso = useMemo(() => toISODate(minimumBookingDate), [minimumBookingDate])
  const minimumMonth = useMemo(() => getMonthStart(minimumBookingDate), [minimumBookingDate])

  useEffect(() => {
    if (!initialService?.id) return

    setSelectedServiceId(initialService.id)
    setSelectedCategory(initialService.categorySlug || bookingCategories[0].id)
    setSelectedTime('')
  }, [initialService?.id, initialService?.categorySlug])

  useEffect(() => {
    setSelectedBarberId(initialBarberId || 'any')
    setSelectedTime('')
  }, [initialBarberId])

  useEffect(() => {
    if (selectedDateIso >= minimumBookingIso) return

    setSelectedDateIso(minimumBookingIso)
    setMonthCursor(minimumMonth)
    setSelectedTime('')
  }, [minimumBookingIso, minimumMonth, selectedDateIso])

  const selectedService = services.find((service) => service.id === selectedServiceId)
  const selectedBarber = barbers.find((barber) => barber.id === selectedBarberId)
  const filteredBookingServices = services.filter((service) => service.categorySlug === selectedCategory)
  const calendarCells = useMemo(() => getCalendarCells(monthCursor), [monthCursor])
  const selectedDateTooSoon = selectedDateIso < minimumBookingIso
  const selectedSlotTaken = isTimeBlockedForSelection(
    bookedSlots,
    barbers,
    selectedBarberId,
    selectedDateIso,
    selectedTime,
  )
  const freeBarbersAtSelectedTime = selectedTime
    ? countFreeBarbersForSlot(bookedSlots, barbers, selectedDateIso, selectedTime)
    : 0
  const selectedBarberLabel = selectedBarberId === 'any'
    ? 'Qualquer disponível'
    : selectedBarber?.name || 'Barbeiro Rotation'
  const selectedCategoryLabel = bookingCategories.find((item) => item.id === selectedCategory)?.label || 'Serviços'
  const clientInfoComplete =
    clientForm.name.trim().length > 1 &&
    clientForm.phone.trim().length > 4 &&
    clientForm.email.trim().includes('@')

  useEffect(() => {
    if (bookingSaved || !selectedTime) return

    if (isTimeBlockedForSelection(bookedSlots, barbers, selectedBarberId, selectedDateIso, selectedTime)) {
      setSelectedTime('')
    }
  }, [barbers, bookedSlots, bookingSaved, selectedBarberId, selectedDateIso, selectedTime])

  const steps = [
    { label: 'Pedido', icon: Sparkles },
    { label: 'Serviço', icon: Scissors },
    { label: 'Barbeiro', icon: UserRound },
    { label: 'Horário', icon: CalendarDays },
    { label: 'Cliente', icon: UserRound },
    { label: 'Pagamento', icon: CreditCard },
    { label: 'Resumo', icon: CheckCircle2 },
  ]

  const canContinue =
    (step === 0 && Boolean(selectedCategory)) ||
    (step === 1 && Boolean(selectedService)) ||
    (step === 2 && Boolean(selectedBarberId)) ||
    (step === 3 && Boolean(selectedDateIso && selectedTime) && !selectedDateTooSoon && !selectedSlotTaken) ||
    (step === 4 && clientInfoComplete) ||
    step === 5 ||
    (step === 6 && Boolean(selectedService && selectedDateIso && selectedTime) && !selectedDateTooSoon && !selectedSlotTaken)

  const updateClientForm = (field, value) => {
    setClientForm((form) => ({ ...form, [field]: value }))
  }

  const selectCategory = (categoryId) => {
    setSelectedCategory(categoryId)
    const categoryHasSelectedService = services.some(
      (service) => service.categorySlug === categoryId && service.id === selectedServiceId,
    )

    if (!categoryHasSelectedService) {
      setSelectedServiceId('')
    }

    setSelectedTime('')
  }

  const goBack = () => {
    if (bookingSaved || step === 0) {
      onBack()
      return
    }

    setStep((value) => Math.max(0, value - 1))
  }

  const goNext = () => {
    if (!canContinue || saving || bookingSaved) return

    if (step < steps.length - 1) {
      setStep((value) => value + 1)
      return
    }

    onConfirm({
      serviceId: selectedService.id,
      barberId: selectedBarberId,
      appointmentDate: selectedDateIso,
      appointmentTime: selectedTime,
      customerName: clientForm.name,
      customerPhone: clientForm.phone,
      customerEmail: clientForm.email,
      payment: 'local',
    })
  }

  const primaryLabel = step === steps.length - 1
    ? bookingSaved
      ? 'Marcação guardada'
      : saving
        ? 'A guardar...'
        : 'Confirmar e guardar'
    : 'Continuar'

  if (bookingSaved) {
    return (
      <section className="screen booking-complete-screen">
        <div className="complete-orbit" />
        <div className="complete-check-wrap">
          <div className="complete-check">
            <CheckCircle2 size={56} />
          </div>
        </div>
        <span className="eyebrow">Reserva confirmada</span>
        <h1>Agendamento concluído</h1>
        <p>Ficou tudo guardado. A tua marcação já aparece sincronizada na app e no painel.</p>
        {bookingEmailStatus && (
          <div className={bookingEmailStatus.sent ? 'complete-email-note' : 'complete-email-note warning'}>
            <Mail size={16} />
            <span>
              {bookingEmailStatus.sent
                ? `Confirmação enviada para ${bookingEmailStatus.to}.`
                : 'Marcação guardada. Não foi possível enviar o email automaticamente.'}
            </span>
          </div>
        )}

        <article className="complete-summary">
          <div>
            <span>Serviço</span>
            <strong>{selectedService?.name}</strong>
          </div>
          <div>
            <span>Data</span>
            <strong>{formatReadableDate(selectedDateIso)}</strong>
          </div>
          <div>
            <span>Horário</span>
            <strong>{selectedTime}</strong>
          </div>
          <div>
            <span>Pagamento</span>
            <strong>Pagar no local</strong>
          </div>
        </article>

        <button className="primary-button complete-button" type="button" onClick={onBack}>
          Voltar ao início
        </button>
      </section>
    )
  }

  return (
    <section className="screen booking-screen">
      <header className="detail-topbar booking-topbar">
        <button className="icon-button" type="button" aria-label="Voltar" onClick={goBack}>
          <ArrowLeft size={20} />
        </button>
        <img className="detail-logo" src={assets.logo} alt="Rotation Barber" />
        <button className="icon-button" type="button" aria-label="Partilhar" onClick={onShare}>
          <Share2 size={19} />
        </button>
      </header>

      <section className="booking-head">
        <span className="eyebrow">Reserva</span>
        <h1>Marca o teu atendimento.</h1>
      </section>

      <nav className="booking-progress" aria-label="Passos da marcação">
        {steps.map((item, index) => {
          const Icon = item.icon
          const stateClass = index === step ? 'active' : index < step ? 'done' : ''

          return (
            <button
              aria-current={index === step ? 'step' : undefined}
              className={stateClass}
              disabled={index > step}
              key={item.label}
              type="button"
              onClick={() => setStep(index)}
            >
              <span><Icon size={14} /></span>
              <small>{item.label}</small>
            </button>
          )
        })}
      </nav>

      <section className="booking-step-panel" key={step}>
        {step === 0 && (
          <>
            <div className="booking-step-title">
              <h2>O que queres fazer?</h2>
              <p>Começa pelo tipo de atendimento. No passo seguinte aparecem só os serviços dessa escolha.</p>
            </div>

            <div className="booking-category-grid" aria-label="Categorias de serviços">
              {bookingCategories.map((item) => (
                <button
                  className={item.id === selectedCategory ? 'active' : ''}
                  key={item.id}
                  type="button"
                  onClick={() => selectCategory(item.id)}
                >
                  <span className="category-orb">
                    {item.id === 'barba' ? <Scissors size={20} /> : item.id === 'lavagem-facial' ? <Droplets size={20} /> : <Sparkles size={20} />}
                  </span>
                  <strong>{item.label}</strong>
                  <span>{item.note}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="booking-step-title">
              <h2>Escolhe o serviço</h2>
              <p>{selectedCategoryLabel}: agora escolhe exatamente o atendimento que queres marcar.</p>
            </div>

            <div className="booking-service-grid">
              {filteredBookingServices.map((service) => (
                <button
                  className={service.id === selectedService?.id ? 'booking-service-card active' : 'booking-service-card'}
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setSelectedServiceId(service.id)
                    setSelectedTime('')
                  }}
                >
                  <img src={service.image} alt="" />
                  <div>
                    <span>{selectedCategoryLabel}</span>
                    <strong>{service.name}</strong>
                    <small>{service.duration} · {service.price}</small>
                  </div>
                  {service.id === selectedService?.id && <CheckCircle2 size={18} />}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="booking-step-title">
              <h2>Escolhe o barbeiro</h2>
              <p>Podes escolher um barbeiro específico ou deixar a app escolher alguém livre nesse horário.</p>
            </div>

            <h3 className="booking-subtitle">Funcionário</h3>
            <div className="booking-barber-grid">
              <button
                className={selectedBarberId === 'any' ? 'booking-barber-card active' : 'booking-barber-card'}
                type="button"
                onClick={() => {
                  setSelectedBarberId('any')
                  setSelectedTime('')
                }}
              >
                <span className="barber-photo any"><Sparkles size={20} /></span>
                <div>
                  <strong>Qualquer disponível</strong>
                  <small>A app escolhe alguém livre.</small>
                </div>
                <BadgeCheck size={17} />
              </button>

              {barbers.map((barber) => (
                <button
                  className={barber.id === selectedBarberId ? 'booking-barber-card active' : 'booking-barber-card'}
                  key={barber.id}
                  type="button"
                  onClick={() => {
                    setSelectedBarberId(barber.id)
                    setSelectedTime('')
                  }}
                >
                  <img className="barber-photo" src={barber.image} alt="" />
                  <div>
                    <strong>{barber.name}</strong>
                    <small>{barber.role}</small>
                  </div>
                  <BadgeCheck size={17} />
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="booking-step-title">
              <h2>Data e horário</h2>
              <p>O próprio dia fica indisponível. As marcações abrem a partir de {formatReadableDate(minimumBookingIso)}.</p>
            </div>

            <article className="booking-selection-card">
              <img src={selectedService?.image || assets.tools} alt="" />
              <div>
                <strong>{selectedService?.name}</strong>
                <span>{selectedBarberLabel} · {selectedService?.price}</span>
              </div>
            </article>

            <section className="booking-calendar-card">
              <div className="booking-month-head">
                <button
                  className="mini-icon-button"
                  disabled={monthCursor <= minimumMonth}
                  type="button"
                  aria-label="Mês anterior"
                  onClick={() => setMonthCursor((date) => addMonths(date, -1))}
                >
                  <ChevronLeft size={18} />
                </button>
                <h3>{formatMonthTitle(monthCursor)}</h3>
                <button
                  className="mini-icon-button"
                  type="button"
                  aria-label="Próximo mês"
                  onClick={() => setMonthCursor((date) => addMonths(date, 1))}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="booking-weekdays">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="booking-month-grid">
                {calendarCells.map((cell, index) => {
                  if (!cell) return <span className="booking-day empty" key={`empty-${index}`} />

                  const isTooSoon = cell.iso < minimumBookingIso
                  const hasAvailability = dayHasBookableSlots(
                    bookedSlots,
                    barbers,
                    selectedBarberId,
                    cell.iso,
                    bookingTimes,
                  )
                  const unavailable = isTooSoon || !hasAvailability

                  return (
                    <button
                      className={[
                        'booking-day',
                        selectedDateIso === cell.iso ? 'active' : '',
                        unavailable ? 'unavailable' : '',
                      ].join(' ')}
                      disabled={unavailable}
                      key={cell.iso}
                      type="button"
                      onClick={() => setSelectedDateIso(cell.iso)}
                    >
                      <strong>{cell.day}</strong>
                      <span>{isTooSoon ? 'indisponível' : unavailable ? 'cheio' : 'livre'}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="booking-time-board">
              <div className="booking-time-head">
                <h3>{formatReadableDate(selectedDateIso)}</h3>
                <span>{bookingTimes.length} horários</span>
              </div>

              {[
                { label: 'Manhã', times: bookingTimes.filter((time) => time < '12:00') },
                { label: 'Tarde', times: bookingTimes.filter((time) => time >= '12:00' && time < '17:00') },
                { label: 'Fim do dia', times: bookingTimes.filter((time) => time >= '17:00') },
              ].map((group) => (
                <div className="booking-time-group" key={group.label}>
                  <span>{group.label}</span>
                  <div className="booking-time-grid">
                    {group.times.map((time) => {
                      const blocked =
                        selectedDateTooSoon ||
                        isTimeBlockedForSelection(bookedSlots, barbers, selectedBarberId, selectedDateIso, time)
                      const freeCount = countFreeBarbersForSlot(bookedSlots, barbers, selectedDateIso, time)

                      return (
                        <button
                          className={[
                            'booking-time-chip',
                            selectedTime === time ? 'active' : '',
                            blocked ? 'blocked' : '',
                          ].join(' ')}
                          disabled={blocked}
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                        >
                          <strong>{time}</strong>
                          <span>{selectedDateTooSoon ? 'Indisponível' : blocked ? 'Ocupado' : selectedBarberId === 'any' ? `${freeCount} livres` : 'Livre'}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {step === 4 && (
          <>
            <div className="booking-step-title">
              <h2>Informações do cliente</h2>
              <p>Confirma os dados que ficam associados à marcação.</p>
            </div>

            <div className="client-form-grid">
              <label>
                <span>Nome</span>
                <div className="auth-input">
                  <UserRound size={18} />
                  <input
                    autoComplete="name"
                    value={clientForm.name}
                    onChange={(event) => updateClientForm('name', event.target.value)}
                  />
                </div>
              </label>
              <label>
                <span>Telemóvel</span>
                <div className="auth-input">
                  <Phone size={18} />
                  <input
                    autoComplete="tel"
                    inputMode="tel"
                    value={clientForm.phone}
                    onChange={(event) => updateClientForm('phone', event.target.value)}
                  />
                </div>
              </label>
              <label>
                <span>Email</span>
                <div className="auth-input">
                  <Mail size={18} />
                  <input
                    autoComplete="email"
                    inputMode="email"
                    value={clientForm.email}
                    onChange={(event) => updateClientForm('email', event.target.value)}
                  />
                </div>
              </label>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div className="booking-step-title">
              <h2>Pagamento</h2>
              <p>Por agora a app fica só com pagamento no local.</p>
            </div>

            <article className="payment-local-card">
              <div>
                <CreditCard size={22} />
              </div>
              <section>
                <strong>Pagar no local</strong>
                <span>O pagamento é feito diretamente na barbearia.</span>
              </section>
              <CheckCircle2 size={22} />
            </article>
          </>
        )}

        {step === 6 && (
          <>
            <div className="booking-step-title">
              <h2>Resumo</h2>
              <p>Confirma tudo antes de guardar na base de dados.</p>
            </div>

            <article className={bookingSaved ? 'booking-summary-card saved' : 'booking-summary-card'}>
              <img src={selectedService?.image || assets.tools} alt="" />
              <div className="summary-line">
                <span>Serviço</span>
                <strong>{selectedService?.name}</strong>
              </div>
              <div className="summary-line">
                <span>Categoria</span>
                <strong>{selectedCategoryLabel}</strong>
              </div>
              <div className="summary-line">
                <span>Barbeiro</span>
                <strong>{selectedBarberLabel}</strong>
              </div>
              <div className="summary-line">
                <span>Data</span>
                <strong>{formatReadableDate(selectedDateIso)}</strong>
              </div>
              <div className="summary-line">
                <span>Horário</span>
                <strong>{selectedTime}</strong>
              </div>
              <div className="summary-line">
                <span>Cliente</span>
                <strong>{clientForm.name}</strong>
              </div>
              <div className="summary-line">
                <span>Pagamento</span>
                <strong>Pagar no local</strong>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <strong>{selectedService?.price}</strong>
              </div>
              {bookingSaved && (
                <div className="booking-saved-banner">
                  <CheckCircle2 size={18} />
                  <span>Marcação guardada com sucesso.</span>
                </div>
              )}
              {selectedBarberId === 'any' && selectedTime && !bookingSaved && (
                <p className="summary-note">{freeBarbersAtSelectedTime} barbeiros livres neste horário.</p>
              )}
            </article>
          </>
        )}
      </section>

      <section className="booking-actionbar">
        <button className="secondary-button" type="button" onClick={goBack}>
          {bookingSaved || step === 0 ? 'Fechar' : 'Voltar'}
        </button>
        <button className="primary-button" disabled={!canContinue || saving || bookingSaved} type="button" onClick={goNext}>
          {step === steps.length - 1 ? <CalendarCheck size={18} /> : <ChevronRight size={18} />}
          {primaryLabel}
        </button>
      </section>
    </section>
  )
}
