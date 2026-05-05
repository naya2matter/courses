export type AudioMetadata = {
  url?: string
  mimeType?: string
  fileSize?: number
  fileSizeFormatted?: string
  duration?: number
  durationFormatted?: string
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "—"

  const units = ["Bytes", "KB", "MB", "GB"] as const
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  if (unitIndex === 0) return `${Math.round(value)} ${units[unitIndex]}`
  return `${value.toFixed(2)} ${units[unitIndex]}`
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "—"

  const totalSeconds = Math.floor(seconds)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${String(secs).padStart(2, "0")}`
}

export async function extractAudioMetadata(file: File): Promise<AudioMetadata> {
  const objectUrl = URL.createObjectURL(file)

  const duration = await new Promise<number | undefined>((resolve) => {
    const audio = document.createElement("audio")
    audio.preload = "metadata"
    audio.src = objectUrl

    audio.onloadedmetadata = () => {
      const parsed = Number.isFinite(audio.duration) ? audio.duration : undefined
      audio.removeAttribute("src")
      audio.load()
      resolve(parsed)
    }

    audio.onerror = () => {
      audio.removeAttribute("src")
      audio.load()
      resolve(undefined)
    }
  })

  return {
    url: objectUrl,
    mimeType: file.type?.trim() ? file.type : "Unknown",
    fileSize: Number.isFinite(file.size) ? file.size : undefined,
    fileSizeFormatted: Number.isFinite(file.size) ? formatFileSize(file.size) : undefined,
    duration,
    durationFormatted: duration != null ? formatDuration(duration) : undefined,
  }
}

export async function extractAudioMetadataFromUrl(url: string): Promise<AudioMetadata> {
  if (!url?.trim()) return {}

  const metadata: AudioMetadata = { url }

  try {
    const response = await fetch(url, { method: "HEAD" })
    if (!response.ok) return metadata

    const contentType = response.headers.get("content-type")?.trim()
    const contentLength = response.headers.get("content-length")

    if (contentType) {
      metadata.mimeType = contentType
    }

    if (contentLength) {
      const parsedSize = Number.parseInt(contentLength, 10)
      if (Number.isFinite(parsedSize) && parsedSize >= 0) {
        metadata.fileSize = parsedSize
        metadata.fileSizeFormatted = formatFileSize(parsedSize)
      }
    }
  } catch {
    // CORS or network errors are intentionally ignored to keep the UI resilient.
  }

  return metadata
}
