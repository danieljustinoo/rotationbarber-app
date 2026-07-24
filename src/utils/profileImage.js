export const profileCropOutputSize = 512
export const profileCropPreviewSize = 320

export function getInitials(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Não foi possível ler a fotografia.'))
    reader.readAsDataURL(file)
  })
}

function loadImageElement(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Não foi possível preparar a fotografia.'))
    image.src = source
  })
}

function getCropGeometry(crop, size) {
  const naturalWidth = crop.naturalWidth || 1
  const naturalHeight = crop.naturalHeight || 1
  const zoom = Number(crop.zoom) || 1
  const baseScale = Math.max(size / naturalWidth, size / naturalHeight)
  const scale = baseScale * zoom
  const width = naturalWidth * scale
  const height = naturalHeight * scale
  const maxX = Math.max(0, (width - size) / 2)
  const maxY = Math.max(0, (height - size) / 2)
  const x = (size - width) / 2 + ((Number(crop.offsetX) || 0) / 100) * maxX
  const y = (size - height) / 2 + ((Number(crop.offsetY) || 0) / 100) * maxY

  return { height, width, x, y }
}

export function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function getCropImageStyle(crop) {
  if (!crop?.naturalWidth || !crop?.naturalHeight) {
    return {
      height: '100%',
      transform: `scale(${crop?.zoom || 1})`,
      width: '100%',
    }
  }

  const geometry = getCropGeometry(crop, profileCropPreviewSize)

  return {
    height: `${geometry.height}px`,
    transform: `translate(${geometry.x}px, ${geometry.y}px)`,
    width: `${geometry.width}px`,
  }
}

export async function cropProfileImage(source, crop) {
  const image = await loadImageElement(source)
  const canvas = document.createElement('canvas')
  canvas.width = profileCropOutputSize
  canvas.height = profileCropOutputSize

  const context = canvas.getContext('2d')
  const geometry = getCropGeometry(
    {
      ...crop,
      naturalHeight: image.naturalHeight,
      naturalWidth: image.naturalWidth,
    },
    profileCropOutputSize,
  )

  context.fillStyle = '#fffaf4'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, geometry.x, geometry.y, geometry.width, geometry.height)

  return canvas.toDataURL('image/jpeg', 0.9)
}
