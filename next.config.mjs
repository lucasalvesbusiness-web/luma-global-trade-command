import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

// CSP: deployed in Report-Only mode first. Flip CSP_ENFORCE=1 to enforce
// once Sentry/Mapbox/Vercel insights are confirmed in violation reports.
const cspEnforce = process.env.CSP_ENFORCE === '1';

const csp = [
  "default-src 'self'",
  // Next.js needs unsafe-inline/unsafe-eval in dev; production builds avoid eval.
  process.env.NODE_ENV === 'production'
    ? "script-src 'self' 'unsafe-inline' https://api.mapbox.com https://*.vercel-insights.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com",
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
  "img-src 'self' data: blob: https://api.mapbox.com https://*.tiles.mapbox.com https://*.public.blob.vercel-storage.com https://images.unsplash.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.upstash.io https://*.ingest.sentry.io https://*.vercel-insights.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  {
    key: cspEnforce ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
    value: csp,
  },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), geolocation=(), microphone=(), payment=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.mapbox.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@react-three/drei'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: '/company/:slug', destination: '/c/:slug', permanent: true },
      { source: '/company/edit', destination: '/c/edit', permanent: true },
      { source: '/deals', destination: '/d', permanent: true },
      { source: '/deals/:id', destination: '/d/:id', permanent: true },
      { source: '/discover', destination: '/explore', permanent: true },
      { source: '/onboarding', destination: '/start', permanent: true },
      { source: '/reviews/pending', destination: '/inbox', permanent: true },
    ];
  },
};

const withIntl = withNextIntl(nextConfig);

const sentryEnabled = !!process.env.SENTRY_DSN;
export default sentryEnabled
  ? withSentryConfig(withIntl, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // Source-map upload only when an auth token is present in CI.
      disableLogger: true,
      hideSourceMaps: true,
    })
  : withIntl;
