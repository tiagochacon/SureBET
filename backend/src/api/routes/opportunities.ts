import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { OpportunityStore } from '../../modules/opportunity-store/opportunity-store.js';
import { query } from '../../db/postgres.js';

const GetOpportunitiesQuerySchema = z.object({
  bankroll: z.coerce.number().positive().optional(),
  min_margin: z.coerce.number().min(0).max(1).optional(),
  market: z.enum(['h2h', 'totals', 'btts', 'double_chance']).optional(),
  league: z.string().optional(),
});

export async function opportunitiesRoutes(
  fastify: FastifyInstance,
  options: { store: OpportunityStore },
): Promise<void> {
  const { store } = options;

  /** GET /api/v1/opportunities — lista oportunidades ativas */
  fastify.get('/opportunities', async (request, reply) => {
    const query_raw = GetOpportunitiesQuerySchema.safeParse(request.query);
    if (!query_raw.success) {
      return reply.status(400).send({ error: 'Query params inválidos', details: query_raw.error.issues });
    }

    const { min_margin, market, league, bankroll } = query_raw.data;
    let opportunities = store.getAll();

    if (min_margin !== undefined) {
      opportunities = opportunities.filter((o) => o.arbitrageMargin >= min_margin);
    }
    if (market) {
      opportunities = opportunities.filter((o) => o.marketType === market);
    }
    if (league) {
      opportunities = opportunities.filter((o) =>
        o.league.toLowerCase().includes(league.toLowerCase()),
      );
    }

    // Se bankroll informado, recalcular stakes dinamicamente
    // (as stakes base já estão calculadas — reescalar proporcionalmente)
    if (bankroll) {
      opportunities = opportunities.map((opp) => {
        const ratio = bankroll / opp.bankrollUsed;
        return {
          ...opp,
          bankrollUsed: bankroll,
          totalStake: Math.round(opp.totalStake * ratio * 100) / 100,
          guaranteedProfit: Math.round(opp.guaranteedProfit * ratio * 100) / 100,
          outcomes: opp.outcomes.map((out) => ({
            ...out,
            stake: Math.round(out.stake * ratio * 100) / 100,
            expectedReturn: Math.round(out.expectedReturn * ratio * 100) / 100,
          })),
        };
      });
    }

    return reply.send({
      count: opportunities.length,
      opportunities,
      meta: {
        timestamp: new Date().toISOString(),
        hasOpportunities: opportunities.length > 0,
      },
    });
  });

  /** GET /api/v1/opportunities/history — histórico das últimas 24h */
  fastify.get('/opportunities/history', async (request, reply) => {
    const rows = await query<{
      id: string; event_name: string; league: string; market_type: string;
      arbitrage_margin: number; status: string; detected_at: Date;
    }>(
      `SELECT id, event_name, league, market_type, arbitrage_margin, status, detected_at
       FROM opportunities
       WHERE detected_at > NOW() - INTERVAL '24 hours'
       ORDER BY detected_at DESC
       LIMIT 200`,
    );

    return reply.send({ count: rows.length, history: rows });
  });

  /** GET /api/v1/opportunities/:id — detalhe */
  fastify.get<{ Params: { id: string } }>('/opportunities/:id', async (request, reply) => {
    const { id } = request.params;

    // Tentar store em memória primeiro
    const live = store.getById(id);
    if (live) return reply.send(live);

    // Fallback: buscar no banco
    const rows = await query<{ id: string; outcomes: unknown; [key: string]: unknown }>(
      `SELECT * FROM opportunities WHERE id = $1`,
      [id],
    );

    if (rows.length === 0) {
      return reply.status(404).send({ error: 'Oportunidade não encontrada' });
    }

    return reply.send(rows[0]);
  });
}
