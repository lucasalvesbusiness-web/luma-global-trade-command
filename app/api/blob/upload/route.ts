import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

import { auth } from '@/server/auth/config';

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'BLOB_READ_WRITE_TOKEN not configured' },
      { status: 500 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/avif',
          'image/gif',
          'application/pdf',
        ],
        maximumSizeInBytes: 10 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({
          userId: session.user.id,
          pathname,
        }),
      }),
      onUploadCompleted: async () => {
        // No-op: callers persist the resulting URL via tRPC mutations.
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'upload failed' },
      { status: 400 },
    );
  }
}
