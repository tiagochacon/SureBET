import type { FastifyInstance } from 'fastify';
import type { OddsFetcherService } from '../../modules/odds-fetcher/odds-fetcher.service.js';
import type { OpportunityStore } from '../../modules/opportunity-store/opportunity-store.js';
import { APPROVED_BOOKMAKERS } from '../../config/bookmakers.js';
import { MONITORED_LEAGUES, LEAGUE_LABELS } from '../../config/leagues.js';

export async function statusRoutes(
  fastify: FastifyInstance,
  options: { fetcher: OddsFetcherService; store: OpportunityStore },
): Promise<void> {
  const { fetcher, store } = options;

  /** GET /api/v1/status */
  fastify.get('/status', async (_request, reply) => {
    const fetcherStatus = fetcher.status;
    return reply.send({
      ...fetcherStatus,
      activeOpportunities: store.size,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  /** GET /api/v1/bookmakers */
  fastify.get('/bookmakers', async (_request, reply) => {
    return reply.send({
      bookmakers: APPROVED_BOOKMAKERS,
      total: APPROVED_BOOKMAKERS.length,
    });
  });

  /** GET /api/v1/leagues */
  fastify.get('/leagues', async (_request, reply) => {
    return reply.send({
      leagues: MONITORED_LEAGUES.map((slug) => ({
        slug,
        label: LEAGUE_LABELS[slug] ?? slug,
      })),
    });
  });
}
