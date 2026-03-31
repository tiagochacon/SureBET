/**
 * Esportes monitorados pelo sistema.
 * Slugs compatíveis com a odds-api.io.
 *
 * IMPORTANTE: com a nova API não é necessário listar ligas individuais.
 * O endpoint /arbitrage-bets cobre TODOS os esportes e mercados automaticamente
 * em uma única requisição, tornando a listagem por liga obsoleta.
 *
 * PLANO FREE TIER (100 req/hora):
 *   1 request por poll × 60 polls/hora = 60 req/hora (margem de 40 req/hora)
 *   /arbitrage-bets cobre todos os 32 esportes e todos os mercados em 1 request.
 *
 * Esta lista é usada apenas para exibição e consultas auxiliares via /events.
 */
export const MONITORED_SPORTS: string[] = [
  'football',
  'basketball',
  'tennis',
  'baseball',
  'american-football',
  'ice-hockey',
  'esports',
  'darts',
  'mixed-martial-arts',
  'boxing',
  'handball',
  'volleyball',
  'snooker',
  'table-tennis',
  'rugby',
  'cricket',
  'water-polo',
  'futsal',
  'beach-volleyball',
  'aussie-rules',
  'floorball',
  'squash',
  'beach-soccer',
  'lacrosse',
  'curling',
  'padel',
  'bandy',
  'gaelic-football',
  'beach-handball',
  'athletics',
  'badminton',
  'golf',
];

/** Mapa slug → nome exibível */
export const SPORT_LABELS: Record<string, string> = {
  'football':          'Futebol',
  'basketball':        'Basquete',
  'tennis':            'Tênis',
  'baseball':          'Beisebol',
  'american-football': 'Futebol Americano',
  'ice-hockey':        'Hóquei no Gelo',
  'esports':           'E-sports',
  'darts':             'Dardos',
  'mixed-martial-arts':'MMA',
  'boxing':            'Boxe',
  'handball':          'Handebol',
  'volleyball':        'Vôlei',
  'snooker':           'Snooker',
  'table-tennis':      'Tênis de Mesa',
  'rugby':             'Rúgbi',
  'cricket':           'Críquete',
  'water-polo':        'Polo Aquático',
  'futsal':            'Futsal',
  'beach-volleyball':  'Vôlei de Praia',
  'aussie-rules':      'Futebol Australiano',
  'floorball':         'Floorball',
  'squash':            'Squash',
  'beach-soccer':      'Futebol de Praia',
  'lacrosse':          'Lacrosse',
  'curling':           'Curling',
  'padel':             'Padel',
  'bandy':             'Bandy',
  'gaelic-football':   'Futebol Gaélico',
  'beach-handball':    'Handebol de Praia',
  'athletics':         'Atletismo',
  'badminton':         'Badminton',
  'golf':              'Golfe',
};

export function getSportLabel(slug: string): string {
  return SPORT_LABELS[slug] ?? slug;
}
