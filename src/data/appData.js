import { createTimeSlots } from '../utils/booking.js'

export const assets = {
  logo: '/assets/logo.png',
  tools: '/assets/tools.jpg',
  fade: '/assets/fade.png',
  pricing: '/assets/pricing.jpg',
  beard: '/assets/beard.jpg',
  wash: '/assets/wash.jpg',
}

export const fallbackServices = [
  {
    id: 'fade',
    name: 'Corte Criativo',
    category: 'Cortes',
    categorySlug: 'cortes',
    duration: '45 min',
    price: '18€',
    priceCents: 1800,
    rating: '4.9',
    image: assets.fade,
    description: 'Fade, degradê ou desenho limpo com acabamento premium.',
  },
  {
    id: 'classic',
    name: 'Corte Simples',
    category: 'Cortes',
    categorySlug: 'cortes',
    duration: '30 min',
    price: '12€',
    priceCents: 1200,
    rating: '4.8',
    image: assets.pricing,
    description: 'Corte rápido, alinhado e finalizado ao estilo Rotation.',
  },
  {
    id: 'beard',
    name: 'Aparar a Barba',
    category: 'Barba',
    categorySlug: 'barba',
    duration: '25 min',
    price: '10€',
    priceCents: 1000,
    rating: '4.9',
    image: assets.beard,
    description: 'Contorno, navalha e hidratação para uma barba marcada.',
  },
  {
    id: 'wash',
    name: 'Lavagem Facial',
    category: 'Lavagem Facial',
    categorySlug: 'lavagem-facial',
    duration: '20 min',
    price: '9€',
    priceCents: 900,
    rating: '4.7',
    image: assets.wash,
    description: 'Limpeza fresca para completar o corte ou a barba.',
  },
]

export const fallbackBarbers = [
  { id: '2', name: 'João Lopes', role: 'Cortes e fade', rating: '4.9', initials: 'JL', image: '/assets/barbers/joao.png', email: 'joao@rotationbarber.com', phone: '987654321' },
  { id: '3', name: 'Pedro Monteiro', role: 'Barba clássica', rating: '4.8', initials: 'PM', image: '/assets/barbers/pedro.png', email: 'pedro@rotationbarber.com', phone: '456789123' },
  { id: '4', name: 'Carlos Pereira', role: 'Freestyle', rating: '4.8', initials: 'CP', image: '/assets/barbers/carlos.png', email: 'carlos@rotationbarber.com', phone: '321654987' },
]

export const categories = ['Todos', 'Cortes', 'Tratamento Corporal', 'Lavagem Facial', 'Barba', 'Spa de Beleza']

export const bookingCategories = [
  { id: 'cortes', label: 'Cortes', note: 'Fade, navalha e freestyle' },
  { id: 'tratamento-corporal', label: 'Tratamento Corporal', note: 'Relaxamento e bem-estar' },
  { id: 'lavagem-facial', label: 'Lavagem Facial', note: 'Limpeza, cor e máscara' },
  { id: 'barba', label: 'Barba', note: 'Lâmina, máquina e desenho' },
  { id: 'spa-de-beleza', label: 'Spa de Beleza', note: 'Tratamento completo' },
]

export const bookingTimes = createTimeSlots()

export const staffRoles = ['admin', 'barbeiro']
