import { NextResponse } from 'next/server';

import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  let dbOk = false;
  let dbMs: number | null = null;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
    dbMs = Date.now() - start;
  } catch {
    dbOk = false;
  }

  const body = {
    ok: dbOk,
    db: { ok: dbOk, ms: dbMs },
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: dbOk ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
