// src/app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'https://api.mindspeak.xyz/api'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

async function proxyRequest(
  request: NextRequest,
  method: HttpMethod,
  pathSegments: string[]
): Promise<NextResponse> {
  const path = pathSegments.join('/')
  const baseUrl = `${BACKEND_URL}/${path}`
  const url =
    method === 'GET' || method === 'DELETE'
      ? `${baseUrl}${request.nextUrl.search}`
      : baseUrl

  const headers = new Headers()
  const auth = request.headers.get('authorization')
  if (auth) headers.set('Authorization', auth)
  headers.set('Accept', 'application/json')

  let body: BodyInit | undefined
  const contentType = request.headers.get('content-type') ?? ''
  if (method !== 'GET' && method !== 'DELETE') {
    if (contentType.includes('multipart/form-data')) {
      body = await request.formData()
    } else {
      headers.set('Content-Type', 'application/json')
      const parsed = await request.json().catch(() => ({}))
      body = JSON.stringify(parsed)
    }
  }

  const res = await fetch(url, { method, headers, body })
  const text = await res.text()

  let data: unknown
  try {
    data = JSON.parse(text) as unknown
  } catch {
    data = { raw: text }
  }

  return NextResponse.json(data as Record<string, unknown>, {
    status: res.status,
  })
}

export async function GET(request: NextRequest) {
  const path = request.url.split('/api/proxy/')[1].split('?')[0].split('/')
  return proxyRequest(request, 'GET', path)
}

export async function POST(request: NextRequest) {
  const path = request.url.split('/api/proxy/')[1].split('?')[0].split('/')
  return proxyRequest(request, 'POST', path)
}

export async function PUT(request: NextRequest) {
  const path = request.url.split('/api/proxy/')[1].split('?')[0].split('/')
  return proxyRequest(request, 'PUT', path)
}

export async function PATCH(request: NextRequest) {
  const path = request.url.split('/api/proxy/')[1].split('?')[0].split('/')
  return proxyRequest(request, 'PATCH', path)
}

export async function DELETE(request: NextRequest) {
  const path = request.url.split('/api/proxy/')[1].split('?')[0].split('/')
  return proxyRequest(request, 'DELETE', path)
}

export const dynamic = 'force-dynamic'
