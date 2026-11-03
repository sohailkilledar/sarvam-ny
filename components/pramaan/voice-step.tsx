"use client"

import { useRef, useState } from "react"
import { Loader2, Mic, Square, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LANGUAGES, type ExtractedField, type LanguageCode } from "@/lib/types"

type Props = {
  fields: ExtractedField[]
  language: LanguageCode
  onLanguage: (code: LanguageCode) => void
  busy: boolean
  onSubmit: (audio: File) => void
}

export function VoiceStep({ fields, language, onLanguage, busy, onSubmit }: Props) {
  const [recording, setRecording] = useState(false)
  const [audio, setAudio] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)

  const name = fields.find((f) => f.key === "holder_name")?.value
  const identifier = fields.find((f) => f.key === "property_identifier" || f.key === "document_number")?.value

  function setClip(file: File) {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudio(file)
    setAudioUrl(URL.createObjectURL(file))
  }

  async function start() {
    setMicError(null)
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("Recording is not supported in this browser")
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const preferredType = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"]
        .find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined)
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      recorder.onerror = () => {
        stream.getTracks().forEach((t) => t.stop())
        setMicError("The recording could not be completed. Please try again or upload an audio file.")
        setRecording(false)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const rawType = recorder.mimeType || preferredType || "audio/webm"
        const type = rawType.split(";")[0].trim().toLowerCase()
        const ext = type === "audio/mp4" ? "m4a" : type === "audio/ogg" ? "ogg" : "webm"
        const blob = new Blob(chunks, { type })
        if (!blob.size) {
          setMicError("No audio was recorded. Please try again.")
          return
        }
        setClip(new File([blob], `attestation.${ext}`, { type }))
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
    } catch {
      setMicError("Microphone unavailable here. Open the app in a new tab, or upload a recording instead.")
    }
  }

  function stop() {
    recorderRef.current?.stop()
    recorderRef.current = null
    setRecording(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Speak in</legend>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => onLanguage(l.code)}
              aria-pressed={language === l.code}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                language === l.code ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50"
              }`}
            >
              {l.native}
              <span className="sr-only"> ({l.label})</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="rounded-lg border bg-accent/40 px-4 py-3 text-sm leading-relaxed">
        <p className="font-medium text-accent-foreground">Say something like:</p>
        <p className="mt-1 text-pretty">
          {`"My name is ${name ?? "…"}${identifier ? `, and this document for ${identifier} belongs to me` : " and this document belongs to me"}."`}
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-lg border bg-card px-6 py-8">
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={busy}
          aria-label={recording ? "Stop recording" : "Start recording"}
          className={`flex size-20 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
            recording ? "animate-pulse bg-destructive text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {recording ? <Square className="size-7" aria-hidden="true" /> : <Mic className="size-8" aria-hidden="true" />}
        </button>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {recording ? "Recording… tap to stop" : audio ? "Recording ready" : "Tap to record your attestation"}
        </p>
        {audioUrl && <audio src={audioUrl} controls className="w-full max-w-sm" />}
        {micError && <p className="text-center text-sm text-destructive">{micError}</p>}
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline">
          <Upload className="size-3.5" aria-hidden="true" />
          Upload an audio file instead
          <input
            type="file"
            accept="audio/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setClip(file)
              e.target.value = ""
            }}
          />
        </label>
      </div>

      <Button size="lg" disabled={!audio || busy || recording} onClick={() => audio && onSubmit(audio)}>
        {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
        {busy ? "Transcribing and checking claims…" : "Verify my attestation"}
      </Button>
    </div>
  )
}
