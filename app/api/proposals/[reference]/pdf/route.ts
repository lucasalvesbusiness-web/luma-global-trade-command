import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';
import { repositories } from '@/server/repositories';
import { renderProposalPdf } from '@/server/services/proposal-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { reference } = await params;
  const detail = await repositories.proposal.findByReference(reference);
  if (!detail) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // Authorize: staff/admin can read any; buyer can only read their own.
  const role = session.user.role;
  if (role === 'BUYER') {
    const buyer = await db.buyer.findUnique({
      where: { userId: session.user.id },
      select: { companyId: true },
    });
    if (!buyer || buyer.companyId !== detail.buyerCompany.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  } else if (role !== 'STAFF' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const pdf = await renderProposalPdf(detail);
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="proposal-${detail.reference}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
