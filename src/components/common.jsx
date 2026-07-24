import {
  Bell,
  Bookmark,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Droplets,
  Home,
  LayoutGrid,
  Menu,
  Scissors,
  Search,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { getMediaUrl } from '../api.js'
import { categories } from '../data/appData.js'
import { appointmentStatusLabel } from '../utils/appointments.js'
import { getInitials } from '../utils/profileImage.js'

export function ClientAvatar({ editable = false, preview = '', user, onImageChange }) {
  const imageSrc = preview || getMediaUrl(user?.image)

  return (
    <div className={editable ? 'profile-photo editable' : 'profile-photo'}>
      {imageSrc ? <img src={imageSrc} alt="" /> : getInitials(user?.name || 'Cliente')}
      {editable && (
        <label className="profile-photo-action" aria-label="Escolher fotografia">
          <Camera size={16} />
          <input accept="image/png,image/jpeg,image/webp" type="file" onChange={onImageChange} />
        </label>
      )}
    </div>
  )
}

export function TopBar({ apiOnline, currentUser, onMenu, onNotify, onProfile }) {
  const initials = getInitials(currentUser?.name || 'Rotation Barber')
  const imageSrc = getMediaUrl(currentUser?.image)

  return (
    <header className="topbar">
      <button className="avatar-button" type="button" aria-label="Abrir perfil" onClick={onProfile}>
        <span>{imageSrc ? <img src={imageSrc} alt="" /> : initials}</span>
      </button>
      <div className={apiOnline ? 'database-pill online' : 'database-pill'}>
        {apiOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span>{apiOnline ? 'BD ligada' : 'Offline'}</span>
      </div>
      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Notificações" onClick={onNotify}>
          <Bell size={19} />
        </button>
        <button className="icon-button menu-button" type="button" aria-label="Menu" onClick={onMenu}>
          <Menu size={19} />
        </button>
      </div>
    </header>
  )
}

export function SearchBox({ query, onQueryChange }) {
  return (
    <div className="search-row">
      <Search size={19} />
      <input
        aria-label="Pesquisar serviços"
        placeholder="Procura corte, barba, lavagem..."
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <button className="mini-icon-button" type="button" aria-label="Filtros">
        <Sparkles size={17} />
      </button>
    </div>
  )
}

export function AppointmentCard({ appointment, compact = false, history = false, onCancel }) {
  const canCancel = Boolean(onCancel) && ['pending', 'confirmed'].includes(appointment.status)

  return (
    <article className={['appointment-card', compact ? 'compact' : '', history ? 'history' : ''].join(' ')}>
      <div className="barber-avatar">
        <Scissors size={24} />
      </div>
      <div className="appointment-copy">
        <strong>{appointment.service.name}</strong>
        <span>{appointment.barber.name}</span>
        <small className={`appointment-badge ${appointment.status}`}>{appointmentStatusLabel(appointment.status)}</small>
      </div>
      <div className="appointment-meta">
        <span>
          <CalendarDays size={15} />
          {appointment.appointmentDay}
        </span>
        <span>
          <Clock3 size={15} />
          {appointment.appointmentTime}
        </span>
      </div>
      {!compact && canCancel && (
        <button className="cancel-button" type="button" onClick={onCancel}>
          <Trash2 size={16} />
          Cancelar
        </button>
      )}
    </article>
  )
}

export function SectionHeader({ action, mutedAction, title, onAction }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action && (
        <button type="button" onClick={onAction}>
          {action}
        </button>
      )}
      {mutedAction && <span>{mutedAction}</span>}
    </div>
  )
}

export function CategoryTabs({ category, onCategoryChange }) {
  return (
    <div className="category-tabs" role="tablist" aria-label="Categorias">
      {categories.map((item) => (
        <button
          aria-selected={item === category}
          className={item === category ? 'active' : ''}
          key={item}
          role="tab"
          type="button"
          onClick={() => onCategoryChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export function ServiceCard({ isFavorite, service, onClick, onFavorite }) {
  return (
    <article className="service-card">
      <button className="service-main" type="button" onClick={onClick}>
        <img src={service.image} alt="" />
        <span className="service-icon">
          {service.category === 'Spa' ? <Droplets size={18} /> : <Scissors size={18} />}
        </span>
        <div>
          <h3>{service.name}</h3>
          <p>{service.duration} · {service.category}</p>
          <span className="service-rating">
            <Star size={14} fill="currentColor" />
            {service.rating}
          </span>
        </div>
        <strong>{service.price}</strong>
      </button>
      <button
        className={isFavorite ? 'bookmark-button active' : 'bookmark-button'}
        type="button"
        aria-label={`Guardar ${service.name}`}
        onClick={onFavorite}
      >
        <Bookmark size={17} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </article>
  )
}

export function BottomNav({ screen, setScreen }) {
  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'booking', label: 'Reservas', icon: CalendarDays },
    { id: 'services', label: 'Serviços', icon: LayoutGrid },
    { id: 'profile', label: 'Perfil', icon: UserRound },
  ]
  const activeIndex = Math.max(0, items.findIndex((item) => item.id === screen))

  return (
    <nav className="bottom-nav" aria-label="Navegação principal" style={{ '--active-index': activeIndex }}>
      {items.map((item) => {
        const Icon = item.icon
        const isActive = screen === item.id

        return (
          <button
            className={isActive ? 'active' : ''}
            aria-current={isActive ? 'page' : undefined}
            key={item.id}
            type="button"
            onClick={() => setScreen(item.id)}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function Toast({ message }) {
  return (
    <div className="toast">
      <CheckCircle2 size={18} />
      <span>{message}</span>
    </div>
  )
}
