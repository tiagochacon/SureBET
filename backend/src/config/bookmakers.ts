import type { BookmakerConfig } from '../types/index.js';

/**
 * Lista canônica de bookmakers aprovados.
 * Slugs verificados na documentação oficial da The Odds API:
 * https://the-odds-api.com/sports-odds-data/bookmaker-apis.html
 *
 * Regiões usadas: eu, uk
 * NUNCA adicionar bookmaker cujo slug não esteja confirmado na API.
 */
export const APPROVED_BOOKMAKERS: BookmakerConfig[] = [
  // ── Reliability 5 ─────────────────────────────────────────────
  {
    slug: 'pinnacle',
    name: 'Pinnacle',
    license: 'Curaçao',
    reliability: 5,
    region: 'eu',
    minStake: 1,
    note: 'Margem mais baixa do mercado — referência para arbitragem',
  },
  {
    slug: 'williamhill',
    name: 'William Hill',
    license: 'UKGC',
    reliability: 5,
    region: 'eu,uk',
    minStake: 1,
  },
  {
    slug: 'betfair_ex_eu',
    name: 'Betfair Exchange (EU)',
    license: 'UKGC / Malta MGA',
    reliability: 5,
    region: 'eu',
    minStake: 2,
  },
  {
    slug: 'betfair_ex_uk',
    name: 'Betfair Exchange (UK)',
    license: 'UKGC',
    reliability: 5,
    region: 'uk',
    minStake: 2,
  },
  {
    slug: 'betfair_sb_uk',
    name: 'Betfair Sportsbook (UK)',
    license: 'UKGC',
    reliability: 5,
    region: 'uk',
    minStake: 1,
  },
  {
    slug: 'unibet_uk',
    name: 'Unibet (UK)',
    license: 'UKGC',
    reliability: 5,
    region: 'uk',
    minStake: 1,
  },
  {
    slug: 'unibet_fr',
    name: 'Unibet (FR)',
    license: 'Malta MGA',
    reliability: 5,
    region: 'eu',
    minStake: 1,
  },
  {
    slug: 'unibet_it',
    name: 'Unibet (IT)',
    license: 'Malta MGA',
    reliability: 5,
    region: 'eu',
    minStake: 1,
  },
  {
    slug: 'unibet_nl',
    name: 'Unibet (NL)',
    license: 'Malta MGA',
    reliability: 5,
    region: 'eu',
    minStake: 1,
  },
  // ── Reliability 4 ─────────────────────────────────────────────
  {
    slug: 'betsson',
    name: 'Betsson',
    license: 'Malta MGA',
    reliability: 4,
    region: 'eu',
    minStake: 1,
  },
  {
    slug: 'marathonbet',
    name: 'Marathon Bet',
    license: 'Malta MGA',
    reliability: 4,
    region: 'eu',
    minStake: 1,
  },
  {
    slug: 'matchbook',
    name: 'Matchbook',
    license: 'UKGC',
    reliability: 4,
    region: 'eu,uk',
    minStake: 1,
  },
  {
    slug: 'nordicbet',
    name: 'NordicBet',
    license: 'Malta MGA',
    reliability: 4,
    region: 'eu',
    minStake: 1,
  },
  {
    slug: 'sport888',
    name: '888sport',
    license: 'UKGC / Gibraltar',
    reliability: 4,
    region: 'eu,uk',
    minStake: 1,
  },
  {
    slug: 'paddypower',
    name: 'Paddy Power',
    license: 'Ireland / UKGC',
    reliability: 4,
    region: 'uk',
    minStake: 1,
  },
  {
    slug: 'skybet',
    name: 'Sky Bet',
    license: 'UKGC',
    reliability: 4,
    region: 'uk',
    minStake: 1,
  },
  {
    slug: 'ladbrokes_uk',
    name: 'Ladbrokes',
    license: 'UKGC',
    reliability: 4,
    region: 'uk',
    minStake: 1,
  },
  {
    slug: 'coral',
    name: 'Coral',
    license: 'UKGC',
    reliability: 4,
    region: 'uk',
    minStake: 1,
  },
  {
    slug: 'betvictor',
    name: 'Bet Victor',
    license: 'UKGC / Gibraltar',
    reliability: 4,
    region: 'eu,uk',
    minStake: 1,
  },
  {
    slug: 'smarkets',
    name: 'Smarkets',
    license: 'UKGC',
    reliability: 4,
    region: 'uk',
    minStake: 1,
    note: 'Exchange — odds geralmente favoráveis para arbitragem',
  },
];

/** Set de slugs aprovados para lookup O(1) */
export const APPROVED_SLUGS = new Set(APPROVED_BOOKMAKERS.map((b) => b.slug));

/** Mapa slug → config para lookup rápido */
export const BOOKMAKER_MAP = new Map<string, BookmakerConfig>(
  APPROVED_BOOKMAKERS.map((b) => [b.slug, b]),
);

/** Retorna a config de um bookmaker ou null se não aprovado */
export function getBookmakerConfig(slug: string): BookmakerConfig | null {
  return BOOKMAKER_MAP.get(slug) ?? null;
}
