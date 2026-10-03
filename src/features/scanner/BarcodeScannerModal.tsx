'use client'

import * as React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { BarcodeService } from '@/lib/services'
import { BarcodeLookupResult } from '@/types'
import { Camera, Upload, AlertCircle, CheckCircle2, Search, ArrowRight, Loader2, RefreshCw } from 'lucide-react'

export interface BarcodeScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onDetected?: (result: BarcodeLookupResult) => void
  onScanSuccess?: (barcode: string) => void
  onLookupSuccess?: (info: BarcodeLookupResult) => void
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onDetected,
  onScanSuccess,
  onLookupSuccess,
}: BarcodeScannerModalProps) {
  const [activeTab, setActiveTab] = React.useState<'camera' | 'file' | 'manual'>('camera')
  const [manualCode, setManualCode] = React.useState('')
  const [isScanning, setIsScanning] = React.useState(false)
  const [isLookingUp, setIsLookingUp] = React.useState(false)
  const [scannerError, setScannerError] = React.useState<string | null>(null)
  const [lookupFeedback, setLookupFeedback] = React.useState<BarcodeLookupResult | null>(null)

  const scannerRef = React.useRef<Html5Qrcode | null>(null)
  const readerElementId = 'spms-barcode-reader-viewfinder'

  const stopScanner = React.useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        await scannerRef.current.clear()
      } catch (err) {
        console.warn('Error stopping scanner:', err)
      } finally {
        scannerRef.current = null
        setIsScanning(false)
      }
    }
  }, [isScanning])

  const handleBarcodeIdentified = React.useCallback(
    async (decodedText: string) => {
      await stopScanner()
      if (onScanSuccess) {
        onScanSuccess(decodedText)
      }
      setIsLookingUp(true)
      setScannerError(null)

      try {
        const result = await BarcodeService.lookupBarcode(decodedText)
        setLookupFeedback(result)
      } catch (err) {
        setScannerError(err instanceof Error ? err.message : 'Lookup failed')
      } finally {
        setIsLookingUp(false)
      }
    },
    [stopScanner, onScanSuccess]
  )

  const startScanner = React.useCallback(async () => {
    setScannerError(null)
    setLookupFeedback(null)

    try {
      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      })
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 180 },
          aspectRatio: 1.333334,
        },
        (decodedText) => {
          handleBarcodeIdentified(decodedText)
        },
        () => {
          // Frame scan pass without code
        }
      )

      setIsScanning(true)
    } catch (err) {
      console.warn('Camera initiation failed:', err)
      setScannerError(
        'Camera access was blocked or unavailable on this device. You can upload an image or type the barcode manually.'
      )
      setIsScanning(false)
    }
  }, [handleBarcodeIdentified])

  React.useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const timer = setTimeout(() => {
        startScanner()
      }, 300)
      return () => {
        clearTimeout(timer)
        stopScanner()
      }
    } else {
      stopScanner()
    }
  }, [isOpen, activeTab, startScanner, stopScanner])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLookingUp(true)
    setScannerError(null)

    try {
      const html5QrCode = new Html5Qrcode(readerElementId)
      const decodedText = await html5QrCode.scanFile(file, true)
      await handleBarcodeIdentified(decodedText)
    } catch {
      setScannerError('Could not detect a clear barcode in the uploaded image. Please retry or enter manually.')
      setIsLookingUp(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    await handleBarcodeIdentified(manualCode.trim())
  }

  const handleConfirmResult = () => {
    if (lookupFeedback) {
      if (onLookupSuccess) {
        onLookupSuccess(lookupFeedback)
      }
      if (onDetected) {
        onDetected(lookupFeedback)
      }
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Barcode Scanner & Look-up">
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Camera Viewfinder</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Manual Input</span>
          </button>
        </div>

        {/* Viewfinder Target Container */}
        <div className="relative min-h-[260px] rounded-xl border border-slate-200 bg-slate-950 p-2 overflow-hidden flex flex-col items-center justify-center text-white">
          <div id={readerElementId} className="w-full max-w-sm rounded-lg overflow-hidden" />

          {activeTab === 'file' && (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
              <Upload className="h-8 w-8 text-indigo-400" />
              <p className="text-sm font-medium">Select a clear photo of the barcode</p>
              <label className="cursor-pointer">
                <Button size="sm" type="button">
                  Choose Image File
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="w-full max-w-xs space-y-3 p-4">
              <Input
                label="Barcode / UPC / EAN"
                placeholder="e.g. 8901234567890"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
              <Button
                type="submit"
                className="w-full"
                isLoading={isLookingUp}
                leftIcon={<Search className="h-4 w-4" />}
              >
                Look Up Product
              </Button>
            </form>
          )}

          {isLookingUp && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-sm font-semibold text-slate-200">
                Querying Open Food Facts & UPC Registry...
              </p>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {scannerError && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1">{scannerError}</div>
          </div>
        )}

        {/* Look-up Result Card */}
        {lookupFeedback && (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {lookupFeedback.found ? 'Product Detected' : 'Barcode Captured (New Item)'}
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-slate-500">
                {lookupFeedback.barcode}
              </span>
            </div>

            <div className="text-sm">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">
                {lookupFeedback.name || 'Unregistered Product'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Brand: <span className="font-medium text-slate-700 dark:text-slate-300">{lookupFeedback.brand || 'Manual Entry'}</span>
                {lookupFeedback.weight && <span> • {lookupFeedback.weight}</span>}
              </p>
              {!lookupFeedback.found && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                  Product information was not found in public registry. You can continue with manual entry.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLookupFeedback(null)
                  if (activeTab === 'camera') startScanner()
                }}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Scan Another
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmResult}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Apply to Form
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
