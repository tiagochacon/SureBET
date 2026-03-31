import type { FastifyInstance } from 'fastify';
import type { OddsFetcherService } from '../../modules/odds-fetcher/odds-fetcher.service.js';
import type { OpportunityStore } from '../../modules/opportunity-store/opportunity-store.js';
import { APPROVED_BOOKMAKERS } from '../../config/bookmakers.js';
import { MONITORED_SPORTS, SPORT_LABELS } from '../../config/sports.js';

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

  /** GET /api/v1/sports */
  fastify.get('/sports', async (_request, reply) => {
    return reply.send({
      sports: MONITORED_SPORTS.map((slug) => ({
        slug,
        label: SPORT_LABELS[slug] ?? slug,
      })),
      total: MONITORED_SPORTS.length,
    });
  });
}
