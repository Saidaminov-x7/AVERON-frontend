export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    environment: process.env.VERCEL_ENV ?? null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
