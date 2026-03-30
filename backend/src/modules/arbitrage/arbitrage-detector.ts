import type { SportEvent, ArbitrageOpportunity, ArbitrageOutcome, BookmakerOdd, MarketType } from '../../types/index.js';
import { StakeCalculator } from './stake-calculator.js';
import { v4 as uuidv4 } from 'uuid';

const MIN_MARGIN = Number(process.env.MIN_ARBITRAGE_MARGIN ?? 0.005);
const MIN_MINUTES_TO_GAME = Number(process.env.MIN_MINUTES_TO_GAME ?? 5);
const OPPORTUNITY_TTL_SECONDS = 90;

/** Labels exibíveis por outcome */
const OUTCOME_LABELS: Record<string, string> = {
  home: 'Vitória Casa',
  draw: 'Empate',
  away: 'Vitória Fora',
  over_1_5: 'Over 1.5',
  under_1_5: 'Under 1.5',
  over_2_5: 'Over 2.5',
  under_2_5: 'Under 2.5',
  over_3_5: 'Over 3.5',
  under_3_5: 'Under 3.5',
  over_4_5: 'Over 4.5',
  under_4_5: 'Under 4.5',
  yes: 'Ambos Marcam',
  no: 'Não Marcam Ambos',
  '1x': 'Casa ou Empate',
  '12': 'Casa ou Fora',
  x2: 'Empate ou Fora',
};

/** Grupos de outcomes por mercado — cada grupo forma um mercado completo */
type OutcomeGroup = { market: MarketType; outcomes: string[]; label: string };

const MARKET_GROUPS: OutcomeGroup[] = [
  { market: 'h2h', outcomes: ['home', 'draw', 'away'], label: 'Resultado Final (1X2)' },
  { market: 'totals', outcomes: ['over_2.5', 'under_2.5'], label: 'Over/Under 2.5 Gols' },
  { market: 'totals', outcomes: ['over_1.5', 'under_1.5'], label: 'Over/Under 1.5 Gols' },
  { market: 'totals', outcomes: ['over_3.5', 'under_3.5'], label: 'Over/Under 3.5 Gols' },
  { market: 'totals', outcomes: ['over_4.5', 'under_4.5'], label: 'Over/Under 4.5 Gols' },
  { market: 'btts', outcomes: ['yes', 'no'], label: 'Ambos Marcam (BTTS)' },
  { market: 'double_chance', outcomes: ['1x', '12', 'x2'], label: 'Chance Dupla' },
];

export class ArbitrageDetector {
  private readonly calculator = new StakeCalculator();

  /**
   * Analisa um array de eventos e retorna todas as oportunidades de arbitragem.
   * NUNCA retorna oportunidades com margem <= 0 ou dados inválidos.
   */
  detectAll(events: SportEvent[], bankroll: number): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const event of events) {
      // Regra: descartar eventos que começam em menos de MIN_MINUTES_TO_GAME minutos
      const minutesToGame = (event.commenceTime.getTime() - Date.now()) / 60_000;
      if (minutesToGame < MIN_MINUTES_TO_GAME) continue;

      for (const group of MARKET_GROUPS) {
        const opportunity = this.detectForMarket(event, group, bankroll);
        if (opportunity) opportunities.push(opportunity);
      }
    }

    // Ordenar por margem de arbitragem decrescente
    return opportunities.sort((a, b) => b.arbitrageMargin - a.arbitrageMargin);
  }

  /**
   * Para um evento e mercado específico, verifica se há arbitragem.
   * Retorna null se não houver oportunidade válida.
   */
  private detectForMarket(
    event: SportEvent,
    group: OutcomeGroup,
    bankroll: number,
  ): ArbitrageOpportunity | null {
    // Para cada outcome, pegar a MELHOR odd entre todas as casas aprovadas
    const bestOddsPerOutcome = this.getBestOddsPerOutcome(event.bookmakerOdds, group);

    // Verificar se todos os outcomes têm pelo menos uma odd disponível
    if (bestOddsPerOutcome.size < group.outcomes.length) return null;

    // Calcular soma dos inversos
    const inverseSum = Array.from(bestOddsPerOutcome.values())
      .reduce((sum, odd) => sum + 1 / odd.odd, 0);

    // Margem de arbitragem
    const margin = 1 - inverseSum;

    // Só há oportunidade se margem > 0 E > mínimo configurado
    if (margin <= 0 || margin < MIN_MARGIN) return null;

    // Calcular stakes
    const bestOddsArray = Array.from(bestOddsPerOutcome.values());
    const stakes = this.calculator.calculate(bankroll, bestOddsArray);

    const outcomes: ArbitrageOutcome[] = bestOddsArray.map((odd, i) => ({
      bookmaker: odd.bookmaker,
      bookmakerName: odd.bookmakerName,
      market: odd.market,
      selection: OUTCOME_LABELS[odd.outcome] ?? odd.outcome,
      odd: odd.odd,
      impliedProbability: 1 / odd.odd,
      stake: stakes[i]?.stake ?? 0,
      expectedReturn: stakes[i]?.expectedReturn ?? 0,
      oddFetchedAt: odd.fetchedAt,
      oddChangedAlert: false,
    }));

    const totalStake = outcomes.reduce((s, o) => s + o.stake, 0);
    const guaranteedProfit = totalStake * margin;
    const detectedAt = new Date();

    return {
      id: uuidv4(),
      eventId: event.id,
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      league: event.league,
      commenceTime: event.commenceTime,
      marketType: group.market,
      marketLabel: group.label,
      arbitrageMargin: margin,
      roi: margin * 100, // em %
      bankrollUsed: bankroll,
      totalStake: Math.round(totalStake * 100) / 100,
      guaranteedProfit: Math.round(guaranteedProfit * 100) / 100,
      outcomes,
      status: 'active',
      detectedAt,
      expiresAt: new Date(detectedAt.getTime() + OPPORTUNITY_TTL_SECONDS * 1000),
    };
  }

  /**
   * Para cada outcome de um grupo, retorna a MELHOR odd disponível
   * entre todos os bookmakers aprovados.
   */
  private getBestOddsPerOutcome(
    bookmakerOdds: BookmakerOdd[],
    group: OutcomeGroup,
  ): Map<string, BookmakerOdd> {
    const best = new Map<string, BookmakerOdd>();

    for (const outcomeKey of group.outcomes) {
      const relevantOdds = bookmakerOdds.filter(
        (o) => o.market === group.market && o.outcome === outcomeKey,
      );

      if (relevantOdds.length === 0) continue;

      // A melhor odd para o apostador é a MAIS ALTA
      const bestOdd = relevantOdds.reduce((prev, curr) =>
        curr.odd > prev.odd ? curr : prev,
      );

      best.set(outcomeKey, bestOdd);
    }

    return best;
  }
}
