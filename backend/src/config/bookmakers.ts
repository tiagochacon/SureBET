import type { BookmakerConfig } from '../types/index.js';

/**
 * Lista canônica de bookmakers aprovados.
 * Critérios de inclusão: licença verificável, histórico de pagamento
 * limpo, disponibilidade no Brasil ou internacionalmente reconhecidos.
 * NUNCA adicionar bookmakers sem licença ou com reclamações de não pagamento.
 */
export const APPROVED_BOOKMAKERS: BookmakerConfig[] = [
  {
    slug: 'bet365',
    name: 'Bet365',
    license: 'UKGC / Malta MGA',
    reliability: 5,
    availableInBrazil: true,
    minStake: 1,
  },
  {
    slug: 'betano',
    name: 'Betano',
    license: 'Malta MGA / Kahnawake',
    reliability: 5,
    availableInBrazil: true,
    minStake: 1,
  },
  {
    slug: 'sportingbet',
    name: 'Sportingbet',
    license: 'Malta MGA',
    reliability: 5,
    availableInBrazil: true,
    minStake: 1,
  },
  {
    slug: 'betfair',
    name: 'Betfair',
    license: 'UKGC / Malta MGA',
    reliability: 5,
    availableInBrazil: true,
    minStake: 2,
  },
  {
    slug: 'pinnacle',
    name: 'Pinnacle',
    license: 'Curaçao',
    reliability: 5,
    availableInBrazil: false,
    minStake: 1,
    note: 'Disponível apenas em certas jurisdições',
  },
  {
    slug: 'kto',
    name: 'KTO',
    license: 'Malta MGA',
    reliability: 4,
    availableInBrazil: true,
    minStake: 1,
  },
  {
    slug: 'superbet',
    name: 'Superbet',
    license: 'Brasil SPA',
    reliability: 4,
    availableInBrazil: true,
    minStake: 1,
  },
  {
    slug: 'bwin',
    name: 'Bwin',
    license: 'Malta MGA / Gibraltar',
    reliability: 4,
    availableInBrazil: true,
    minStake: 1,
  },
  {
    slug: 'williamhill',
    name: 'William Hill',
    license: 'UKGC',
    reliability: 5,
    availableInBrazil: false,
    minStake: 1,
  },
  {
    slug: 'unibet',
    name: 'Unibet',
    license: 'Malta MGA / UKGC',
    reliability: 5,
    availableInBrazil: false,
    minStake: 1,
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
