import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  LogOut,
  MessageCircle,
  Phone,
  Scissors,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { ProfilePhotoCropper } from '../components/ProfilePhotoCropper.jsx'
import { AppointmentCard, ClientAvatar, SectionHeader } from '../components/common.jsx'
import { cropProfileImage, readFileAsDataUrl } from '../utils/profileImage.js'

export function ProfileScreen({
  currentUser,
  pastAppointments,
  profileSaving,
  selectedBarber,
  services,
  totalAppointments,
  upcomingAppointments,
  onCancel,
  onLogout,
  onPay,
  onSaveProfile,
}) {
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    imagePreview: '',
    name: currentUser.name,
    preferredCut: currentUser.preferredCut || '',
    profileImage: '',
  })
  const [photoCrop, setPhotoCrop] = useState(null)
  const [photoCropError, setPhotoCropError] = useState('')
  const [photoCropSaving, setPhotoCropSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const cutSuggestions = useMemo(
    () => services.filter((service) => service.categorySlug === 'cortes').slice(0, 5),
    [services],
  )
  const hasProfileChanges =
    profileForm.name.trim() !== currentUser.name ||
    profileForm.preferredCut.trim() !== (currentUser.preferredCut || '') ||
    Boolean(profileForm.profileImage)

  useEffect(() => {
    setProfileForm({
      imagePreview: '',
      name: currentUser.name,
      preferredCut: currentUser.preferredCut || '',
      profileImage: '',
    })
    setPhotoCrop(null)
    setPhotoCropError('')
  }, [currentUser.id, currentUser.image, currentUser.name, currentUser.preferredCut])

  const updateProfileForm = (field, value) => {
    setProfileError('')
    setProfileForm((form) => ({ ...form, [field]: value }))
  }

  const handleProfileImage = async (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setProfileError('Escolhe uma imagem válida.')
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      setProfileError('A foto deve ter até 3 MB.')
      return
    }

    try {
      const imageDataUrl = await readFileAsDataUrl(file)
      setPhotoCrop({
        naturalHeight: 0,
        naturalWidth: 0,
        offsetX: 0,
        offsetY: 0,
        source: imageDataUrl,
        zoom: 1,
      })
      setPhotoCropError('')
    } catch (error) {
      setProfileError(error.message)
    } finally {
      event.target.value = ''
    }
  }

  const updatePhotoCrop = (updates) => {
    setPhotoCropError('')
    setPhotoCrop((crop) => (crop ? { ...crop, ...updates } : crop))
  }

  const confirmPhotoCrop = async () => {
    if (!photoCrop) return

    try {
      setPhotoCropSaving(true)
      const croppedImage = await cropProfileImage(photoCrop.source, photoCrop)
      setProfileForm((form) => ({
        ...form,
        imagePreview: croppedImage,
        profileImage: croppedImage,
      }))
      setPhotoCrop(null)
      setPhotoCropError('')
    } catch (error) {
      setPhotoCropError(error.message)
    } finally {
      setPhotoCropSaving(false)
    }
  }

  const submitProfile = async (event) => {
    event.preventDefault()

    if (profileForm.name.trim().length < 2) {
      setProfileError('O nome deve ter pelo menos 2 letras.')
      return
    }

    const saved = await onSaveProfile({
      name: profileForm.name,
      preferredCut: profileForm.preferredCut,
      profileImage: profileForm.profileImage,
    })

    if (saved) {
      setEditingProfile(false)
    }
  }

  const cancelProfileEdit = () => {
    setEditingProfile(false)
    setProfileError('')
    setPhotoCrop(null)
    setPhotoCropError('')
    setProfileForm({
      imagePreview: '',
      name: currentUser.name,
      preferredCut: currentUser.preferredCut || '',
      profileImage: '',
    })
  }

  return (
    <section className="screen">
      {editingProfile ? (
        <form className="profile-edit-card" onSubmit={submitProfile}>
          {photoCrop && (
            <ProfilePhotoCropper
              crop={photoCrop}
              error={photoCropError}
              saving={photoCropSaving}
              onCancel={() => setPhotoCrop(null)}
              onChange={updatePhotoCrop}
              onConfirm={confirmPhotoCrop}
            />
          )}

          <div className="profile-edit-head">
            <ClientAvatar editable preview={profileForm.imagePreview} user={currentUser} onImageChange={handleProfileImage} />
            <div>
              <span className="eyebrow">Editar perfil</span>
              <h1>{profileForm.name || currentUser.name}</h1>
              <p>{currentUser.email}</p>
            </div>
          </div>

          <label className="profile-field">
            <span>Nome</span>
            <input
              autoComplete="name"
              value={profileForm.name}
              onChange={(event) => updateProfileForm('name', event.target.value)}
            />
          </label>

          <label className="profile-field">
            <span>Corte preferido</span>
            <input
              maxLength={120}
              placeholder="Ex: Low fade com risco"
              value={profileForm.preferredCut}
              onChange={(event) => updateProfileForm('preferredCut', event.target.value)}
            />
          </label>

          <div className="cut-suggestion-row" aria-label="Sugestões de corte">
            {cutSuggestions.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => updateProfileForm('preferredCut', service.name)}
              >
                {service.name}
              </button>
            ))}
          </div>

          {profileError && <p className="profile-error">{profileError}</p>}

          <div className="profile-edit-actions">
            <button className="secondary-button" disabled={profileSaving} type="button" onClick={cancelProfileEdit}>
              Cancelar
            </button>
            <button className="primary-button" disabled={!hasProfileChanges || profileSaving} type="submit">
              <CheckCircle2 size={18} />
              {profileSaving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      ) : (
        <section className="profile-hero-card">
          <ClientAvatar user={currentUser} />
          <div>
            <span className="eyebrow">Cliente</span>
            <h1>{currentUser.name}</h1>
            <p>{currentUser.email}</p>
            <small>{currentUser.preferredCut ? `Prefere ${currentUser.preferredCut}` : 'Sem corte preferido definido'}</small>
          </div>
          <button className="mini-icon-button profile-edit-trigger" type="button" aria-label="Editar perfil" onClick={() => setEditingProfile(true)}>
            <UserRound size={17} />
          </button>
        </section>
      )}

      <section className="loyalty-band">
        <ShieldCheck size={22} />
        <div>
          <strong>{upcomingAppointments.length} próximas · {pastAppointments.length} no histórico</strong>
          <span>{totalAppointments} reservas sincronizadas com a base de dados.</span>
        </div>
      </section>

      <section className="section-block">
        <SectionHeader mutedAction={`${upcomingAppointments.length} ativas`} title="Próximas reservas" />
        <div className="profile-list">
          {upcomingAppointments.length === 0 && (
            <article className="empty-card">
              <CalendarDays size={24} />
              <div>
                <strong>Nenhuma reserva futura</strong>
                <span>Quando marcares um serviço, a contagem aparece no Home.</span>
              </div>
            </article>
          )}

          {upcomingAppointments.map((appointment) => (
            <AppointmentCard appointment={appointment} key={appointment.id} onCancel={() => onCancel(appointment.id)} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <SectionHeader mutedAction={`${pastAppointments.length} registos`} title="Histórico" />
        <div className="profile-list history-list">
          {pastAppointments.length === 0 && (
            <article className="empty-card">
              <Clock3 size={24} />
              <div>
                <strong>Ainda sem histórico</strong>
                <span>Reservas concluídas, canceladas ou antigas ficam guardadas aqui.</span>
              </div>
            </article>
          )}

          {pastAppointments.map((appointment) => (
            <AppointmentCard appointment={appointment} history key={appointment.id} />
          ))}
        </div>
      </section>

      <section className="quick-actions">
        <a href="https://wa.me/" target="_blank" rel="noreferrer">
          <MessageCircle size={20} />
          WhatsApp
        </a>
        <a href="tel:+351000000000">
          <Phone size={20} />
          Ligar
        </a>
        <button type="button" onClick={onPay}>
          <CreditCard size={20} />
          Pagamentos
        </button>
        <button type="button" onClick={onLogout}>
          <LogOut size={20} />
          Sair
        </button>
      </section>

      <section className="section-block">
        <article className="empty-card">
          <Scissors size={24} />
          <div>
            <strong>Corte preferido</strong>
            <span>{currentUser.preferredCut || `Ainda sem preferência. Barbeiro sugerido: ${selectedBarber?.name || 'João Lopes'}`}</span>
          </div>
        </article>
      </section>
    </section>
  )
}
