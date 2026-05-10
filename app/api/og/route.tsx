import { ImageResponse } from 'next/og';

import { db } from '@/lib/db';
import { computeReputation } from '@/server/services/reputation';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

const CARBON = '#1C1C1C';
const SHADOW = '#282828';
const DUST = '#D0D0D0';
const STEEL = '#A0A0A0';
const AMBER = '#C9A968';
const AMBER_GLOW = '#E5C893';

const display = 'Chakra Petch, ui-sans-serif, system-ui, sans-serif';
const mono = 'IBM Plex Mono, ui-monospace, monospace';
const sans = 'Inter, ui-sans-serif, system-ui, sans-serif';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('c');

  if (slug) {
    const company = await db.company.findUnique({
      where: { slug },
      select: {
        legalName: true,
        tradeName: true,
        verificationStatus: true,
        city: true,
        state: true,
        id: true,
      },
    });
    if (company) {
      const rep = await computeReputation(company.id).catch(() => null);
      return renderCompanyCard({
        name: company.tradeName ?? company.legalName,
        slug,
        verification: company.verificationStatus,
        location: company.city
          ? `${company.city}${company.state ? ` · ${company.state}` : ''}`
          : null,
        confirmedDeals: rep?.confirmedDealsCount ?? 0,
        avgRating: rep?.avgRating ?? null,
      });
    }
  }

  return renderLanding();
}

function renderLanding() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: CARBON,
          fontFamily: sans,
          color: DUST,
          padding: 64,
          position: 'relative',
        }}
      >
        {/* Grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            display: 'flex',
          }}
        />
        {/* Top mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: AMBER,
              boxShadow: `0 0 24px ${AMBER}`,
            }}
          />
          <span
            style={{
              fontFamily: display,
              fontWeight: 600,
              fontSize: 32,
              color: '#ECECEC',
              letterSpacing: '-0.01em',
            }}
          >
            Lastro
          </span>
          <span
            style={{
              fontFamily: mono,
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: STEEL,
              marginLeft: 12,
            }}
          >
            · Rede de Confiança Transacional B2B
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            position: 'relative',
          }}
        >
          <h1
            style={{
              fontFamily: display,
              fontSize: 96,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: '#ECECEC',
              margin: 0,
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            <span>Confiança não é</span>
            <span style={{ color: AMBER_GLOW, marginLeft: 18 }}>discurso.</span>
          </h1>
          <p
            style={{
              fontFamily: display,
              fontSize: 64,
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: '-0.01em',
              color: DUST,
              marginTop: 8,
            }}
          >
            É evidência auditável.
          </p>

          {/* Tags row */}
          <div
            style={{
              marginTop: 56,
              display: 'flex',
              gap: 36,
              fontFamily: mono,
              fontSize: 18,
              color: STEEL,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
            }}
          >
            {['00 · Identidade', '01 · Descoberta', '02 · Deal room', '03 · Reputação'].map(
              (t) => (
                <span key={t} style={{ display: 'flex', alignItems: 'center' }}>
                  {t}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function renderCompanyCard(c: {
  name: string;
  slug: string;
  verification: string;
  location: string | null;
  confirmedDeals: number;
  avgRating: number | null;
}) {
  const verifLabel: Record<string, string> = {
    DOC_VERIFIED: 'verificada',
    EMAIL_VERIFIED: 'email verificado',
    UNVERIFIED: 'não verificada',
  };
  const verifColor = c.verification === 'DOC_VERIFIED' ? AMBER_GLOW : STEEL;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(180deg, ${CARBON} 0%, ${SHADOW} 100%)`,
          fontFamily: sans,
          color: DUST,
          padding: 64,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            display: 'flex',
          }}
        />
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: AMBER,
                boxShadow: `0 0 16px ${AMBER}`,
              }}
            />
            <span
              style={{
                fontFamily: display,
                fontWeight: 600,
                fontSize: 24,
                color: '#ECECEC',
              }}
            >
              Lastro
            </span>
          </div>
          <span
            style={{
              fontFamily: mono,
              fontSize: 14,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: STEEL,
            }}
          >
            /c/{c.slug}
          </span>
        </div>

        {/* Name */}
        <div style={{ marginTop: 80, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: mono,
              fontSize: 14,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: STEEL,
            }}
          >
            Empresa
          </span>
          <h1
            style={{
              fontFamily: display,
              fontSize: 88,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              color: '#ECECEC',
              margin: '12px 0 0 0',
            }}
          >
            {c.name.length > 36 ? c.name.slice(0, 36) + '…' : c.name}
          </h1>

          <div
            style={{
              marginTop: 20,
              display: 'flex',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                border: `1px solid ${verifColor}40`,
                background: `${verifColor}15`,
                color: verifColor,
                borderRadius: 4,
                fontFamily: mono,
                fontSize: 14,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {verifLabel[c.verification] ?? c.verification}
            </span>
            {c.location && (
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 18,
                  color: STEEL,
                }}
              >
                {c.location}
              </span>
            )}
          </div>
        </div>

        {/* HUD metrics */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            gap: 80,
            position: 'relative',
            paddingTop: 32,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Metric label="Negócios concluídos" value={String(c.confirmedDeals)} />
          <Metric
            label="Avaliação"
            value={c.avgRating !== null ? c.avgRating.toFixed(1) : '—'}
          />
          <Metric label="Status" value={(verifLabel[c.verification] ?? '').toUpperCase()} />
        </div>
      </div>
    ),
    { ...size },
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontFamily: mono,
          fontSize: 13,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: STEEL,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono,
          fontSize: 56,
          fontWeight: 500,
          color: '#ECECEC',
          letterSpacing: '0.04em',
        }}
      >
        {value}
      </span>
    </div>
  );
}
