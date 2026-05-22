// ─── useChunkUpload ────────────────────────────────────────────────────────────
// React hook that implements the full chunk upload pipeline for video files.
//
// Flow:
//   1. Generate UUID v4 for the upload session.
//   2. Slice the file into 5 MB chunks.
//   3. Upload chunks sequentially via POST /admin/videos/upload-chunk.
//   4. Track progress (0-100).
//   5. On the last chunk the server returns { status: "complete", file_path, file_size }.
//   6. Return { file_path, file_size, uploadUuid } to the caller.
//
// Cancellation:
//   • Call abort() at any time to stop in-flight chunks.
//   • The hook automatically calls revertVideoUpload(uuid) to clean up temp files.
//
// Error handling:
//   • AbortError (user cancel) is silently swallowed after revert.
//   • All other errors bubble up to the caller with a readable message.

import { useCallback, useRef, useState } from "react"
import { uploadVideoChunk, revertVideoUpload } from "../service/video.service"

const CHUNK_SIZE = 5 * 1024 * 1024 // 5 MB

export interface ChunkUploadResult {
  file_path: string
  file_size: number
  uploadUuid: string
}

export interface UseChunkUploadReturn {
  /** Start uploading a file. Resolves with the server file_path and file_size. */
  upload: (file: File) => Promise<ChunkUploadResult>
  /** Cancel the current upload (triggers revert on the server). */
  abort: () => void
  /** Upload progress 0–100 */
  progress: number
  /** True while an upload is in progress */
  isUploading: boolean
  /** Error message if the last upload failed */
  uploadError: string | null
  /** UUID of the current (or last) upload session */
  currentUuid: string | null
  /** 1-based index of the chunk currently being uploaded (0 when idle) */
  currentChunk: number
  /** Total number of chunks for the current upload (0 when idle) */
  totalChunks: number
}

export function useChunkUpload(): UseChunkUploadReturn {
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [currentUuid, setCurrentUuid] = useState<string | null>(null)
  const [currentChunk, setCurrentChunk] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)

  const abortControllerRef = useRef<AbortController | null>(null)
  const activeUuidRef = useRef<string | null>(null)

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const upload = useCallback(async (file: File): Promise<ChunkUploadResult> => {
    setUploadError(null)
    setProgress(0)
    setCurrentChunk(0)
    setIsUploading(true)

    const uuid = crypto.randomUUID()
    activeUuidRef.current = uuid
    setCurrentUuid(uuid)

    const controller = new AbortController()
    abortControllerRef.current = controller

    const total = Math.max(1, Math.ceil(file.size / CHUNK_SIZE))
    setTotalChunks(total)

    try {
      for (let i = 0; i < total; i++) {
        setCurrentChunk(i + 1)
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunkBlob = file.slice(start, end)

        const response = await uploadVideoChunk(
          { file, chunkBlob, uploadUuid: uuid, chunkIndex: i, totalChunks: total },
          controller.signal,
        )

        setProgress(Math.round(((i + 1) / total) * 100))

        if (response.status === "complete") {
          if (!response.file_path) {
            throw new Error("Server returned complete status but no file_path.")
          }
          return {
            file_path: response.file_path,
            file_size: response.file_size ?? file.size,
            uploadUuid: uuid,
          }
        }
      }

      throw new Error("Upload finished without a complete response from the server.")
    } catch (err) {
      // User-initiated cancel — revert silently
      if (err instanceof DOMException && err.name === "AbortError") {
        void revertVideoUpload(uuid)
        setUploadError(null)
        throw err // let the caller detect cancellation
      }

      // Any other error — attempt revert, surface message to UI
      void revertVideoUpload(uuid)

      const message =
        err instanceof Error ? err.message : "An unexpected upload error occurred."
      setUploadError(message)
      throw new Error(message)
    } finally {
      setIsUploading(false)
      abortControllerRef.current = null
    }
  }, [])

  return { upload, abort, progress, isUploading, uploadError, currentUuid, currentChunk, totalChunks }
}
