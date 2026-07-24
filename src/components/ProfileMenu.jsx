import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Scissors,
  UserRound,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { ClientAvatar } from './common.jsx'

export function ProfileMenu({
  apiOnline,
  currentUser,
  nextAppointment,
  pastCount,
  upcomingCount,
  onBooking,
  onClose,
  onLogout,
  onNavigate,
  onNotify,
  onRefresh,
}) {
  return (
    <div className="menu-backdrop" role="presentation" onClick={onClose}>
      <aside className="profile-menu-drawer" aria-label="Menu do cliente" onClick={(event) => event.stopPropagation()}>
        <header className="profile-menu-top">
          <span>Menu</span>
          <button className="icon-button" type="button" aria-label="Fechar menu" onClick={onClose}>
            <X size={19} />
          </button>
        </header>

        <section className="profile-menu-card">
          <ClientAvatar user={currentUser} />
          <div>
            <strong>{currentUser.name}</strong>
            <span>{currentUser.email}</span>
            <small>{currentUser.preferredCut || 'Sem corte preferido'}</small>
          </div>
        </section>

        <MenuGroup title="Conta">
          <MenuItem icon={UserRound} label="Gerir perfil" onClick={() => onNavigate('profile')} />
          <MenuItem icon={CalendarDays} label="Reservas" meta={`${upcomingCount} próximas`} onClick={() => onNavigate('profile')} />
          <MenuItem icon={Bell} label="Notificações" onClick={onNotify} />
          <MenuItem icon={apiOnline ? Wifi : WifiOff} label="Base de dados" meta={apiOnline ? 'Ligada' : 'Offline'} onClick={onRefresh} />
        </MenuGroup>

        <MenuGroup title="Preferências">
          <MenuItem icon={Scissors} label="Marcar atendimento" meta={nextAppointment ? 'Já tens próxima' : 'Novo'} onClick={onBooking} />
          <MenuItem icon={LayoutGrid} label="Serviços" onClick={() => onNavigate('services')} />
          <MenuItem icon={Clock3} label="Histórico" meta={`${pastCount} registos`} onClick={() => onNavigate('profile')} />
        </MenuGroup>

        <MenuGroup title="Suporte">
          <a className="menu-row" href="https://wa.me/" target="_blank" rel="noreferrer">
            <MessageCircle size={18} />
            <span>WhatsApp</span>
            <ChevronRight size={17} />
          </a>
          <button className="menu-row danger" type="button" onClick={onLogout}>
            <LogOut size={18} />
            <span>Sair</span>
            <ChevronRight size={17} />
          </button>
        </MenuGroup>
      </aside>
    </div>
  )
}

function MenuGroup({ children, title }) {
  return (
    <section className="menu-group">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  )
}

function MenuItem({ icon: Icon, label, meta, onClick }) {
  return (
    <button className="menu-row" type="button" onClick={onClick}>
      <Icon size={18} />
      <span>{label}</span>
      {meta && <small>{meta}</small>}
      <ChevronRight size={17} />
    </button>
  )
}
