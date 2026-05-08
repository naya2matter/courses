import { useEffect, useState } from "react"

import {
  extractAudioMetadata,
  extractAudioMetadataFromUrl,
  type AudioMetadata,
} from "../service/audio-metadata"

export function useAudioMetadata(file?: File, remoteUrl?: string) {
  const [metadata, setMetadata] = useState<AudioMetadata>({})
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)

  useEffect(() => {
    let isActive = true
    let objectUrlToRevoke: string | null = null

    async function loadMetadata() {
      setMetadata({})
      setIsLoadingMetadata(true)

      if (file) {
        const extracted = await extractAudioMetadata(file)

        if (!isActive) {
          if (extracted.url?.startsWith("blob:")) {
            URL.revokeObjectURL(extracted.url)
          }
          return
        }

        if (extracted.url?.startsWith("blob:")) {
          objectUrlToRevoke = extracted.url
        }

        setMetadata(extracted)
        setIsLoadingMetadata(false)
        return
      }

      const normalizedUrl = remoteUrl?.trim() || ""
      if (normalizedUrl) {
        if (isActive) {
          setMetadata({ url: normalizedUrl })
        }

        const extracted = await extractAudioMetadataFromUrl(normalizedUrl)
        if (isActive) {
          setMetadata(extracted)
        }
      }

      if (isActive) {
        setIsLoadingMetadata(false)
      }
    }

    loadMetadata()

    return () => {
      isActive = false
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke)
      }
    }
  }, [file, remoteUrl])

  return { metadata, isLoadingMetadata }
}
