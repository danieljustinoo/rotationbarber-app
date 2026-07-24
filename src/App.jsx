import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  cancelAppointment,
  clearStoredSession,
  createAppointment,
  getAppointments,
  getBarbers,
  getCurrentUser,
  getFavorites,
  getHealth,
  getServices,
  getStoredSession,
  login,
  logout,
  register as registerAccount,
  removeFavorite,
  saveFavorite,
  updateProfile,
} from './api'
import './App.css'
import { BarberProfileSheet } from './components/BarberProfileSheet.jsx'
import { BottomNav, Toast } from './components/common.jsx'
import { ProfileMenu } from './components/ProfileMenu.jsx'
import { fallbackBarbers, fallbackServices, staffRoles } from './data/appData.js'
import { AuthScreen } from './screens/AuthScreen.jsx'
import { BookingScreen } from './screens/BookingScreen.jsx'
import { HomeScreen } from './screens/HomeScreen.jsx'
import { ManagementApp } from './screens/ManagementApp.jsx'
import { NotificationsScreen } from './screens/NotificationsScreen.jsx'
import { ProfileScreen } from './screens/ProfileScreen.jsx'
import { ServicesScreen } from './screens/ServicesScreen.jsx'
import { categorizeAppointments } from './utils/appointments.js'

function App() {
  const [storedSession] = useState(() => getStoredSession())
  const [screen, setScreen] = useState('home')
  const [category, setCategory] = useState('Todos')
  const [query, setQuery] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [authLoading, setAuthLoading] = useState(false)
  const [services, setServices] = useState(fallbackServices)
  const [barbers, setBarbers] = useState(fallbackBarbers)
  const [appointments, setAppointments] = useState([])
  const [bookedSlots, setBookedSlots] = useState([])
  const [favorites, setFavorites] = useState([])
  const [selectedServiceId, setSelectedServiceId] = useState(fallbackServices[0].id)
  const [selectedBarberId, setSelectedBarberId] = useState(fallbackBarbers[0].id)
  const [bookingSaved, setBookingSaved] = useState(false)
  const [bookingEmailStatus, setBookingEmailStatus] = useState(null)
  const [bookingInitialBarberId, setBookingInitialBarberId] = useState('any')
  const [apiOnline, setApiOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedBarberProfile, setSelectedBarberProfile] = useState(null)
  const [now, setNow] = useState(() => new Date())

  const selectedService = services.find((service) => service.id === selectedServiceId) || services[0]
  const selectedBarber = barbers.find((barber) => barber.id === selectedBarberId) || barbers[0]

  const { upcoming: upcomingAppointments, past: pastAppointments } = useMemo(
    () => categorizeAppointments(appointments, now),
    [appointments, now],
  )

  const nextAppointment = upcomingAppointments[0] || null

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return services.filter((service) => {
      const matchesCategory = category === 'Todos' || service.category === category
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${service.name} ${service.category} ${service.description}`.toLowerCase().includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [category, query, services])

  const refreshData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)

      const [health, serviceData, barberData] = await Promise.all([getHealth(), getServices(), getBarbers()])

      setApiOnline(Boolean(health.ok))
      setServices(serviceData)
      setBarbers(barberData)

      if (currentUser?.role === 'cliente') {
        const [appointmentData, favoriteData] = await Promise.all([getAppointments(), getFavorites()])
        setAppointments(appointmentData.appointments)
        setBookedSlots(appointmentData.bookedSlots)
        setFavorites(favoriteData)
      } else {
        setAppointments([])
        setBookedSlots([])
        setFavorites([])
      }

      if (!serviceData.some((service) => service.id === selectedServiceId)) {
        setSelectedServiceId(serviceData[0]?.id || fallbackServices[0].id)
      }

      if (!barberData.some((barber) => barber.id === selectedBarberId)) {
        setSelectedBarberId(barberData[0]?.id || fallbackBarbers[0].id)
      }
    } catch (error) {
      setApiOnline(false)
      setToast(error.message)
    } finally {
      setLoading(false)
    }
  }, [currentUser, selectedBarberId, selectedServiceId])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  useEffect(() => {
    if (!storedSession?.token) return

    getCurrentUser()
      .then((user) => setCurrentUser(user))
      .catch(() => {
        clearStoredSession()
        setCurrentUser(null)
      })
  }, [storedSession?.token])

  useEffect(() => {
    if (!toast) return

    const timeout = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const openBooking = (service = selectedService, initialBarberId = 'any') => {
    setSelectedServiceId(service.id)
    setBookingInitialBarberId(initialBarberId || 'any')
    setBookingSaved(false)
    setBookingEmailStatus(null)
    setScreen('booking')
  }

  const updateAuthField = (field, value) => {
    setAuthForm((form) => ({ ...form, [field]: value }))
  }

  const submitAuth = async (event) => {
    event.preventDefault()

    try {
      setAuthLoading(true)
      const session = authMode === 'login' ? await login(authForm) : await registerAccount(authForm)
      setCurrentUser(session.user)
      setAuthForm({ name: '', email: '', phone: '', password: '' })
      setToast(authMode === 'login' ? 'Sessão iniciada.' : 'Conta criada com sucesso.')
      await refreshData({ silent: true })
    } catch (error) {
      setToast(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const endSession = async () => {
    await logout()
    setCurrentUser(null)
    setAppointments([])
    setBookedSlots([])
    setFavorites([])
    setScreen('home')
    setToast('Sessão terminada.')
  }

  const toggleFavorite = async (serviceId) => {
    try {
      const nextFavorites = favorites.includes(serviceId)
        ? await removeFavorite(serviceId)
        : await saveFavorite(serviceId)

      setFavorites(nextFavorites)
      setToast(nextFavorites.includes(serviceId) ? 'Serviço guardado nos favoritos.' : 'Serviço removido dos favoritos.')
    } catch (error) {
      setToast(error.message)
    }
  }

  const confirmBooking = async (bookingDetails) => {
    try {
      setSaving(true)
      const createdAppointment = await createAppointment({
        ...bookingDetails,
        payment: 'local',
      })

      setBookingEmailStatus(createdAppointment.confirmationEmail || null)
      setBookingSaved(true)
      setToast('')
      await refreshData({ silent: true })
    } catch (error) {
      setBookingEmailStatus(null)
      setToast(error.message)
      await refreshData({ silent: true })
    } finally {
      setSaving(false)
    }
  }

  const saveProfile = async (profile) => {
    try {
      setProfileSaving(true)
      const updatedUser = await updateProfile(profile)
      setCurrentUser(updatedUser)
      setToast('Perfil atualizado.')
      return true
    } catch (error) {
      setToast(error.message)
      return false
    } finally {
      setProfileSaving(false)
    }
  }

  const cancelBooking = async (appointmentId) => {
    try {
      await cancelAppointment(appointmentId)
      setToast('Marcação cancelada.')
      await refreshData({ silent: true })
    } catch (error) {
      setToast(error.message)
    }
  }

  const shareService = async () => {
    const shareText = `${selectedService.name} na Rotation Barber por ${selectedService.price}`

    if (navigator.share) {
      await navigator.share({ title: 'Rotation Barber', text: shareText }).catch(() => {})
      return
    }

    await navigator.clipboard?.writeText(shareText)
    setToast('Detalhes copiados.')
  }

  if (!currentUser) {
    return (
      <main className="app-shell">
        <div className="app-surface auth-surface">
          <AuthScreen
            apiOnline={apiOnline}
            authForm={authForm}
            authLoading={authLoading}
            authMode={authMode}
            setAuthMode={setAuthMode}
            submitAuth={submitAuth}
            updateAuthField={updateAuthField}
          />
          {toast && <Toast message={toast} />}
        </div>
      </main>
    )
  }

  if (staffRoles.includes(currentUser.role)) {
    return (
      <main className="app-shell">
        <div className="app-surface management-surface">
          <ManagementApp currentUser={currentUser} onLogout={endSession} setToast={setToast} />
          {toast && <Toast message={toast} />}
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <div className="app-surface">
        {loading && <div className="loading-bar" />}

        {screen === 'home' && (
          <HomeScreen
            apiOnline={apiOnline}
            barbers={barbers}
            category={category}
            currentUser={currentUser}
            favorites={favorites}
            filteredServices={filteredServices}
            nextAppointment={nextAppointment}
            now={now}
            query={query}
            onBooking={openBooking}
            onCategoryChange={setCategory}
            onFavorite={toggleFavorite}
            onMenu={() => setMenuOpen(true)}
            onNotify={() => setScreen('notifications')}
            onOpenProfile={() => setScreen('profile')}
            onOpenServices={() => setScreen('services')}
            onSelectBarber={setSelectedBarberProfile}
            onQueryChange={setQuery}
          />
        )}

        {screen === 'booking' && selectedService && selectedBarber && (
          <BookingScreen
            barbers={barbers}
            bookedSlots={bookedSlots}
            bookingEmailStatus={bookingEmailStatus}
            bookingSaved={bookingSaved}
            currentUser={currentUser}
            saving={saving}
            services={services}
            initialService={selectedService}
            initialBarberId={bookingInitialBarberId}
            onBack={() => setScreen('home')}
            onConfirm={confirmBooking}
            onShare={shareService}
          />
        )}

        {screen === 'services' && (
          <ServicesScreen
            category={category}
            favorites={favorites}
            filteredServices={filteredServices}
            query={query}
            onBooking={openBooking}
            onCategoryChange={setCategory}
            onFavorite={toggleFavorite}
            onQueryChange={setQuery}
          />
        )}

        {screen === 'profile' && (
          <ProfileScreen
            pastAppointments={pastAppointments}
            totalAppointments={appointments.length}
            upcomingAppointments={upcomingAppointments}
            currentUser={currentUser}
            profileSaving={profileSaving}
            services={services}
            selectedBarber={selectedBarber}
            onCancel={cancelBooking}
            onLogout={endSession}
            onPay={() => setToast('Pagamentos entram na próxima integração.')}
            onSaveProfile={saveProfile}
          />
        )}

        {screen === 'notifications' && (
          <NotificationsScreen
            apiOnline={apiOnline}
            pastAppointments={pastAppointments}
            upcomingAppointments={upcomingAppointments}
            onBack={() => setScreen('home')}
            onOpenProfile={() => setScreen('profile')}
          />
        )}

        {menuOpen && (
          <ProfileMenu
            apiOnline={apiOnline}
            currentUser={currentUser}
            nextAppointment={nextAppointment}
            pastCount={pastAppointments.length}
            upcomingCount={upcomingAppointments.length}
            onBooking={() => {
              setMenuOpen(false)
              openBooking()
            }}
            onClose={() => setMenuOpen(false)}
            onLogout={() => {
              setMenuOpen(false)
              endSession()
            }}
            onNavigate={(nextScreen) => {
              setMenuOpen(false)
              setScreen(nextScreen)
            }}
            onNotify={() => {
              setMenuOpen(false)
              setScreen('notifications')
            }}
            onRefresh={() => {
              setMenuOpen(false)
              refreshData({ silent: true })
            }}
          />
        )}

        {selectedBarberProfile && (
          <BarberProfileSheet
            barber={selectedBarberProfile}
            onBooking={() => {
              const barberId = selectedBarberProfile.id
              setSelectedBarberProfile(null)
              openBooking(selectedService, barberId)
            }}
            onClose={() => setSelectedBarberProfile(null)}
          />
        )}

        {screen !== 'booking' && <BottomNav screen={screen} setScreen={setScreen} />}
        {toast && <Toast message={toast} />}
      </div>
    </main>
  )
}

export default App
