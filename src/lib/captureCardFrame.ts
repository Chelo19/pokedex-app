type CropRect = { x: number; y: number; width: number; height: number }

/** Mapeo de object-cover: píxeles del video mostrado → coordenadas intrínsecas. */
function getObjectCoverMapping(
  displayWidth: number,
  displayHeight: number,
  videoWidth: number,
  videoHeight: number,
) {
  const scale = Math.max(displayWidth / videoWidth, displayHeight / videoHeight)
  return {
    scale,
    offsetX: (videoWidth * scale - displayWidth) / 2,
    offsetY: (videoHeight * scale - displayHeight) / 2,
  }
}

/** Convierte el rect del marco del jig (en pantalla) a recorte del frame real del video. */
export function jigFrameToVideoCrop(
  video: HTMLVideoElement,
  frameEl: HTMLElement,
): CropRect | null {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) return null

  const videoRect = video.getBoundingClientRect()
  const frameRect = frameEl.getBoundingClientRect()

  const relLeft = frameRect.left - videoRect.left
  const relTop = frameRect.top - videoRect.top
  const relWidth = frameRect.width
  const relHeight = frameRect.height

  const { scale, offsetX, offsetY } = getObjectCoverMapping(
    videoRect.width,
    videoRect.height,
    vw,
    vh,
  )

  let x = (relLeft + offsetX) / scale
  let y = (relTop + offsetY) / scale
  let width = relWidth / scale
  let height = relHeight / scale

  x = Math.max(0, Math.floor(x))
  y = Math.max(0, Math.floor(y))
  width = Math.min(Math.floor(width), vw - x)
  height = Math.min(Math.floor(height), vh - y)

  if (width < 20 || height < 20) return null

  return { x, y, width, height }
}

/** Captura solo la zona del marco del jig, alineada con lo que ves en pantalla. */
export function captureCardRegion(
  video: HTMLVideoElement,
  frameEl: HTMLElement,
): HTMLCanvasElement | null {
  const crop = jigFrameToVideoCrop(video, frameEl)
  if (!crop) return null

  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(
    video,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  )
  return canvas
}

export function upscaleForOcr(source: HTMLCanvasElement): HTMLCanvasElement {
  const minSide = Math.min(source.width, source.height)
  const factor = minSide < 180 ? 3 : minSide < 360 ? 2 : 1.5

  const scaled = document.createElement('canvas')
  scaled.width = Math.round(source.width * factor)
  scaled.height = Math.round(source.height * factor)
  const ctx = scaled.getContext('2d')
  if (!ctx) return source

  ctx.filter = 'grayscale(1) contrast(1.4) brightness(1.05)'
  ctx.drawImage(source, 0, 0, scaled.width, scaled.height)
  return scaled
}
