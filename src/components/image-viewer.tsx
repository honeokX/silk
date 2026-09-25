'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SITE } from '@/config'
import { randomCandidateImageUrlsForRound } from '@/lib/image-source'

type ViewerStatus = 'loading-first' | 'loading-next' | 'ready' | 'error-first' | 'error-next'

const PRELOAD_TIMEOUT_MS = 12_000

function preloadImage(url: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.className = 'stage-image'
    image.alt = SITE.title
    image.decoding = 'async'

    const cleanup = () => {
      window.clearTimeout(timeout)
      signal.removeEventListener('abort', abort)
      image.onload = null
      image.onerror = null
    }
    const fail = () => {
      cleanup()
      image.src = ''
      reject(new Error('Image failed to load'))
    }
    const abort = () => fail()
    const timeout = window.setTimeout(fail, PRELOAD_TIMEOUT_MS)

    image.onload = () => {
      cleanup()
      if (image.naturalWidth > 0) resolve(image)
      else reject(new Error('Image is empty'))
    }
    image.onerror = fail
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) {
      fail()
      return
    }
    image.src = url
  })
}

async function loadRandomAvailableImage(signal: AbortSignal): Promise<HTMLImageElement | null> {
  for await (const url of randomCandidateImageUrlsForRound(signal)) {
    try {
      return await preloadImage(url, signal)
    } catch {
      if (signal.aborted) return null
    }
  }
  return null
}

export default function ImageViewer() {
  const imageHostRef = useRef<HTMLDivElement>(null)
  const displayedRef = useRef<HTMLImageElement | null>(null)
  const readyRef = useRef<HTMLImageElement | null>(null)
  const pendingRef = useRef<Promise<HTMLImageElement | null> | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const busyRef = useRef(false)
  const runIdRef = useRef(0)
  const [status, setStatus] = useState<ViewerStatus>('loading-first')

  const prepareNextImage = useCallback((): Promise<HTMLImageElement | null> => {
    if (readyRef.current) return Promise.resolve(readyRef.current)
    if (pendingRef.current) return pendingRef.current

    const controller = new AbortController()
    controllerRef.current = controller
    const pending = loadRandomAvailableImage(controller.signal)
      .then((image) => {
        if (!controller.signal.aborted && image) readyRef.current = image
        return controller.signal.aborted ? null : image
      })
      .finally(() => {
        if (pendingRef.current === pending) {
          pendingRef.current = null
          controllerRef.current = null
        }
      })
    pendingRef.current = pending
    return pending
  }, [])

  const showImage = useCallback(
    (image: HTMLImageElement) => {
      const host = imageHostRef.current
      if (!host) return

      // Reuse the validated <img>; a second request to a random API could return a different image.
      host.appendChild(image)
      displayedRef.current?.remove()
      displayedRef.current = image
      readyRef.current = null
      setStatus('ready')
      void prepareNextImage()
    },
    [prepareNextImage],
  )

  const loadAndShowNextImage = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    const runId = ++runIdRef.current
    const hasImage = displayedRef.current !== null
    setStatus(hasImage ? 'loading-next' : 'loading-first')

    try {
      const image = await prepareNextImage()
      if (runId !== runIdRef.current) return
      if (image) showImage(image)
      else setStatus(hasImage ? 'error-next' : 'error-first')
    } finally {
      if (runId === runIdRef.current) busyRef.current = false
    }
  }, [prepareNextImage, showImage])

  useEffect(() => {
    void loadAndShowNextImage()
    return () => {
      runIdRef.current += 1
      controllerRef.current?.abort()
      pendingRef.current = null
      readyRef.current = null
      busyRef.current = false
      displayedRef.current?.remove()
      displayedRef.current = null
    }
  }, [loadAndShowNextImage])

  const loading = status === 'loading-first' || status === 'loading-next'
  const message =
    status === 'error-first' || status === 'error-next'
      ? '图片加载失败，请重试'
      : loading
        ? status === 'loading-first'
          ? '正在加载图片'
          : '正在加载下一张'
        : '\u00a0'

  return (
    <>
      <div className="image-stage" aria-busy={loading}>
        <div className="image-host" ref={imageHostRef} />
      </div>
      <div className="tips" role="status">
        {message}
      </div>
      <div className="actions">
        <button type="button" onClick={loadAndShowNextImage} disabled={loading}>
          {loading ? '加载中' : '下一张'}
        </button>
      </div>
    </>
  )
}
