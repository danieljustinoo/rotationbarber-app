const mailBridgeUrl = process.env.MAIL_BRIDGE_URL || 'http://rotationbarber.test/send-confirmation.php'

function cleanText(value) {
  return String(value || '').trim()
}

function getRecipient(appointment, fallbackEmail) {
  return cleanText(fallbackEmail || appointment?.customer?.email)
}

function buildMailBridgePayload(appointment, to) {
  return {
    client: {
      email: to,
      name: cleanText(appointment?.customer?.name || appointment?.customerName || 'Cliente'),
    },
    service: cleanText(appointment?.service?.name || 'Serviço Rotation Barber'),
    date: cleanText(appointment?.appointmentDate),
    time: cleanText(appointment?.appointmentTime),
    barberName: cleanText(appointment?.barber?.name || 'Qualquer disponível'),
  }
}

async function sendThroughSiteMailBridge(appointment, to) {
  const response = await fetch(mailBridgeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildMailBridgePayload(appointment, to)),
  })
  const text = await response.text()
  const jsonStart = text.indexOf('{')
  const jsonEnd = text.lastIndexOf('}')
  const body = jsonStart >= 0 && jsonEnd > jsonStart
    ? JSON.parse(text.slice(jsonStart, jsonEnd + 1))
    : {}

  if (!response.ok || !body.success) {
    throw new Error(body.message || `Servidor de email respondeu com estado ${response.status}`)
  }
}

export async function sendAppointmentConfirmationEmail(appointment, fallbackEmail) {
  const to = getRecipient(appointment, fallbackEmail)

  if (!to || !to.includes('@')) {
    return { sent: false, reason: 'missing-recipient' }
  }

  if (process.env.MAIL_DISABLED === '1') {
    return { sent: false, to, reason: 'disabled' }
  }

  try {
    await sendThroughSiteMailBridge(appointment, to)
    return { sent: true, to, method: 'site-smtp' }
  } catch (error) {
    console.warn(`Email de confirmação não enviado para ${to}: ${error.message}`)
    return { sent: false, to, reason: error.message }
  }
}
