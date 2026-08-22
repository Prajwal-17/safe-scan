import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { NotFoundException } from '@zxing/library'

interface Props {
  onDetected: (barcode: string) => void
  active: boolean
}

export default function BarcodeScanner({ onDetected, active }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // controls.stop() is the clean way to kill the ZXing decode loop
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [initialising, setInitialising] = useState(true)

  useEffect(() => {
    if (!active) return

    let cancelled = false
    setCameraError(null)
    setInitialising(true)

    async function start() {
      try {
        // Trigger permission prompt
        await BrowserMultiFormatReader.listVideoInputDevices()
        if (cancelled) return
        if (!videoRef.current) return

        const reader = new BrowserMultiFormatReader()
        const controls = await reader.decodeFromVideoDevice(
          undefined,           // undefined = let the browser pick (prefers rear cam on mobile)
          videoRef.current,
          (result, err) => {
            if (cancelled) return
            if (result) {
              onDetected(result.getText())
            } else if (err && !(err instanceof NotFoundException)) {
              // NotFoundException fires every frame when nothing is seen — expected, ignore
              console.warn('ZXing decode error:', err)
            }
          },
        )

        controlsRef.current = controls
        if (!cancelled) setInitialising(false)
      } catch (e: unknown) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : String(e)
        const isDenied =
          msg.toLowerCase().includes('permission') ||
          msg.toLowerCase().includes('notallowed') ||
          msg.toLowerCase().includes('denied')
        setCameraError(isDenied ? 'camera-denied' : msg || 'Camera unavailable.')
        setInitialising(false)
      }
    }

    start()

    return () => {
      cancelled = true
      try { controlsRef.current?.stop() } catch (_) { /* ignore */ }
      controlsRef.current = null
    }
  }, [active, onDetected])

  if (cameraError === 'camera-denied') {
    return (
      <div className="camera-error">
        <span className="camera-error-icon">📷</span>
        <p className="camera-error-title">Camera access denied</p>
        <p className="camera-error-sub">
          Allow camera access in your browser settings, or use the manual
          barcode entry below.
        </p>
      </div>
    )
  }

  if (cameraError) {
    return (
      <div className="camera-error">
        <span className="camera-error-icon">⚠️</span>
        <p className="camera-error-title">Camera unavailable</p>
        <p className="camera-error-sub">Use the manual barcode entry below.</p>
      </div>
    )
  }

  return (
    <div className="camera-wrapper">
      {initialising && (
        <div className="camera-overlay-msg">
          <span className="spin" />
          <span>Starting camera…</span>
        </div>
      )}

      {/* Live video feed */}
      <video
        ref={videoRef}
        id="barcode-video"
        className="camera-video"
        playsInline
        muted
      />

      {/* Animated scan line + corners */}
      {!initialising && (
        <>
          <div className="scan-corners" />
          <div className="scan-line" />
          <p className="scan-hint">Point camera at a barcode</p>
        </>
      )}
    </div>
  )
}
