import type { BookmakerConfig } from '../types/index.js';

/**
 * Bookmakers aprovados para a odds-api.io.
 * Nomes exatos conforme exigido pela API (case-sensitive).
 * Documentação: https://docs.odds-api.io
 */
export const APPROVED_BOOKMAKERS: BookmakerConfig[] = [
  {
    slug: 'Bet365',
    name: 'Bet365',
    license: 'UKGC / Malta MGA',
    reliability: 5,
    region: 'global',
    minStake: 1,
  },
  {
    slug: 'Betano',
    name: 'Betano',
    license: 'Malta MGA',
    reliability: 5,
    region: 'global',
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
