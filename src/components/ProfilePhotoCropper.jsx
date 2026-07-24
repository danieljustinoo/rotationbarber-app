import { useRef } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { clampNumber, getCropImageStyle, profileCropPreviewSize } from '../utils/profileImage.js'

export function ProfilePhotoCropper({ crop, error, saving, onCancel, onChange, onConfirm }) {
  const gestureRef = useRef({ pointers: new Map(), start: null })
  const imageStyle = getCropImageStyle(crop)
  const moveScale = 200 / profileCropPreviewSize

  const getPointers = () => [...gestureRef.current.pointers.values()]

  const getDistance = (first, second) => Math.hypot(second.x - first.x, second.y - first.y)

  const getCenter = (first, second) => ({
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  })

  const resetGestureStart = () => {
    const pointers = getPointers()

    if (pointers.length === 1) {
      gestureRef.current.start = {
        offsetX: crop.offsetX,
        offsetY: crop.offsetY,
        pointerX: pointers[0].x,
        pointerY: pointers[0].y,
        type: 'pan',
      }
      return
    }

    if (pointers.length >= 2) {
      const [first, second] = pointers
      const center = getCenter(first, second)
      gestureRef.current.start = {
        centerX: center.x,
        centerY: center.y,
        distance: Math.max(1, getDistance(first, second)),
        offsetX: crop.offsetX,
        offsetY: crop.offsetY,
        type: 'pinch',
        zoom: crop.zoom,
      }
      return
    }

    gestureRef.current.start = null
  }

  const startGesture = (event) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    gestureRef.current.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    resetGestureStart()
  }

  const moveGesture = (event) => {
    if (!gestureRef.current.pointers.has(event.pointerId)) return

    event.preventDefault()
    gestureRef.current.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    const start = gestureRef.current.start
    const pointers = getPointers()

    if (!start) return

    if (start.type === 'pinch' && pointers.length >= 2) {
      const [first, second] = pointers
      const center = getCenter(first, second)
      const distance = Math.max(1, getDistance(first, second))

      onChange({
        offsetX: clampNumber(start.offsetX + (center.x - start.centerX) * moveScale, -100, 100),
        offsetY: clampNumber(start.offsetY + (center.y - start.centerY) * moveScale, -100, 100),
        zoom: clampNumber(start.zoom * (distance / start.distance), 1, 3),
      })
      return
    }

    if (start.type === 'pan' && pointers.length === 1) {
      const [pointer] = pointers

      onChange({
        offsetX: clampNumber(start.offsetX + (pointer.x - start.pointerX) * moveScale, -100, 100),
        offsetY: clampNumber(start.offsetY + (pointer.y - start.pointerY) * moveScale, -100, 100),
      })
    }
  }

  const endGesture = (event) => {
    gestureRef.current.pointers.delete(event.pointerId)
    resetGestureStart()
  }

  const zoomWithWheel = (event) => {
    event.preventDefault()
    onChange({ zoom: clampNumber(crop.zoom + (event.deltaY > 0 ? -0.08 : 0.08), 1, 3) })
  }

  return (
    <div className="profile-crop-backdrop" role="dialog" aria-modal="true" aria-label="Recortar fotografia">
      <aside className="profile-crop-sheet">
        <header>
          <div>
            <h2>Recortar foto</h2>
            <p>Ajusta com dois dedos</p>
          </div>
          <button className="mini-icon-button" type="button" aria-label="Fechar recorte" onClick={onCancel}>
            <X size={17} />
          </button>
        </header>

        <div
          className="profile-crop-preview"
          aria-hidden="true"
          onPointerCancel={endGesture}
          onPointerDown={startGesture}
          onPointerMove={moveGesture}
          onPointerUp={endGesture}
          onWheel={zoomWithWheel}
        >
          <img
            alt=""
            draggable="false"
            src={crop.source}
            style={imageStyle}
            onLoad={(event) =>
              onChange({
                naturalHeight: event.currentTarget.naturalHeight,
                naturalWidth: event.currentTarget.naturalWidth,
              })
            }
          />
        </div>

        {error && <p className="profile-error">{error}</p>}

        <div className="profile-crop-actions">
          <button className="primary-button" disabled={saving} type="button" onClick={onConfirm}>
            <CheckCircle2 size={18} />
            {saving ? 'A recortar...' : 'Usar foto'}
          </button>
        </div>
      </aside>
    </div>
  )
}
