import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'

export function BarcodeScannerModal({
  onDetected,
  onClose,
}: {
  onDetected: (barcode: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let cancelled = false

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        if (result && !cancelled) {
          cancelled = true
          controlsRef.current?.stop()
          onDetected(result.getText())
        }
      })
      .then((controls) => {
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
      })
      .catch((err: unknown) => {
        const name = err instanceof Error ? err.name : ''
        setError(
          name === 'NotAllowedError'
            ? t('barcodeScanner.cameraDenied')
            : name === 'NotFoundError'
              ? t('barcodeScanner.cameraNotFound')
              : t('barcodeScanner.cameraFailed'),
        )
      })

    return () => {
      cancelled = true
      controlsRef.current?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      <div className="flex items-center justify-between p-4">
        <span className="text-white font-medium text-sm">{t('barcodeScanner.title')}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-white text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
        >
          {t('barcodeScanner.close')}
        </button>
      </div>
      <div className="flex-1 relative flex items-center justify-center">
        {error ? (
          <p className="text-white text-sm text-center px-6">{error}</p>
        ) : (
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        )}
      </div>
      {!error && (
        <p className="text-white/70 text-xs text-center pb-6 px-6">{t('barcodeScanner.hint')}</p>
      )}
    </div>
  )
}
