import { useRef } from "react"
import { UploadIcon, Music2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatFileSize } from "../service/audio-metadata"

interface AudioUploadProps {
  file?: File | null
  disabled?: boolean
  onChange: (file: File | null) => void
}

export function AudioUpload({ file, disabled, onChange }: AudioUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-primary">
            <Music2Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Local audio preview</p>
            <p className="text-sm text-muted-foreground">Select an audio file to extract metadata directly in your browser.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            disabled={disabled}
            className="sr-only"
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={disabled}>
            <UploadIcon className="mr-2 h-4 w-4" />
            Choose audio
          </Button>
          {file && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onChange(null)
                if (inputRef.current) inputRef.current.value = ""
              }}
              className="text-muted-foreground"
            >
              <XIcon className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {file && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-background/80 p-3 text-sm text-muted-foreground">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-white truncate">{file.name}</span>
            <span>{formatFileSize(file.size)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
