/**
 * Ligas monitoradas pelo sistema.
 * Slugs compatíveis com a The Odds API v4.
 *
 * PLANO FREE TIER: 15 ligas com polling 1x/dia (24h).
 *   15 ligas × 1 poll/dia × 30 dias = 450 req/mês
 *   Limite do plano free: 500 req/mês → margem de segurança: 50 req
 *
 * Para ajustar conforme o plano:
 *   Free  (500 req/mês)  → 15 ligas, POLLING_INTERVAL_SECONDS=86400 (24h)
 *   Starter (10k req/mês) → 15 ligas, POLLING_INTERVAL_SECONDS=300  (5min)
 *   Pro   (30k req/mês)  → 15 ligas, POLLING_INTERVAL_SECONDS=60   (1min)
 */
export const MONITORED_LEAGUES: string[] = [
  // Brasil
  'soccer_brazil_campeonato',
  'soccer_brazil_serie_b',
  // Europa — Top 5
  'soccer_epl',
  'soccer_spain_la_liga',
  'soccer_germany_bundesliga',
  'soccer_italy_serie_a',
  'soccer_france_ligue_one',
  // Europa — Copas
  'soccer_uefa_champs_league',
  'soccer_uefa_europa_league',
  // América do Sul
  'soccer_conmebol_libertadores',
  'soccer_conmebol_copa_sudamericana',
  'soccer_argentina_primera_division',
  // Outros
  'soccer_portugal_primeira_liga',
  'soccer_netherlands_eredivisie',
  'soccer_turkey_super_league',
];

/** Mapa slug → nome exibível */
export const LEAGUE_LABELS: Record<string, string> = {
  soccer_brazil_campeonato:          'Brasileirão Série A',
  soccer_brazil_serie_b:             'Brasileirão Série B',
  soccer_epl:                        'Premier League',
  soccer_spain_la_liga:              'La Liga',
  soccer_germany_bundesliga:         'Bundesliga',
  soccer_italy_serie_a:              'Serie A',
  soccer_france_ligue_one:           'Ligue 1',
  soccer_uefa_champs_league:         'Champions League',
  soccer_uefa_europa_league:         'Europa League',
  soccer_conmebol_libertadores:      'Copa Libertadores',
  soccer_conmebol_copa_sudamericana: 'Copa Sul-Americana',
  soccer_argentina_primera_division: 'Primera División (ARG)',
  soccer_portugal_primeira_liga:     'Primeira Liga (POR)',
  soccer_netherlands_eredivisie:     'Eredivisie',
  soccer_turkey_super_league:        'Süper Lig',
};

export function getLeagueLabel(slug: string): string {
  return LEAGUE_LABELS[slug] ?? slug;
}
