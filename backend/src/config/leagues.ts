/**
 * Ligas monitoradas pelo sistema.
 * Slugs compatíveis com a The Odds API v4.
 */
export const MONITORED_LEAGUES: string[] = [
  'soccer_brazil_campeonato',
  'soccer_brazil_serie_b',
  'soccer_epl',
  'soccer_spain_la_liga',
  'soccer_germany_bundesliga',
  'soccer_italy_serie_a',
  'soccer_france_ligue_one',
  'soccer_uefa_champs_league',
  'soccer_uefa_europa_league',
  'soccer_conmebol_libertadores',
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
