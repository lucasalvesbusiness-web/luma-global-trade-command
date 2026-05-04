export const metadata = { title: 'Cookies · Luma Global Trade Command' };

export default function CookiesPage() {
  return (
    <>
      <h1>Cookies & rastreamento / Cookies & tracking</h1>
      <p>
        <strong>Última atualização:</strong> 2026-05-04
      </p>

      <h2>Categorias</h2>
      <h3>Essenciais (sempre ativos)</h3>
      <ul>
        <li>
          <strong>Sessão Auth.js:</strong> mantém você logado entre páginas.
        </li>
        <li>
          <strong>CSRF / consent:</strong> protege requisições e armazena sua
          escolha de cookies.
        </li>
      </ul>

      <h3>Analytics e telemetria (opt-in)</h3>
      <ul>
        <li>
          <strong>Vercel Analytics:</strong> agregados de visitação anônimos.
        </li>
        <li>
          <strong>Sentry:</strong> captura de erros e session replay para
          diagnóstico de problemas. Sem replay sem consent.
        </li>
      </ul>

      <h2>Como gerenciar</h2>
      <p>
        Use o banner exibido no primeiro acesso para aceitar ou recusar cookies
        opcionais. Você pode revogar a qualquer momento limpando o cookie
        <code>luma_consent</code> ou abrindo este link:{' '}
        <a href="?reset=1">redefinir minha escolha</a>.
      </p>

      <h2>Provedores terceiros</h2>
      <p>
        Mapbox e tiles de mapas podem setar cookies próprios para servir tiles
        com cache. Esses não rastreiam você fora da plataforma Luma GTC.
      </p>
    </>
  );
}
