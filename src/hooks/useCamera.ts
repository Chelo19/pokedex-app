import { useEffect, useRef, useState } from 'react'

export function useCamera(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setReady(false)
      setError(null)
      return
    }

    let stream: MediaStream | null = null
    let cancelled = false

    async function start() {
      setError(null)
      setReady(false)

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Tu navegador no soporta acceso a la cámara.')
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        const video = videoRef.current
        if (!video) return

        video.srcObject = stream
        await video.play()
        setReady(true)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'No se pudo activar la cámara.'
        setError(message)
      }
    }

    start()

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setReady(false)
    }
  }, [enabled])

  return { videoRef, error, ready }
}
