import { CalendarCheck, ChevronRight, Scissors } from 'lucide-react'
import {
  AppointmentCard,
  CategoryTabs,
  SearchBox,
  SectionHeader,
  ServiceCard,
  TopBar,
} from '../components/common.jsx'
import { assets } from '../data/appData.js'
import { getAppointmentCountdown } from '../utils/appointments.js'

export function HomeScreen({
  apiOnline,
  barbers,
  category,
  currentUser,
  favorites,
  filteredServices,
  nextAppointment,
  now,
  query,
  onBooking,
  onCategoryChange,
  onFavorite,
  onMenu,
  onNotify,
  onOpenProfile,
  onOpenServices,
  onSelectBarber,
  onQueryChange,
}) {
  return (
    <section className="screen">
      <TopBar
        apiOnline={apiOnline}
        currentUser={currentUser}
        onMenu={onMenu}
        onNotify={onNotify}
        onProfile={onOpenProfile}
      />

      <section className="welcome">
        <span className="eyebrow">Bom dia, {currentUser.name.split(' ')[0]}</span>
        <h1>Como vai ficar o teu corte hoje?</h1>
      </section>

      <SearchBox query={query} onQueryChange={onQueryChange} />

      <section className="hero-panel">
        <img src={assets.tools} alt="" />
        <div className="hero-copy">
          <span>Rotation Barber</span>
          <h2>Entras selvagem, sais cavalheiro.</h2>
          <button className="primary-button" type="button" onClick={() => onBooking()}>
            <CalendarCheck size={18} />
            Marcar agora
          </button>
        </div>
      </section>

      <section className="section-block">
        <SectionHeader action="Ver reservas" title="Próxima marcação" onAction={onOpenProfile} />
        {nextAppointment ? (
          <NextAppointmentPanel appointment={nextAppointment} now={now} />
        ) : (
          <article className="empty-card">
            <Scissors size={24} />
            <div>
              <strong>Sem marcações ativas</strong>
              <span>Escolhe um serviço e guarda uma marcação na base de dados.</span>
            </div>
          </article>
        )}
      </section>

      <section className="section-block">
        <SectionHeader action="Todos" title="Serviços populares" onAction={onOpenServices} />
        <CategoryTabs category={category} onCategoryChange={onCategoryChange} />
        <div className="service-list">
          {filteredServices.slice(0, 3).map((service) => (
            <ServiceCard
              isFavorite={favorites.includes(service.id)}
              key={service.id}
              service={service}
              onClick={() => onBooking(service)}
              onFavorite={() => onFavorite(service.id)}
            />
          ))}
        </div>
      </section>

      <section className="section-block team-block">
        <SectionHeader action="Equipa" title="Barbeiros" onAction={onOpenServices} />
        <div className="team-strip">
          {barbers.map((barber) => (
            <button className="team-pill" key={barber.id} type="button" onClick={() => onSelectBarber(barber)}>
              <img src={barber.image} alt="" />
              <div>
                <strong>{barber.name}</strong>
                <small>{barber.role}</small>
              </div>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      </section>
    </section>
  )
}

function NextAppointmentPanel({ appointment, now }) {
  const countdown = getAppointmentCountdown(appointment, now)

  return (
    <article className="next-appointment-panel">
      <div className="countdown-strip" aria-label="Contagem decrescente para a próxima marcação">
        <div>
          <span>Contagem</span>
          <strong>{countdown.label}</strong>
        </div>
        <div className="countdown-boxes">
          <span><strong>{countdown.days}</strong><small>dias</small></span>
          <span><strong>{countdown.hours}</strong><small>horas</small></span>
          <span><strong>{countdown.minutes}</strong><small>min</small></span>
        </div>
      </div>
      <AppointmentCard appointment={appointment} compact />
    </article>
  )
}
