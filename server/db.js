import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import bcrypt from 'bcryptjs'
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3308),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rotation_barber',
  waitForConnections: true,
  connectionLimit: 10,
})

const serviceDetails = {
  'corte-simples': {
    name: 'Corte Simples',
    category: 'Cortes',
    categorySlug: 'cortes',
    image: '/assets/services/corte-simples.png',
    description: 'Corte rápido, alinhado e finalizado ao estilo Rotation.',
  },
  'corte-criativo': {
    name: 'Corte Criativo',
    category: 'Cortes',
    categorySlug: 'cortes',
    image: '/assets/services/corte-criativo.png',
    description: 'Fade, degradê ou desenho limpo com acabamento premium.',
  },
  'buzz-cut': {
    name: 'Buzz Cut',
    category: 'Cortes',
    categorySlug: 'cortes',
    image: '/assets/services/buzz-cut.png',
    description: 'Corte curto, prático e bem definido.',
  },
  'corte-navalha': {
    name: 'Corte à Navalha',
    category: 'Cortes',
    categorySlug: 'cortes',
    image: '/assets/services/corte-navalha.png',
    description: 'Acabamento limpo com navalha para um visual mais marcado.',
  },
  'corte-freestyle': {
    name: 'Corte Freestyle',
    category: 'Cortes',
    categorySlug: 'cortes',
    image: '/assets/services/corte-freestyle.png',
    description: 'Desenhos e detalhes personalizados com acabamento premium.',
  },
  sobrancelha: {
    name: 'Sobrancelha',
    category: 'Cortes',
    categorySlug: 'cortes',
    image: '/assets/services/sobrancelha.png',
    description: 'Alinhamento simples para completar o corte.',
  },
  'massagem-relaxante': {
    name: 'Massagem Relaxante',
    category: 'Tratamento Corporal',
    categorySlug: 'tratamento-corporal',
    image: '/assets/services/massagem-relaxante.png',
    description: 'Momento de relaxamento para terminar a visita com calma.',
  },
  'coloracao-lavagem': {
    name: 'Coloração & Lavagem Facial',
    category: 'Lavagem Facial',
    categorySlug: 'lavagem-facial',
    image: '/assets/services/coloracao-lavagem.png',
    description: 'Tratamento facial e lavagem para renovar o visual.',
  },
  'mascara-preta': {
    name: 'Máscara Preta & Lavagem Facial',
    category: 'Lavagem Facial',
    categorySlug: 'lavagem-facial',
    image: '/assets/services/mascara-preta.png',
    description: 'Limpeza profunda com acabamento fresco.',
  },
  'barbear-lamina': {
    name: 'Barbear à Lâmina',
    category: 'Barba',
    categorySlug: 'barba',
    image: '/assets/services/barbear-lamina.png',
    description: 'Contorno clássico com lâmina e acabamento cuidado.',
  },
  'barbear-maquina-tesoura': {
    name: 'Barbear à Máquina & Tesoura',
    category: 'Barba',
    categorySlug: 'barba',
    image: '/assets/services/barbear-maquina-tesoura.png',
    description: 'Aparar e alinhar a barba com máquina e tesoura.',
  },
  'barbear-criativo': {
    name: 'Barbear Criativo',
    category: 'Barba',
    categorySlug: 'barba',
    image: '/assets/services/barbear-criativo.png',
    description: 'Fade e desenho para uma barba com mais identidade.',
  },
  'beleza-spa': {
    name: 'Beleza & Spa',
    category: 'Spa de Beleza',
    categorySlug: 'spa-de-beleza',
    image: '/assets/services/beleza-spa.png',
    description: 'Tratamento completo para rosto e bem-estar.',
  },
}

const barberImages = {
  2: '/assets/barbers/joao.png',
  3: '/assets/barbers/pedro.png',
  4: '/assets/barbers/carlos.png',
}
const profileUploadDir = new URL('../public/uploads/profiles/', import.meta.url)

const statusMap = {
  pendente: 'pending',
  confirmado: 'confirmed',
  cancelado: 'cancelled',
  'concluído': 'completed',
}

const statusToDatabase = {
  pending: 'pendente',
  confirmed: 'confirmado',
  cancelled: 'cancelado',
  completed: 'concluído',
}

export async function initializeDatabase() {
  try {
    await pool.query('ALTER TABLE usuarios ADD COLUMN imagem VARCHAR(255) NULL')
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') throw error
  }

  try {
    await pool.query('ALTER TABLE usuarios ADD COLUMN corte_preferido VARCHAR(120) NULL')
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') throw error
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_sessions (
      token VARCHAR(128) PRIMARY KEY,
      user_id INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_app_sessions_user_id (user_id),
      CONSTRAINT fk_app_sessions_user
        FOREIGN KEY (user_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_favorites (
      customer_id INT NOT NULL,
      service_slug VARCHAR(100) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (customer_id, service_slug),
      INDEX idx_app_favorites_service_slug (service_slug),
      CONSTRAINT fk_app_favorites_user
        FOREIGN KEY (customer_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `)
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function normalizeBcryptHash(hash) {
  return String(hash || '').replace(/^\$2y\$/, '$2b$')
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10).replace(/^\$2b\$/, '$2y$')
}

function verifyPassword(password, storedHash) {
  return bcrypt.compareSync(password, normalizeBcryptHash(storedHash))
}

function getDisplayName(slug) {
  const known = serviceDetails[slug]?.name

  if (known) return known

  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function priceFromEuros(value) {
  return `${Number(value || 0).toFixed(0)}€`
}

function moneyFromEuros(value) {
  return Number(value || 0).toFixed(2)
}

function priceCentsFromEuros(value) {
  return Math.round(Number(value || 0) * 100)
}

function initialsFromName(name) {
  return String(name || 'RB')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'RB'
}

function formatAppointmentDay(dateString) {
  const date = new Date(`${dateString}T00:00:00`)
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

  return `${weekdays[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')}`
}

function toLocalISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getMinimumBookingDate() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 1)

  return toLocalISODate(date)
}

function timeToMinutes(time) {
  const [hours, minutes] = String(time || '').slice(0, 5).split(':').map(Number)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null

  return hours * 60 + minutes
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function normalizeAppointmentTime(time) {
  const minutes = timeToMinutes(time)

  return minutes === null ? '' : minutesToTime(minutes)
}

function expandUnavailableSlots(startTime, endTime) {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return []

  const slots = []

  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    slots.push(minutesToTime(minutes))
  }

  return slots
}

function mapService(row = {}) {
  const slug = row.nome || row.service_slug || row.servico || 'servico'
  const details = serviceDetails[slug] || {}
  const price = Number(row.preco || 0)

  return {
    id: slug,
    name: details.name || getDisplayName(slug),
    category: details.category || 'Serviços',
    categorySlug: details.categorySlug || 'servicos',
    duration: `${Number(row.duracao || 30)} min`,
    priceCents: priceCentsFromEuros(price),
    price: priceFromEuros(price),
    rating: '4.9',
    image: details.image || '/assets/tools.jpg',
    description: details.description || 'Serviço Rotation Barber com acabamento cuidado.',
  }
}

function mapBarber(row = {}) {
  return {
    id: String(row.id),
    name: row.nome,
    email: row.email || '',
    phone: row.telefone || '',
    role: 'Barbeiro Rotation',
    rating: '4.9',
    initials: initialsFromName(row.nome),
    image: barberImages[row.id] || row.imagem || '/assets/barbers/default.jpg',
  }
}

function mapUser(row = {}) {
  return {
    id: String(row.id),
    name: row.nome,
    email: row.email,
    phone: row.telefone || '',
    role: row.role || 'cliente',
    image: row.imagem || '',
    preferredCut: row.corte_preferido || '',
  }
}

async function saveProfileImage(userId, imageDataUrl) {
  if (!imageDataUrl) return ''

  const match = String(imageDataUrl).match(/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/)

  if (!match) {
    const error = new Error('A foto tem de ser PNG, JPG ou WebP.')
    error.status = 400
    throw error
  }

  const extension = match[1].replace('jpeg', 'jpg')
  const buffer = Buffer.from(match[2], 'base64')

  if (buffer.length > 3 * 1024 * 1024) {
    const error = new Error('A foto é demasiado pesada. Escolhe uma imagem até 3 MB.')
    error.status = 400
    throw error
  }

  await mkdir(profileUploadDir, { recursive: true })

  const filename = `cliente-${userId}-${Date.now()}-${randomBytes(5).toString('hex')}.${extension}`
  await writeFile(new URL(filename, profileUploadDir), buffer)

  return `/uploads/profiles/${filename}`
}

function mapAppointment(row = {}) {
  const appointmentDate = row.appointment_date
  const service = mapService({
    nome: row.service_slug || row.servico,
    preco: row.service_price || row.preco,
    duracao: row.service_duration,
  })

  return {
    id: Number(row.id),
    customerId: String(row.cliente_id),
    customerName: row.customer_name || '',
    appointmentDate,
    appointmentDay: formatAppointmentDay(appointmentDate),
    appointmentTime: row.appointment_time,
    status: statusMap[row.estado] || 'confirmed',
    rawStatus: row.estado || 'confirmado',
    payment: row.pagamento || 'local',
    price: moneyFromEuros(row.service_price || row.preco),
    createdAt: '',
    service,
    barber: {
      id: String(row.barbeiro_id),
      name: row.barber_name || 'Barbeiro Rotation',
      email: row.barber_email || '',
      role: 'Barbeiro Rotation',
      rating: '4.9',
      initials: initialsFromName(row.barber_name),
      image: barberImages[row.barbeiro_id] || '/assets/barbers/default.jpg',
    },
    customer: {
      id: String(row.cliente_id),
      name: row.customer_name || 'Cliente Rotation',
      email: row.customer_email || '',
      phone: row.customer_phone || '',
    },
  }
}

function requireStaff(user) {
  if (!['admin', 'barbeiro'].includes(user?.role)) {
    const error = new Error('Acesso reservado à equipa.')
    error.status = 403
    throw error
  }
}

function requireAdmin(user) {
  if (user?.role !== 'admin') {
    const error = new Error('Acesso reservado a administradores.')
    error.status = 403
    throw error
  }
}

function getPaymentLabel(payment) {
  if (payment === 'local') return 'Pagar no local'
  if (payment === 'online-paypal') return 'Online (PayPal)'
  if (payment === 'online-stripe') return 'Online (Stripe)'
  return payment || 'Pagar no local'
}

function getManagementStats(appointments) {
  return appointments.reduce(
    (stats, appointment) => {
      const price = Number(appointment.price || 0)

      stats.total += 1
      stats[appointment.status] = (stats[appointment.status] || 0) + 1

      if (['confirmed', 'completed'].includes(appointment.status)) {
        stats.revenue += price

        if (appointment.payment === 'local') {
          stats.localPayments += price
        } else if (appointment.payment.startsWith('online')) {
          stats.onlinePayments += price
        }
      }

      if (appointment.status === 'pending') {
        stats.pendingPayments += price
      }

      return stats
    },
    {
      total: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      revenue: 0,
      pendingPayments: 0,
      localPayments: 0,
      onlinePayments: 0,
    },
  )
}

function groupCalendar(appointments) {
  const days = new Map()

  for (const appointment of appointments) {
    if (!days.has(appointment.appointmentDate)) {
      days.set(appointment.appointmentDate, {
        date: appointment.appointmentDate,
        label: appointment.appointmentDay,
        total: 0,
        pending: 0,
        confirmed: 0,
        cancelled: 0,
      })
    }

    const day = days.get(appointment.appointmentDate)
    day.total += 1
    day[appointment.status] = (day[appointment.status] || 0) + 1
  }

  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}

function mapManagementAppointment(row = {}) {
  return {
    ...mapAppointment(row),
    paymentLabel: getPaymentLabel(row.pagamento),
  }
}

async function createSession(user) {
  const token = randomBytes(32).toString('hex')
  await pool.execute('INSERT INTO app_sessions (token, user_id) VALUES (?, ?)', [token, user.id])
  return { token, user }
}

export async function listServices() {
  const [rows] = await pool.query('SELECT nome, preco, duracao FROM servicos ORDER BY id ASC')
  return rows.map(mapService)
}

export async function listBarbers() {
  const [rows] = await pool.query("SELECT id, nome, email, telefone, imagem FROM usuarios WHERE role = 'barbeiro' ORDER BY id ASC")
  return rows.map(mapBarber)
}

export async function registerUser(payload) {
  const name = String(payload.name || '').trim()
  const email = normalizeEmail(payload.email)
  const phone = String(payload.phone || '').trim()
  const password = String(payload.password || '')

  if (name.length < 2 || !email.includes('@') || password.length < 6) {
    const error = new Error('Preenche nome, email válido e password com pelo menos 6 caracteres.')
    error.status = 400
    throw error
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO usuarios (nome, email, senha, telefone, role) VALUES (?, ?, ?, ?, 'cliente')",
      [name, email, hashPassword(password), phone],
    )

    return createSession({
      id: String(result.insertId),
      name,
      email,
      phone,
      role: 'cliente',
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const duplicateError = new Error('Já existe uma conta com esse email.')
      duplicateError.status = 409
      throw duplicateError
    }

    throw error
  }
}

export async function loginUser(payload) {
  const email = normalizeEmail(payload.email)
  const password = String(payload.password || '')
  const [rows] = await pool.execute('SELECT * FROM usuarios WHERE email = ? LIMIT 1', [email])
  const user = rows[0]

  if (!user || !verifyPassword(password, user.senha)) {
    const error = new Error('Email ou password incorretos.')
    error.status = 401
    throw error
  }

  return createSession(mapUser(user))
}

export async function getSessionUser(token) {
  if (!token) return null

  const [rows] = await pool.execute(
    `
      SELECT usuarios.*
      FROM app_sessions
      JOIN usuarios ON usuarios.id = app_sessions.user_id
      WHERE app_sessions.token = ?
      LIMIT 1
    `,
    [token],
  )

  return rows[0] ? mapUser(rows[0]) : null
}

export async function updateUserProfile(userId, payload) {
  const name = String(payload.name || '').trim()
  const preferredCut = String(payload.preferredCut || '').trim().slice(0, 120)
  const imagePath = await saveProfileImage(userId, payload.profileImage)

  if (name.length < 2) {
    const error = new Error('O nome deve ter pelo menos 2 letras.')
    error.status = 400
    throw error
  }

  const fields = ['nome = ?', 'corte_preferido = ?']
  const params = [name, preferredCut]

  if (imagePath) {
    fields.push('imagem = ?')
    params.push(imagePath)
  }

  params.push(userId)

  await pool.execute(
    `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
    params,
  )

  const [rows] = await pool.execute('SELECT * FROM usuarios WHERE id = ? LIMIT 1', [userId])
  return mapUser(rows[0])
}

export async function logoutUser(token) {
  if (token) {
    await pool.execute('DELETE FROM app_sessions WHERE token = ?', [token])
  }

  return { ok: true }
}

export async function listFavorites(customerId) {
  const [rows] = await pool.execute(
    'SELECT service_slug FROM app_favorites WHERE customer_id = ? ORDER BY created_at DESC',
    [customerId],
  )

  return rows.map((row) => row.service_slug)
}

export async function addFavorite(customerId, serviceId) {
  await pool.execute(
    'INSERT IGNORE INTO app_favorites (customer_id, service_slug) VALUES (?, ?)',
    [customerId, serviceId],
  )

  return listFavorites(customerId)
}

export async function deleteFavorite(customerId, serviceId) {
  await pool.execute('DELETE FROM app_favorites WHERE customer_id = ? AND service_slug = ?', [customerId, serviceId])
  return listFavorites(customerId)
}

export async function listAppointments(customerId) {
  const [rows] = await pool.execute(
    `
      SELECT
        a.id,
        a.cliente_id,
        a.barbeiro_id,
        a.servico,
        a.estado,
        a.pagamento,
        a.preco,
        DATE_FORMAT(a.data, '%Y-%m-%d') AS appointment_date,
        TIME_FORMAT(a.horario, '%H:%i') AS appointment_time,
        cliente.nome AS customer_name,
        cliente.email AS customer_email,
        cliente.telefone AS customer_phone,
        barbeiro.nome AS barber_name,
        barbeiro.email AS barber_email,
        s.nome AS service_slug,
        s.preco AS service_price,
        s.duracao AS service_duration
      FROM agendamentos a
      LEFT JOIN usuarios cliente ON cliente.id = a.cliente_id
      LEFT JOIN usuarios barbeiro ON barbeiro.id = a.barbeiro_id
      LEFT JOIN servicos s ON LOWER(TRIM(s.nome)) = LOWER(TRIM(a.servico))
      WHERE a.cliente_id = ?
      ORDER BY a.data ASC, a.horario ASC
    `,
    [customerId],
  )

  return rows.map(mapAppointment)
}

export async function listConfirmedSlots() {
  const [bookedRows] = await pool.query(`
    SELECT
      CAST(barbeiro_id AS CHAR) AS barberId,
      DATE_FORMAT(data, '%Y-%m-%d') AS appointmentDate,
      TIME_FORMAT(horario, '%H:%i') AS appointmentTime,
      'booking' AS source
    FROM agendamentos
    WHERE estado IN ('pendente', 'confirmado')
    ORDER BY data ASC, horario ASC
  `)

  const [unavailableRows] = await pool.query(`
    SELECT
      CAST(barbeiro_id AS CHAR) AS barberId,
      DATE_FORMAT(data, '%Y-%m-%d') AS appointmentDate,
      TIME_FORMAT(hora_inicio, '%H:%i') AS startTime,
      TIME_FORMAT(hora_fim, '%H:%i') AS endTime
    FROM barber_unavailability
    ORDER BY data ASC, hora_inicio ASC
  `)

  const unavailableSlots = unavailableRows.flatMap((row) =>
    expandUnavailableSlots(row.startTime, row.endTime).map((appointmentTime) => ({
      barberId: row.barberId,
      appointmentDate: row.appointmentDate,
      appointmentTime,
      source: 'unavailability',
    })),
  )

  return [...bookedRows, ...unavailableSlots].sort((a, b) =>
    `${a.appointmentDate} ${a.appointmentTime} ${a.barberId}`.localeCompare(
      `${b.appointmentDate} ${b.appointmentTime} ${b.barberId}`,
    ),
  )
}

async function isBarberSlotBlocked(barberId, appointmentDate, appointmentTime) {
  const normalizedTime = normalizeAppointmentTime(appointmentTime)

  const [existingSlots] = await pool.execute(
    `
      SELECT id
      FROM agendamentos
      WHERE barbeiro_id = ?
        AND data = ?
        AND TIME_FORMAT(horario, '%H:%i') = ?
        AND estado IN ('pendente', 'confirmado')
      LIMIT 1
    `,
    [barberId, appointmentDate, normalizedTime],
  )

  if (existingSlots.length > 0) return true

  const [unavailableSlots] = await pool.execute(
    `
      SELECT id
      FROM barber_unavailability
      WHERE barbeiro_id = ?
        AND data = ?
        AND TIME(?) >= TIME(hora_inicio)
        AND TIME(?) < TIME(hora_fim)
      LIMIT 1
    `,
    [barberId, appointmentDate, normalizedTime, normalizedTime],
  )

  return unavailableSlots.length > 0
}

async function resolveBarberId(requestedBarberId, appointmentDate, appointmentTime) {
  if (['any', '0', ''].includes(String(requestedBarberId || '').trim())) {
    const [barbers] = await pool.execute("SELECT id FROM usuarios WHERE role = 'barbeiro' ORDER BY id ASC")

    for (const barber of barbers) {
      const barberId = String(barber.id)

      if (!(await isBarberSlotBlocked(barberId, appointmentDate, appointmentTime))) {
        return barberId
      }
    }

    const error = new Error('Nenhum barbeiro está livre nesse horário. Escolhe outro horário.')
    error.status = 409
    throw error
  }

  const barberId = String(requestedBarberId)
  const [barbers] = await pool.execute(
    "SELECT id FROM usuarios WHERE id = ? AND role = 'barbeiro' LIMIT 1",
    [barberId],
  )

  if (barbers.length === 0) {
    const error = new Error('Barbeiro não encontrado.')
    error.status = 404
    throw error
  }

  return barberId
}

export async function createAppointment(payload) {
  const customerId = payload.customerId

  if (!customerId || !payload.serviceId || !payload.barberId || !payload.appointmentDate || !payload.appointmentTime) {
    const error = new Error('Faltam dados para criar a marcação.')
    error.status = 400
    throw error
  }

  const appointmentDate = String(payload.appointmentDate || '').trim()
  const minimumBookingDate = getMinimumBookingDate()

  if (appointmentDate < minimumBookingDate) {
    const dateError = new Error('Só é possível criar marcações a partir de amanhã.')
    dateError.status = 400
    throw dateError
  }

  const appointmentTime = normalizeAppointmentTime(payload.appointmentTime)
  const barberId = await resolveBarberId(payload.barberId, appointmentDate, appointmentTime)

  const [services] = await pool.execute('SELECT nome, preco FROM servicos WHERE nome = ? LIMIT 1', [payload.serviceId])
  const service = services[0]

  if (!service) {
    const error = new Error('Serviço não encontrado.')
    error.status = 404
    throw error
  }

  if (await isBarberSlotBlocked(barberId, appointmentDate, appointmentTime)) {
    const slotError = new Error('Esse horário acabou de ficar ocupado. Escolhe outro horário.')
    slotError.status = 409
    throw slotError
  }

  const customerName = String(payload.customerName || '').trim()
  const customerPhone = String(payload.customerPhone || '').trim()

  if (customerName || customerPhone) {
    await pool.execute(
      `
        UPDATE usuarios
        SET
          nome = COALESCE(NULLIF(?, ''), nome),
          telefone = COALESCE(NULLIF(?, ''), telefone)
        WHERE id = ?
      `,
      [customerName, customerPhone, customerId],
    )
  }

  const [result] = await pool.execute(
    `
      INSERT INTO agendamentos
        (cliente_id, barbeiro_id, servico, data, horario, pagamento, estado, preco, payment_id)
      VALUES (?, ?, ?, ?, ?, 'local', 'pendente', ?, NULL)
    `,
    [customerId, barberId, service.nome, appointmentDate, appointmentTime, service.preco],
  )

  const appointments = await listAppointments(customerId)
  return appointments.find((appointment) => appointment.id === Number(result.insertId))
}

export async function cancelAppointment(id, customerId) {
  const [result] = await pool.execute(
    "UPDATE agendamentos SET estado = 'cancelado' WHERE id = ? AND cliente_id = ?",
    [id, customerId],
  )

  if (result.affectedRows === 0) {
    const error = new Error('Marcação não encontrada.')
    error.status = 404
    throw error
  }

  return { id, status: 'cancelled' }
}

export async function getManagementDashboard(user) {
  requireStaff(user)

  const params = []
  const where = user.role === 'barbeiro' ? 'WHERE a.barbeiro_id = ?' : ''

  if (user.role === 'barbeiro') {
    params.push(user.id)
  }

  const [appointmentRows] = await pool.execute(
    `
      SELECT
        a.id,
        a.cliente_id,
        a.barbeiro_id,
        a.servico,
        a.data,
        a.horario,
        a.pagamento,
        a.estado,
        COALESCE(a.preco, s.preco, 0) AS preco,
        DATE_FORMAT(a.data, '%Y-%m-%d') AS appointment_date,
        TIME_FORMAT(a.horario, '%H:%i') AS appointment_time,
        cliente.nome AS customer_name,
        cliente.email AS customer_email,
        barbeiro.nome AS barber_name,
        barbeiro.email AS barber_email,
        s.nome AS service_slug,
        s.preco AS service_price,
        s.duracao AS service_duration
      FROM agendamentos a
      LEFT JOIN usuarios cliente ON cliente.id = a.cliente_id
      LEFT JOIN usuarios barbeiro ON barbeiro.id = a.barbeiro_id
      LEFT JOIN servicos s ON LOWER(TRIM(s.nome)) = LOWER(TRIM(a.servico))
      ${where}
      ORDER BY a.data DESC, a.horario DESC
    `,
    params,
  )

  const appointments = appointmentRows.map(mapManagementAppointment)
  const stats = getManagementStats(appointments)
  const calendar = groupCalendar(appointments)
  const today = new Date().toISOString().slice(0, 10)

  const dashboard = {
    role: user.role,
    appointments,
    calendar,
    stats: {
      ...stats,
      today: appointments.filter((appointment) => appointment.appointmentDate === today).length,
      revenue: moneyFromEuros(stats.revenue),
      pendingPayments: moneyFromEuros(stats.pendingPayments),
      localPayments: moneyFromEuros(stats.localPayments),
      onlinePayments: moneyFromEuros(stats.onlinePayments),
    },
    users: [],
    subscribers: [],
  }

  if (user.role === 'admin') {
    const [users] = await pool.query('SELECT id, nome, email, telefone, role FROM usuarios ORDER BY id ASC')
    const [subscribers] = await pool.query(`
      SELECT id, email, DATE_FORMAT(subscribed_at, '%Y-%m-%d %H:%i') AS subscribedAt
      FROM subscribers
      ORDER BY subscribed_at DESC
    `)

    dashboard.users = users.map(mapUser)
    dashboard.subscribers = subscribers
  }

  return dashboard
}

export async function updateManagementAppointmentStatus(user, id, nextStatus) {
  requireStaff(user)

  const databaseStatus = statusToDatabase[nextStatus]

  if (!databaseStatus) {
    const error = new Error('Estado inválido.')
    error.status = 400
    throw error
  }

  const [appointments] = await pool.execute(
    'SELECT id, barbeiro_id FROM agendamentos WHERE id = ? LIMIT 1',
    [id],
  )
  const appointment = appointments[0]

  if (!appointment) {
    const error = new Error('Agendamento não encontrado.')
    error.status = 404
    throw error
  }

  if (user.role === 'barbeiro' && String(appointment.barbeiro_id) !== String(user.id)) {
    const error = new Error('Só podes gerir os teus agendamentos.')
    error.status = 403
    throw error
  }

  await pool.execute('UPDATE agendamentos SET estado = ? WHERE id = ?', [databaseStatus, id])

  return getManagementDashboard(user)
}

export async function addNewsletterSubscriber(user, email) {
  requireAdmin(user)

  const subscriberEmail = normalizeEmail(email)

  if (!subscriberEmail.includes('@')) {
    const error = new Error('Email inválido.')
    error.status = 400
    throw error
  }

  try {
    await pool.execute('INSERT INTO subscribers (email) VALUES (?)', [subscriberEmail])
  } catch (error) {
    if (error.code !== 'ER_DUP_ENTRY') throw error
  }

  return getManagementDashboard(user)
}

export async function deleteNewsletterSubscriber(user, id) {
  requireAdmin(user)

  await pool.execute('DELETE FROM subscribers WHERE id = ?', [id])
  return getManagementDashboard(user)
}
