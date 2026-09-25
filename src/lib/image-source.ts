import { IMAGE_APIS, IMAGE_JSON_APIS } from '@/config'

type ImageSource = { kind: 'direct' | 'json'; api: string }

const IMAGE_EXTENSIONS = /\.(?:jpe?g|png|webp|gif|avif)$/i
const JSON_TIMEOUT_MS = 10_000

function findImageUrl(value: unknown): string | null {
  const queue: unknown[] = [value]

  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index]

    if (typeof item === 'string') {
      try {
        const url = new URL(item)
        if ((url.protocol === 'http:' || url.protocol === 'https:') && IMAGE_EXTENSIONS.test(url.pathname)) {
          return url.toString()
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
    ...IMAGE_APIS.map((api) => ({ kind: 'direct' as const, api })),
    ...IMAGE_JSON_APIS.map((api) => ({ kind: 'json' as const, api })),
  ]
}

async function resolveJsonImageUrl(api: string, signal: AbortSignal): Promise<string | null> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  const timeout = window.setTimeout(abort, JSON_TIMEOUT_MS)
  signal.addEventListener('abort', abort, { once: true })

  try {
    const response = await fetch(withCacheBuster(api), { cache: 'no-store', signal: controller.signal })
    if (!response.ok) return null
    const data: unknown = await response.json()
    const imageUrl = findImageUrl(data)
    if (!imageUrl) return null

    const url = new URL(imageUrl)
    if (window.location.protocol === 'https:' && url.protocol === 'http:') url.protocol = 'https:'
    return url.toString()
  } catch {
    return null
  } finally {
    window.clearTimeout(timeout)
    signal.removeEventListener('abort', abort)
  }
}

// Each source is drawn at most once per round. Image validation happens in the viewer with new Image().
export async function* randomCandidateImageUrlsForRound(signal: AbortSignal): AsyncGenerator<string> {
  const remainingSources = buildImageSources()

  while (remainingSources.length > 0) {
    if (signal.aborted) return
    const sourceIndex = Math.floor(Math.random() * remainingSources.length)
    const [source] = remainingSources.splice(sourceIndex, 1)

    try {
      const url = source.kind === 'direct' ? withCacheBuster(source.api) : await resolveJsonImageUrl(source.api, signal)

      if (url) yield url
    } catch {
      if (signal.aborted) return
    }
  }
}
