import { CalendarCheck, Mail, Phone, Scissors, Star, X } from 'lucide-react'

export function BarberProfileSheet({ barber, onBooking, onClose }) {
  const firstName = barber.name.split(' ')[0]

  return (
    <div className="barber-profile-backdrop" role="presentation" onClick={onClose}>
      <aside className="barber-profile-sheet" aria-label={`Perfil de ${barber.name}`} onClick={(event) => event.stopPropagation()}>
        <header>
          <button className="icon-button" type="button" aria-label="Fechar" onClick={onClose}>
            <X size={19} />
          </button>
          <span className="rating-pill">
            <Star size={14} fill="currentColor" />
            {barber.rating}
          </span>
        </header>

        <img className="barber-profile-photo" src={barber.image} alt="" />

        <section className="barber-profile-copy">
          <span className="eyebrow">Barbeiro Rotation</span>
          <h2>{barber.name}</h2>
          <p>{barber.role}</p>
        </section>

        <div className="barber-profile-details">
          {barber.email && (
            <span>
              <Mail size={16} />
              {barber.email}
            </span>
          )}
          {barber.phone && (
            <span>
              <Phone size={16} />
              {barber.phone}
            </span>
          )}
          <span>
            <Scissors size={16} />
            Especialista em serviços Rotation
          </span>
        </div>

        <button className="primary-button" type="button" onClick={onBooking}>
          <CalendarCheck size={18} />
          Marcar com {firstName}
        </button>
      </aside>
    </div>
  )
}
