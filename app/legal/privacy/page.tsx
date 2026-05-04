export const metadata = { title: 'Privacy Policy · Luma Global Trade Command' };

export default function PrivacyPage() {
  return (
    <>
      <p className="text-[11px] uppercase tracking-[0.3em] text-luma-olive/80">
        Placeholder — pendente de revisão jurídica Luma
      </p>
      <h1>Política de Privacidade / Privacy Policy</h1>
      <p>
        <strong>Última atualização:</strong> 2026-05-04 ·{' '}
        <em>Este texto é um placeholder técnico. A versão jurídica final será
        provida pelo counsel da Luma antes do go-live público.</em>
      </p>

      <h2>1. Quem somos / Who we are</h2>
      <p>
        Luma Global Trade Command é uma plataforma operada por Luma em parceria
        com Spectre. Esta política descreve como tratamos dados pessoais de
        compradores, operadores de campo e equipe Luma. Para questões sobre
        dados pessoais: <strong>privacy@luma.com.br</strong> (a confirmar).
      </p>

      <h2>2. Que dados coletamos / What we collect</h2>
      <ul>
        <li>Identificação: nome, e-mail corporativo, CNPJ/Tax ID.</li>
        <li>Empresa: razão social, endereço, país, telefone.</li>
        <li>Operacional: propostas submetidas, mensagens, histórico de status.</li>
        <li>
          Técnicos: IP, user-agent, logs de erro (Sentry), métricas de uso
          (Vercel Analytics).
        </li>
      </ul>

      <h2>3. Bases legais (LGPD art. 7º)</h2>
      <ul>
        <li>
          <strong>Execução de contrato:</strong> dados de propostas, status,
          empresa.
        </li>
        <li>
          <strong>Legítimo interesse:</strong> logs técnicos, prevenção de fraude.
        </li>
        <li>
          <strong>Consentimento:</strong> cookies de analytics e telemetria de
          erro (gerenciado via banner).
        </li>
      </ul>

      <h2>4. Compartilhamento</h2>
      <p>
        Dados são processados por: Vercel (hosting, EUA), Neon (Postgres,
        US/EU), Resend (e-mail, EUA), Upstash Redis (rate-limit), Sentry (erro,
        EUA), Mapbox (tiles, EUA). Transferência internacional ampara-se em
        cláusulas contratuais padrão.
      </p>

      <h2>5. Direitos do titular (LGPD art. 18)</h2>
      <p>
        Você pode solicitar acesso, correção, portabilidade, anonimização e
        eliminação dos seus dados via <strong>privacy@luma.com.br</strong>.
        Atendemos em até 30 dias (workflow inicialmente manual).
      </p>

      <h2>6. Retenção</h2>
      <p>
        Dados de propostas são mantidos enquanto a relação comercial estiver
        ativa e por 5 anos após encerramento (atender obrigações fiscais e de
        compliance). Logs técnicos: 30 dias.
      </p>

      <h2>7. Segurança</h2>
      <p>
        TLS em trânsito, criptografia em repouso (Neon + Vercel Blob), rate-limit,
        auditoria de transições, cookies de sessão HttpOnly. PII sensível
        (telefones, CNPJ) é minimizada.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Veja <a href="/legal/cookies">/legal/cookies</a>.
      </p>

      <h2>9. Alterações</h2>
      <p>
        Mudanças materiais serão comunicadas por e-mail aos cadastrados com 30
        dias de antecedência.
      </p>
    </>
  );
}
