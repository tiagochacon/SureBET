import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { StakeCalculator } from '../../modules/arbitrage/stake-calculator.js';
import { getBookmakerConfig } from '../../config/bookmakers.js';

const CalculatorBodySchema = z.object({
  bankroll: z.number().positive({ message: 'Bankroll deve ser maior que zero' }),
  outcomes: z
    .array(
      z.object({
        bookmaker: z.string().min(1),
        odd: z.number().gt(1, { message: 'Odd deve ser maior que 1' }),
        selection: z.string().min(1),
      }),
    )
    .min(2, { message: 'Informe pelo menos 2 outcomes' }),
});

export async function calculatorRoutes(fastify: FastifyInstance): Promise<void> {
  const calculator = new StakeCalculator();

  /**
   * POST /api/v1/calculator
   * Endpoint puro de cálculo de arbitragem.
   * Recebe odds e bankroll, retorna stakes e lucro garantido.
   * Retorna 422 se não houver arbitragem.
   */
  fastify.post('/calculator', async (request, reply) => {
    const body = CalculatorBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        error: 'Body inválido',
        details: body.error.issues,
      });
    }

    const { bankroll, outcomes } = body.data;
    const odds = outcomes.map((o) => o.odd);

    // Validar se há arbitragem antes de calcular
    const margin = StakeCalculator.validate(odds);
    if (margin === null) {
      return reply.status(422).send({
        error: 'Não há arbitragem nestas odds',
        message: `A soma dos inversos das odds (${odds.map((o) => `1/${o}`).join(' + ')}) é >= 1. Não há lucro garantido.`,
        inverseSum: odds.reduce((s, o) => s + 1 / o, 0).toFixed(6),
      });
    }

    // Construir BookmakerOdd fake apenas para cálculo (dados reais do usuário)
    const bookmakerOdds = outcomes.map((o) => ({
      bookmaker: o.bookmaker,
      bookmakerName: getBookmakerConfig(o.bookmaker)?.name ?? o.bookmaker,
      reliability: getBookmakerConfig(o.bookmaker)?.reliability ?? 0,
      market: 'h2h' as const,
      outcome: o.selection,
      odd: o.odd,
      fetchedAt: new Date(),
    }));

    const stakes = calculator.calculate(bankroll, bookmakerOdds);

    return reply.send({
      valid: true,
      arbitrageMargin: margin,
      roi: `${(margin * 100).toFixed(2)}%`,
      bankroll,
      totalStake: stakes.reduce((s, r) => s + r.stake, 0),
      guaranteedProfit: Math.round(bankroll * margin * 100) / 100,
      stakes: stakes.map((s, i) => ({
        ...s,
        selection: outcomes[i]?.selection,
        bookmakerInfo: getBookmakerConfig(s.bookmaker),
      })),
      disclaimer:
        'Este cálculo é baseado nas odds informadas. Verifique as odds na casa de apostas imediatamente antes de apostar.',
    });
  });
}
