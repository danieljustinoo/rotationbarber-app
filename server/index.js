import cors from 'cors'
import express from 'express'
import {
  addFavorite,
  addNewsletterSubscriber,
  cancelAppointment,
  createAppointment,
  deleteNewsletterSubscriber,
  deleteFavorite,
  getManagementDashboard,
  getSessionUser,
  initializeDatabase,
  listAppointments,
  listBarbers,
  listConfirmedSlots,
  listFavorites,
  listServices,
  loginUser,
  logoutUser,
  registerUser,
  updateManagementAppointmentStatus,
  updateUserProfile,
} from './db.js'
import { sendAppointmentConfirmationEmail } from './email.js'

const app = express()
const port = Number(process.env.PORT || 5181)

app.use(cors({ origin: true }))
app.use('/uploads', express.static(new URL('../public/uploads/', import.meta.url).pathname))
app.use(express.json({ limit: '6mb' }))

function getBearerToken(request) {
  const header = request.get('authorization') || ''
  const [type, token] = header.split(' ')

  return type === 'Bearer' ? token : ''
}

async function requireUser(request, response, next) {
  try {
    const user = await getSessionUser(getBearerToken(request))

    if (!user) {
      response.status(401).json({ error: 'Inicia sessão para continuar.' })
      return
    }

    request.user = user
    next()
  } catch (error) {
    next(error)
  }
}

function asyncHandler(handler) {
  return async (request, response, next) => {
    try {
      await handler(request, response, next)
    } catch (error) {
      next(error)
    }
  }
}

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    database: 'mysql',
    app: 'Rotation Barber',
  })
})

app.post('/api/auth/register', asyncHandler(async (request, response) => {
  response.status(201).json(await registerUser(request.body))
}))

app.post('/api/auth/login', asyncHandler(async (request, response) => {
  response.json(await loginUser(request.body))
}))

app.get('/api/auth/me', requireUser, (request, response) => {
  response.json(request.user)
})

app.patch('/api/auth/profile', requireUser, asyncHandler(async (request, response) => {
  response.json(await updateUserProfile(request.user.id, request.body))
}))

app.post('/api/auth/logout', asyncHandler(async (request, response) => {
  response.json(await logoutUser(getBearerToken(request)))
}))

app.get('/api/services', asyncHandler(async (_request, response) => {
  response.json(await listServices())
}))

app.get('/api/barbers', asyncHandler(async (_request, response) => {
  response.json(await listBarbers())
}))

app.get('/api/appointments', requireUser, asyncHandler(async (request, response) => {
  response.json({
    appointments: await listAppointments(request.user.id),
    bookedSlots: await listConfirmedSlots(),
  })
}))

app.post('/api/appointments', requireUser, asyncHandler(async (request, response) => {
  const appointment = await createAppointment({
    ...request.body,
    customerId: request.user.id,
    customerName: request.user.name,
  })
  const confirmationEmail = await sendAppointmentConfirmationEmail(
    appointment,
    request.body.customerEmail || request.user.email,
  )

  response.status(201).json({
    ...appointment,
    confirmationEmail,
  })
}))

app.patch('/api/appointments/:id/cancel', requireUser, asyncHandler(async (request, response) => {
  response.json(await cancelAppointment(Number(request.params.id), request.user.id))
}))

app.get('/api/favorites', requireUser, asyncHandler(async (request, response) => {
  response.json(await listFavorites(request.user.id))
}))

app.post('/api/favorites', requireUser, asyncHandler(async (request, response) => {
  response.status(201).json(await addFavorite(request.user.id, request.body.serviceId))
}))

app.delete('/api/favorites/:serviceId', requireUser, asyncHandler(async (request, response) => {
  response.json(await deleteFavorite(request.user.id, request.params.serviceId))
}))

app.get('/api/management', requireUser, asyncHandler(async (request, response) => {
  response.json(await getManagementDashboard(request.user))
}))

app.patch('/api/management/appointments/:id/status', requireUser, asyncHandler(async (request, response) => {
  response.json(await updateManagementAppointmentStatus(
    request.user,
    Number(request.params.id),
    request.body.status,
  ))
}))

app.post('/api/management/newsletter', requireUser, asyncHandler(async (request, response) => {
  response.status(201).json(await addNewsletterSubscriber(request.user, request.body.email))
}))

app.delete('/api/management/newsletter/:id', requireUser, asyncHandler(async (request, response) => {
  response.json(await deleteNewsletterSubscriber(request.user, Number(request.params.id)))
}))

app.use((error, _request, response, _next) => {
  response.status(error.status || 500).json({
    error: error.message || 'Erro inesperado na API.',
  })
})

await initializeDatabase()

app.listen(port, '0.0.0.0', () => {
  console.log(`Rotation Barber API: http://localhost:${port}`)
})
