import type { NextRequest } from 'next/server'

const ALLOWED_HOSTS = new Set([
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
])

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('u')
  if (!raw) return new Response('Missing url', { status: 400 })

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) {
    return new Response('Forbidden host', { status: 403 })
  }

  const upstream = await fetch(target.toString(), {
    headers: { Accept: 'image/*' },
    cache: 'no-store',
  })
  if (!upstream.ok) {
    return new Response('Upstream error', { status: 502 })
  }

  const body = await upstream.arrayBuffer()
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
    },
  })
}
