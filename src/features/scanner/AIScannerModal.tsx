'use client'

import * as React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ProductExtractionService } from '@/lib/services'
import { AIExtractionResult, AIReviewConfidence } from '@/types'
import {
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  Loader2,
  RefreshCw,
  Camera,
  AlertCircle,
  Edit3,
  Cpu,
  Tag,
  Calendar,
  Sparkles,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react'
import Image from 'next/image'

export interface AIScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onExtracted?: (result: AIExtractionResult, imageFile?: File) => void
  onApplyExtraction?: (result: AIExtractionResult, imageFile?: File) => void
  onSaveDirectly?: (result: AIExtractionResult, imageFile?: File) => Promise<void>
}

type ScanStage = 'READY' | 'CAPTURING' | 'PROCESSING' | 'EXTRACTING' | 'REVIEW' | 'SUCCESS' | 'ERROR'

const DEFAULT_TARGET_MARKERS = ['EXP', 'MFG', 'BEST BEFORE', 'USE BY', 'BATCH']

export function AIScannerModal({
  isOpen,
  onClose,
  onExtracted,
  onApplyExtraction,
  onSaveDirectly,
}: AIScannerModalProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [stage, setStage] = React.useState<ScanStage>('READY')
  const [progressStage, setProgressStage] = React.useState('')
  const [progressPercent, setProgressPercent] = React.useState(0)
  const [extractedData, setExtractedData] = React.useState<AIExtractionResult | null>(null)
  const [editableResult, setEditableResult] = React.useState<AIExtractionResult | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isUsingCamera, setIsUsingCamera] = React.useState(false)
  const [isSavingDirect, setIsSavingDirect] = React.useState(false)

  // OCR detection markers & states
  const [targetMarkers, setTargetMarkers] = React.useState<string[]>(DEFAULT_TARGET_MARKERS)
  const [newMarkerInput, setNewMarkerInput] = React.useState('')
  const [showOcrDetails, setShowOcrDetails] = React.useState(false)

  const videoRef = React.useRef<HTMLVideoElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)

  const handleAddMarker = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newMarkerInput.trim().toUpperCase()
    if (trimmed && !targetMarkers.includes(trimmed)) {
      setTargetMarkers([...targetMarkers, trimmed])
      setNewMarkerInput('')
    }
  }

  const handleRemoveMarker = (markerToRemove: string) => {
    if (targetMarkers.length <= 1) return
    setTargetMarkers(targetMarkers.filter((m) => m !== markerToRemove))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      stopCamera()
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setExtractedData(null)
      setEditableResult(null)
      setErrorMessage(null)
      setStage('READY')
    }
  }

  const startCamera = async () => {
    try {
      setErrorMessage(null)
      setIsUsingCamera(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setStage('CAPTURING')
    } catch {
      setIsUsingCamera(false)
      setErrorMessage('Could not access camera. Please upload an image file instead.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsUsingCamera(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })
        setSelectedFile(file)
        setPreviewUrl(canvas.toDataURL('image/jpeg'))
        stopCamera()
        setStage('READY')
      }
    }, 'image/jpeg')
  }

  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  const handleStartExtraction = async () => {
    if (!selectedFile) return
    setStage('PROCESSING')
    setErrorMessage(null)

    try {
      const expKws = targetMarkers.filter((k) =>
        ['EXP', 'BEST BEFORE', 'USE BY', 'BB', 'SHELF LIFE', 'EXPIRY', 'VALID'].some((pat) =>
          k.includes(pat)
        )
      )
      const mfgKws = targetMarkers.filter((k) =>
        ['MFG', 'MFD', 'PKD', 'PACKED', 'DOM', 'PROD', 'MANUF'].some((pat) => k.includes(pat))
      )
      const batchKws = targetMarkers.filter((k) =>
        ['BATCH', 'LOT', 'B.NO', 'BN'].some((pat) => k.includes(pat))
      )

      const result = await ProductExtractionService.extractFromImage(
        selectedFile,
        (currentStage, pct) => {
          setProgressStage(currentStage)
          setProgressPercent(pct)
          if (pct > 50) setStage('EXTRACTING')
        },
        {
          customKeywords: {
            exp: expKws.length > 0 ? expKws : undefined,
            mfg: mfgKws.length > 0 ? mfgKws : undefined,
            batch: batchKws.length > 0 ? batchKws : undefined,
          },
        }
      )

      setExtractedData(result)
      setEditableResult(result)
      setStage('REVIEW')
    } catch (err) {
      setStage('ERROR')
      setErrorMessage(err instanceof Error ? err.message : 'OCR Extraction failed.')
    }
  }

  const handleApply = () => {
    const finalData = editableResult || extractedData
    if (finalData) {
      setStage('SUCCESS')
      if (onApplyExtraction) onApplyExtraction(finalData, selectedFile || undefined)
      if (onExtracted) onExtracted(finalData, selectedFile || undefined)
      onClose()
    }
  }

  const handleReset = () => {
    stopCamera()
    setSelectedFile(null)
    setPreviewUrl(null)
    setExtractedData(null)
    setEditableResult(null)
    setProgressPercent(0)
    setProgressStage('')
    setStage('READY')
    setErrorMessage(null)
    setShowOcrDetails(false)
  }

  const getReviewBadge = (confidence?: AIReviewConfidence) => {
    switch (confidence) {
      case 'HIGH_REVIEW_CONFIDENCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> High Confidence
          </span>
        )
      case 'REVIEW_RECOMMENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertCircle className="h-3.5 w-3.5" /> Review Recommended
          </span>
        )
      case 'MANUAL_REVIEW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
            <Edit3 className="h-3.5 w-3.5" /> Manual Review
          </span>
        )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera()
        onClose()
      }}
      size="lg"
      title={
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              OCR Extraction
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Cpu className="h-3 w-3 text-indigo-500" /> YOLOv8
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
            by model YOLOv8
          </p>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Camera Live Viewfinder */}
        {isUsingCamera && (
          <div className="relative aspect-video w-full rounded-xl bg-black overflow-hidden flex flex-col items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-4 flex items-center gap-3">
              <Button size="sm" variant="outline" onClick={stopCamera}>
                Cancel Camera
              </Button>
              <Button size="sm" onClick={capturePhoto} leftIcon={<Camera className="h-4 w-4" />}>
                Capture Photo
              </Button>
            </div>
          </div>
        )}

        {/* Upload Zone if no file selected and not using camera */}
        {!previewUrl && !isUsingCamera && (
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 rounded-xl p-7 hover:border-indigo-400 dark:hover:border-indigo-700 cursor-pointer transition-colors bg-indigo-50/20 dark:bg-indigo-950/10">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-xs">
                <UploadCloud className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Upload product packaging, bottle, carton, or label
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md text-center">
                Automatic OCR extraction by model YOLOv8 to locate manufacturing dates, expiration dates, batch numbers, and packaging details.
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <div className="flex items-center justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startCamera}
                leftIcon={<Camera className="h-4 w-4" />}
              >
                Use Live Camera
              </Button>
            </div>
          </div>
        )}

        {/* OCR Date Targets Selector & Chips */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-indigo-500" />
              <span>Date Detection Markers (MFG, EXP, USE BY):</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              by model YOLOv8
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {targetMarkers.map((marker) => (
              <span
                key={marker}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <span>{marker}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMarker(marker)}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                  title="Remove marker"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Add Custom Marker Input */}
            <form onSubmit={handleAddMarker} className="inline-flex items-center gap-1">
              <input
                type="text"
                value={newMarkerInput}
                onChange={(e) => setNewMarkerInput(e.target.value)}
                placeholder="+ Add Marker..."
                className="text-xs px-2.5 py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 w-28 uppercase"
              />
              {newMarkerInput.trim() && (
                <button
                  type="submit"
                  className="h-6 w-6 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </form>
          </div>
        </div>

        {previewUrl && (
          <div className="space-y-4">
            {/* Image Preview & Extraction Progress Overlay */}
            <div className="relative h-44 sm:h-52 w-full rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800 flex-shrink-0">
              <Image
                src={previewUrl}
                alt="Product Scan Preview"
                fill
                className="object-contain"
              />

              {(stage === 'PROCESSING' || stage === 'EXTRACTING') && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center space-y-4 z-20">
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
                    <Sparkles className="h-4 w-4 text-indigo-300 absolute" />
                  </div>
                  <div className="space-y-1.5 max-w-xs">
                    <p className="text-sm font-semibold">{progressStage || 'Running OCR extraction by model YOLOv8...'}</p>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action trigger before extraction */}
            {stage === 'READY' && (
              <div className="flex items-center justify-between pt-1">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Choose Different Image
                </Button>
                <Button
                  onClick={handleStartExtraction}
                  className="flex flex-col items-center justify-center py-2 px-5 h-auto text-center"
                >
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
                    OCR Extraction
                  </span>
                  <span className="text-[10px] text-indigo-200/90 font-normal">
                    by model YOLOv8
                  </span>
                </Button>
              </div>
            )}

            {/* OCR Review & Verification Panel */}
            {stage === 'REVIEW' && editableResult && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-xs tracking-wide">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>OCR Extraction Verification</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      <Cpu className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>OCR Extraction</span>
                      <span className="text-[10px] opacity-75 font-normal">by model YOLOv8</span>
                    </span>
                    {getReviewBadge(editableResult.review_state)}
                    {editableResult.confidence && (
                      <span className="text-xs font-medium text-slate-500">
                        {(editableResult.confidence * 100).toFixed(0)}% Match
                      </span>
                    )}
                  </div>
                </div>

                {/* Packaging Dates & Indicators Box */}
                <div className="p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Extracted Packaging Dates</span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        by model YOLOv8
                      </span>
                    </div>
                    {editableResult.ocr_raw_text && (
                      <button
                        type="button"
                        onClick={() => setShowOcrDetails(!showOcrDetails)}
                        className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        <span>{showOcrDetails ? 'Hide OCR Stream' : 'View OCR Stream'}</span>
                        {showOcrDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-md bg-white dark:bg-slate-900 border border-indigo-100/60 dark:border-indigo-900/40">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                        Manufacturing Date
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {editableResult.manufacturing_date || (
                          <span className="text-slate-400 font-normal italic">Not printed on packaging</span>
                        )}
                      </span>
                    </div>

                    <div className="p-2 rounded-md bg-white dark:bg-slate-900 border border-indigo-100/60 dark:border-indigo-900/40">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                        Expiry Date
                      </span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {editableResult.expiry_date || (
                          <span className="text-slate-400 font-normal italic">Not printed on packaging</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Located markers chips */}
                  {editableResult.detected_keywords && editableResult.detected_keywords.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                      <span className="text-slate-500 font-medium">Detected Markers:</span>
                      {editableResult.detected_keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-medium text-[10px]"
                        >
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Raw OCR Text Viewer */}
                  {showOcrDetails && editableResult.ocr_raw_text && (
                    <div className="mt-2 p-2.5 rounded-md bg-slate-900 text-slate-200 font-mono text-[10px] max-h-28 overflow-y-auto leading-relaxed border border-slate-800">
                      <div className="text-slate-400 text-[9px] mb-1 uppercase font-sans font-bold">
                        Raw Packaging OCR Stream:
                      </div>
                      {editableResult.ocr_raw_text}
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verify or edit extracted packaging attributes before saving:
                </p>

                {/* Editable Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <Input
                    label="Product Name"
                    value={editableResult.product_name || ''}
                    onChange={(e) =>
                      setEditableResult({ ...editableResult, product_name: e.target.value })
                    }
                  />
                  <Input
                    label="Brand"
                    value={editableResult.brand || ''}
                    onChange={(e) =>
                      setEditableResult({ ...editableResult, brand: e.target.value })
                    }
                  />
                  <Input
                    label="Category"
                    value={editableResult.category || ''}
                    onChange={(e) =>
                      setEditableResult({ ...editableResult, category: e.target.value })
                    }
                  />
                  <Input
                    label="Barcode"
                    value={editableResult.barcode || ''}
                    onChange={(e) =>
                      setEditableResult({ ...editableResult, barcode: e.target.value })
                    }
                  />
                  <Input
                    label="Estimated MRP (₹)"
                    type="number"
                    value={editableResult.mrp ?? ''}
                    onChange={(e) =>
                      setEditableResult({
                        ...editableResult,
                        mrp: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                  <Input
                    label="Purchase Price (₹)"
                    type="number"
                    value={editableResult.purchase_price ?? ''}
                    onChange={(e) =>
                      setEditableResult({
                        ...editableResult,
                        purchase_price: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                  <div>
                    <Input
                      label="Expiry Date"
                      type="date"
                      value={editableResult.expiry_date || ''}
                      onChange={(e) =>
                        setEditableResult({ ...editableResult, expiry_date: e.target.value })
                      }
                    />
                    {editableResult.expiry_date && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Validated by model YOLOv8
                      </span>
                    )}
                  </div>
                  <div>
                    <Input
                      label="Mfg Date"
                      type="date"
                      value={editableResult.manufacturing_date || ''}
                      onChange={(e) =>
                        setEditableResult({ ...editableResult, manufacturing_date: e.target.value })
                      }
                    />
                    {editableResult.manufacturing_date && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Validated by model YOLOv8
                      </span>
                    )}
                  </div>
                  <Input
                    label="Batch / Lot #"
                    value={editableResult.batch_number || ''}
                    onChange={(e) =>
                      setEditableResult({ ...editableResult, batch_number: e.target.value })
                    }
                  />
                  <Input
                    label="Net Wt / Vol"
                    value={editableResult.weight || ''}
                    onChange={(e) =>
                      setEditableResult({ ...editableResult, weight: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-indigo-100 dark:border-indigo-900/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                  >
                    Rescan
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApply}
                    >
                      Fill Form Only
                    </Button>
                    {onSaveDirectly ? (
                      <Button
                        size="sm"
                        isLoading={isSavingDirect}
                        onClick={async () => {
                          const finalData = editableResult || extractedData
                          if (finalData) {
                            setIsSavingDirect(true)
                            try {
                              await onSaveDirectly(finalData, selectedFile || undefined)
                            } finally {
                              setIsSavingDirect(false)
                            }
                          }
                        }}
                        leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      >
                        Confirm & Save Product
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleApply}
                        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                      >
                        Confirm & Populate Form
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
                <span>{errorMessage}</span>
                <Button size="sm" variant="outline" onClick={handleReset}>
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
