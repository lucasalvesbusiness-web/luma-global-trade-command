import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';
import { uploadFieldPhoto } from '@/server/storage/blob';

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== 'FIELD_OPERATOR' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const plotId = url.searchParams.get('plotId');
  if (!plotId) {
    return NextResponse.json({ error: 'plotId required' }, { status: 400 });
  }

  const plot = await db.fieldPlot.findUnique({
    where: { id: plotId },
    include: { origin: true },
  });
  if (!plot) {
    return NextResponse.json({ error: 'plot not found' }, { status: 404 });
  }

  if (role === 'FIELD_OPERATOR') {
    const operator = await db.fieldOperator.findUnique({
      where: { userId: session.user.id },
    });
    if (!operator || operator.originId !== plot.originId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file required' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'file too large' }, { status: 413 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'unsupported type' }, { status: 415 });
  }

  const blob = await uploadFieldPhoto({
    originSlug: plot.origin.slug,
    fieldPlotId: plot.id,
    filename: file.name,
    body: file,
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url, pathname: blob.pathname });
}
