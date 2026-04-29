import { NextResponse, type NextRequest } from 'next/server';

/**
 * Basic Auth gate para staging/preview.
 *
 * Ativa apenas se `SITE_PASSWORD` estiver setado no ambiente — sem isso
 * (ex.: dev local), todas as requisições passam direto.
 *
 * Username default é 'luma' (override via `SITE_USERNAME`).
 *
 * Não interfere com Auth.js: o magic link em e-mail abre o browser, que
 * pede o Basic Auth uma vez (cacheado pelo browser), depois o callback
 * NextAuth roda normalmente.
 */
export function middleware(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const username = process.env.SITE_USERNAME ?? 'luma';

  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
      try {
        const decoded = atob(encoded);
        const idx = decoded.indexOf(':');
        if (idx !== -1) {
          const user = decoded.slice(0, idx);
          const pass = decoded.slice(idx + 1);
          if (user === username && pass === password) {
            return NextResponse.next();
          }
        }
      } catch {
        // malformed header — fall through to 401
      }
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Luma Staging"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export const config = {
  matcher: [
    // Tudo exceto assets estáticos e internals Next.
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
