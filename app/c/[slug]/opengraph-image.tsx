import { ImageResponse } from 'next/og';

import { db } from '@/lib/db';
import { computeReputation } from '@/server/services/reputation';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = 'Lastro · perfil de empresa';

const CARBON = '#1C1C1C';
const SHADOW = '#282828';
const DUST = '#D0D0D0';
const STEEL = '#A0A0A0';
const AMBER = '#C9A968';
const AMBER_GLOW = '#E5C893';

const display = 'Chakra Petch, ui-sans-serif, system-ui, sans-serif';
const mono = 'IBM Plex Mono, ui-monospace, monospace';
const sans = 'Inter, ui-sans-serif, system-ui, sans-serif';

export default async function OG({ params }: { params: { slug: string } }) {
  const company = await db.company.findUnique({
    where: { slug: params.slug },
    select: {
      legalName: true,
      tradeName: true,
      verificationStatus: true,
      city: true,
      state: true,
      id: true,
    },
  });

  if (!company) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            background: CARBON,
            color: DUST,
            fontFamily: display,
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
          }}
        >
          Empresa não encontrada
        </div>
      ),
      { ...size },
    );
  }

  const rep = await computeReputation(company.id).catch(() => null);
  const name = company.tradeName ?? company.legalName;
  const verifLabel: Record<string, string> = {
    DOC_VERIFIED: 'verificada',
    EMAIL_VERIFIED: 'email verificado',
    UNVERIFIED: 'não verificada',
  };
  const verifColor = company.verificationStatus === 'DOC_VERIFIED' ? AMBER_GLOW : STEEL;
  const location = company.city
    ? `${company.city}${company.state ? ` · ${company.state}` : ''}`
    : null;

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
            /c/{params.slug}
          </span>
        </div>

        <div
          style={{
            marginTop: 80,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
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
            {name.length > 36 ? name.slice(0, 36) + '…' : name}
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
              {verifLabel[company.verificationStatus] ?? company.verificationStatus}
            </span>
            {location && (
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 18,
                  color: STEEL,
                }}
              >
                {location}
              </span>
            )}
          </div>
        </div>

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
          <Metric
            label="Negócios concluídos"
            value={String(rep?.confirmedDealsCount ?? 0)}
          />
          <Metric
            label="Avaliação"
            value={rep?.avgRating !== null && rep?.avgRating !== undefined ? rep.avgRating.toFixed(1) : '—'}
          />
          <Metric
            label="Status"
            value={(verifLabel[company.verificationStatus] ?? '').toUpperCase()}
          />
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
