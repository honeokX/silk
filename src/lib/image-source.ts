import { imageApis, imageJsonApis } from '@/config'

type ImageSource = { kind: 'direct' | 'json'; api: string }

const imageExtensions = /\.(?:jpe?g|png|webp|gif|avif)$/i
const jsonTimeoutMs = 10_000

function findImageUrl(value: unknown): string | null {
  const queue: unknown[] = [value]

  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index]

    if (typeof item === 'string') {
      try {
        const url = new URL(item)
        if ((url.protocol === 'http:' || url.protocol === 'https:') && imageExtensions.test(url.pathname)) {
          return item
        }
      } catch {
        // A non-URL string may be ordinary JSON metadata.
      }
    } else if (Array.isArray(item)) {
      queue.push(...item)
    } else if (item !== null && typeof item === 'object') {
      queue.push(...Object.values(item))
    }
  }

  return null
}

function withCacheBuster(api: string): string {
  const url = new URL(api)
  url.searchParams.set('_t', `${Date.now()}-${Math.random().toString(36).slice(2)}`)
  return url.toString()
}

function buildImageSources(): ImageSource[] {
  return [
    ...imageApis.map((api) => ({ kind: 'direct' as const, api })),
    ...imageJsonApis.map((api) => ({ kind: 'json' as const, api })),
  ]
}

async function resolveJsonImageUrl(api: string, signal: AbortSignal, timeoutMs: number): Promise<string | null> {
  if (signal.aborted) return null
  const controller = new AbortController()
  let rejectTimeout: ((error: Error) => void) | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    rejectTimeout = reject
  })
  const abort = () => {
    controller.abort()
    rejectTimeout?.(new Error('JSON image request timed out'))
  }
  const timeout = window.setTimeout(abort, timeoutMs)
  signal.addEventListener('abort', abort, { once: true })

  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(withCacheBuster(api), { cache: 'no-store', signal: controller.signal })
        if (!response.ok) return null
        const data: unknown = await response.json()
        return findImageUrl(data)
      })(),
      timeoutPromise,
    ])
  } catch {
    return null
  } finally {
    window.clearTimeout(timeout)
    signal.removeEventListener('abort', abort)
  }
}

// Each source is drawn at most once per round. Image validation happens in the viewer with new Image().
export async function* randomCandidateImageUrlsForRound(
  signal: AbortSignal,
  deadline = Number.POSITIVE_INFINITY,
): AsyncGenerator<string> {
  const remainingSources = buildImageSources()

  while (remainingSources.length > 0) {
    if (signal.aborted || Date.now() >= deadline) return
    const sourceIndex = Math.floor(Math.random() * remainingSources.length)
    const [source] = remainingSources.splice(sourceIndex, 1)

    try {
      const url =
        source.kind === 'direct'
          ? withCacheBuster(source.api)
          : await resolveJsonImageUrl(source.api, signal, Math.min(jsonTimeoutMs, deadline - Date.now()))

      if (url) yield url
    } catch {
      if (signal.aborted) return
    }
  }
}
