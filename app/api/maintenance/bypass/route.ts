import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isLocalApiHost } from '@/lib/api-origin';
import {
  createMaintenanceBypassToken,
  MAINTENANCE_BYPASS_COOKIE,
  MAINTENANCE_BYPASS_MAX_AGE_SECONDS,
} from '@/lib/maintenance-bypass';

const bodySchema = z.object({ password: z.string().trim().min(1).max(100) }).strict();

function jsonResponse(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== request.nextUrl.origin) {
    return jsonResponse({ allowed: false }, 403);
  }

  const secret = process.env.MAINTENANCE_BYPASS_SECRET;
  if (!createMaintenanceBypassToken(secret)) {
    return jsonResponse({ allowed: false, unavailable: true }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ allowed: false }, 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonResponse({ allowed: false }, 400);

  const apiBaseUrl = isLocalApiHost(request.nextUrl.hostname)
    ? process.env.NEXT_PUBLIC_AVERON_LOCAL_API_URL || 'http://127.0.0.1:8080'
    : process.env.NEXT_PUBLIC_API_URL || 'https://averon-backend-production.up.railway.app';

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/site-settings/public/check-bypass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return jsonResponse({ allowed: false, unavailable: true }, 503);
  }

  if (!upstream.ok) {
    const status = upstream.status === 401 || upstream.status === 404 ? upstream.status : 503;
    return jsonResponse(status === 503 ? { allowed: false, unavailable: true } : { allowed: false }, status);
  }

  let result: unknown;
  try {
    result = await upstream.json();
  } catch {
    return jsonResponse({ allowed: false, unavailable: true }, 503);
  }
  if (!result || typeof result !== 'object' || !('allowed' in result) || result.allowed !== true) {
    return jsonResponse({ allowed: false, unavailable: true }, 503);
  }

  const token = createMaintenanceBypassToken(secret);
  if (!token) return jsonResponse({ allowed: false, unavailable: true }, 503);

  const response = jsonResponse({ allowed: true }, 200);
  response.cookies.set({
    name: MAINTENANCE_BYPASS_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAINTENANCE_BYPASS_MAX_AGE_SECONDS,
  });
  return response;
}
