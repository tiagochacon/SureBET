/**
 * Ligas monitoradas pelo sistema.
 * Slugs compatíveis com a The Odds API v4.
 *
 * PLANO FREE TIER: limitado a 3 ligas com polling a cada 2h.
 * Para adicionar mais ligas, faça upgrade do plano em https://the-odds-api.com
 * e ajuste POLLING_INTERVAL_SECONDS no .env conforme a tabela abaixo:
 *
 *   Plano Free  (500 req/mês)  → 3 ligas,  POLLING_INTERVAL_SECONDS=7200  (2h)
 *   Plano Starter (10k req/mês) → 10 ligas, POLLING_INTERVAL_SECONDS=300   (5min)
 *   Plano Pro   (30k req/mês)  → 10 ligas, POLLING_INTERVAL_SECONDS=60    (1min)
 */
export const MONITORED_LEAGUES: string[] = [
  'soccer_brazil_campeonato',
  'soccer_epl',
  'soccer_uefa_champs_league',
];

/** Mapa slug → nome exibível */
export const LEAGUE_LABELS: Record<string, string> = {
  soccer_brazil_campeonato: 'Brasileirão Série A',
  soccer_brazil_serie_b: 'Brasileirão Série B',
  soccer_epl: 'Premier League',
  soccer_spain_la_liga: 'La Liga',
  soccer_germany_bundesliga: 'Bundesliga',
  soccer_italy_serie_a: 'Serie A',
  soccer_france_ligue_one: 'Ligue 1',
  soccer_uefa_champs_league: 'Champions League',
  soccer_uefa_europa_league: 'Europa League',
  soccer_conmebol_libertadores: 'Copa Libertadores',
};

export function getLeagueLabel(slug: string): string {
  return LEAGUE_LABELS[slug] ?? slug;
}
