const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const SESSION_KEY = 'rotationbarber.session'

export function getStoredSession() {
  const rawSession = window.localStorage.getItem(SESSION_KEY)

  if (!rawSession) return null

  try {
    return JSON.parse(rawSession)
  } catch {
    window.localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function storeSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_KEY)
}

export function getMediaUrl(source) {
  if (!source) return ''
  if (/^(https?:|data:|blob:)/.test(source)) return source
  if (source.startsWith('/uploads/')) return `${API_BASE}${source}`

  return source
}

function getAuthHeader() {
  const session = getStoredSession()
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {}
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers,
    },
    ...options,
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(body.error || 'Não foi possível falar com a base de dados.')
  }

  return body
}

export function getHealth() {
  return request('/api/health')
}

export async function login(payload) {
  const session = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  storeSession(session)
  return session
}

export async function register(payload) {
  const session = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  storeSession(session)
  return session
}

export function getCurrentUser() {
  return request('/api/auth/me')
}

export async function updateProfile(payload) {
  const user = await request('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  const session = getStoredSession()

  if (session) {
    storeSession({ ...session, user })
  }

  return user
}

export async function logout() {
  await request('/api/auth/logout', {
    method: 'POST',
  }).catch(() => {})
  clearStoredSession()
}

export function getServices() {
  return request('/api/services')
}

export function getBarbers() {
  return request('/api/barbers')
}

export function getAppointments() {
  return request('/api/appointments')
}

export function createAppointment(payload) {
  return request('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function cancelAppointment(id) {
  return request(`/api/appointments/${id}/cancel`, {
    method: 'PATCH',
  })
}

export function getFavorites() {
  return request('/api/favorites')
}

export function saveFavorite(serviceId) {
  return request('/api/favorites', {
    method: 'POST',
    body: JSON.stringify({ serviceId }),
  })
}

export function removeFavorite(serviceId) {
  return request(`/api/favorites/${serviceId}`, {
    method: 'DELETE',
  })
}

export function getManagementDashboard() {
  return request('/api/management')
}

export function updateAppointmentStatus(id, status) {
  return request(`/api/management/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function addSubscriber(email) {
  return request('/api/management/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function removeSubscriber(id) {
  return request(`/api/management/newsletter/${id}`, {
    method: 'DELETE',
  })
}
