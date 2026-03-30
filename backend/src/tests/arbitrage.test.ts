import { StakeCalculator } from '../modules/arbitrage/stake-calculator.js';
import { ArbitrageDetector } from '../modules/arbitrage/arbitrage-detector.js';
import type { BookmakerOdd, SportEvent } from '../types/index.js';

describe('StakeCalculator', () => {
  const calc = new StakeCalculator();

  // Caso validado no prompt: Under 2.5 @ 3.1, Over 2.5 @ 1.6
  test('calcula stakes corretamente para o exemplo do prompt', () => {
    const odds: BookmakerOdd[] = [
      { bookmaker: 'bookmaker_a', bookmakerName: 'A', reliability: 5,
        market: 'totals', outcome: 'under_2.5', odd: 3.1, fetchedAt: new Date() },
      { bookmaker: 'bookmaker_b', bookmakerName: 'B', reliability: 5,
        market: 'totals', outcome: 'over_2.5', odd: 1.6, fetchedAt: new Date() },
    ];

    const results = calc.calculate(150, odds);

    // Verificar soma dos inversos
    const inverseSum = 1/3.1 + 1/1.6;
    expect(inverseSum).toBeCloseTo(0.9476, 3);

    // Verificar margem de arbitragem
    const margin = 1 - inverseSum;
    expect(margin).toBeCloseTo(0.0524, 3);

    // Verificar stakes
    const underStake = results.find((r) => r.outcome === 'under_2.5');
    const overStake = results.find((r) => r.outcome === 'over_2.5');

    expect(underStake?.stake).toBeCloseTo(51.06, 1);
    expect(overStake?.stake).toBeCloseTo(98.94, 1);

    // Verificar retornos (devem ser aproximadamente iguais)
    expect(underStake?.expectedReturn).toBeCloseTo(158.29, 0);
    expect(overStake?.expectedReturn).toBeCloseTo(158.30, 0);

    // Lucro mínimo > 0 em qualquer cenário
    expect((underStake?.expectedReturn ?? 0)).toBeGreaterThan(150);
    expect((overStake?.expectedReturn ?? 0)).toBeGreaterThan(150);
  });

  test('lança erro se não há arbitragem (inverseSum >= 1)', () => {
    const odds: BookmakerOdd[] = [
      { bookmaker: 'a', bookmakerName: 'A', reliability: 5, market: 'h2h', outcome: 'home', odd: 1.5, fetchedAt: new Date() },
      { bookmaker: 'b', bookmakerName: 'B', reliability: 5, market: 'h2h', outcome: 'away', odd: 1.5, fetchedAt: new Date() },
    ];
    // 1/1.5 + 1/1.5 = 1.33 >= 1 → sem arbitragem
    expect(() => calc.calculate(100, odds)).toThrow('Sem oportunidade de arbitragem');
  });

  test('lança erro se bankroll <= 0', () => {
    const odds: BookmakerOdd[] = [
      { bookmaker: 'a', bookmakerName: 'A', reliability: 5, market: 'h2h', outcome: 'home', odd: 3.0, fetchedAt: new Date() },
      { bookmaker: 'b', bookmakerName: 'B', reliability: 5, market: 'h2h', outcome: 'away', odd: 3.0, fetchedAt: new Date() },
    ];
    expect(() => calc.calculate(0, odds)).toThrow('Bankroll deve ser maior que zero');
    expect(() => calc.calculate(-100, odds)).toThrow('Bankroll deve ser maior que zero');
  });

  test('validate() retorna margem para oportunidade válida', () => {
    const margin = StakeCalculator.validate([3.1, 1.6]);
    expect(margin).not.toBeNull();
    expect(margin).toBeCloseTo(0.0524, 3);
  });

  test('validate() retorna null para odds sem arbitragem', () => {
    expect(StakeCalculator.validate([1.5, 1.5])).toBeNull();
    expect(StakeCalculator.validate([2.0, 2.0])).toBeNull();
    expect(StakeCalculator.validate([1.2, 1.3, 1.4])).toBeNull();
  });

  test('validate() retorna null para odds inválidas (<= 1)', () => {
    expect(StakeCalculator.validate([0.9, 3.0])).toBeNull();
    expect(StakeCalculator.validate([1.0, 3.0])).toBeNull();
  });

  test('calcula corretamente para mercado 1X2 (3 outcomes)', () => {
    // Odds que formam arbitragem: 1/3.2 + 1/4.0 + 1/2.1 ≈ 0.312 + 0.25 + 0.476 = 1.038 → sem arb
    // Odds com arb: 3.5, 4.5, 2.2
    const inverseSum = 1/3.5 + 1/4.5 + 1/2.2;
    // Se inverseSum < 1, há arbitragem
    if (inverseSum < 1) {
      const odds: BookmakerOdd[] = [
        { bookmaker: 'a', bookmakerName: 'A', reliability: 5, market: 'h2h', outcome: 'home', odd: 3.5, fetchedAt: new Date() },
        { bookmaker: 'b', bookmakerName: 'B', reliability: 5, market: 'h2h', outcome: 'draw', odd: 4.5, fetchedAt: new Date() },
        { bookmaker: 'c', bookmakerName: 'C', reliability: 5, market: 'h2h', outcome: 'away', odd: 2.2, fetchedAt: new Date() },
      ];
      const results = calc.calculate(100, odds);
      // Todos os retornos devem ser maiores que o bankroll
      results.forEach((r) => {
        expect(r.expectedReturn).toBeGreaterThan(100);
      });
    }
  });
});

describe('ArbitrageDetector', () => {
  const detector = new ArbitrageDetector();

  function makeEvent(overOdd: number, underOdd: number): SportEvent {
    return {
      id: 'test-event-1',
      sport: 'soccer',
      league: 'Premier League',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      commenceTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2h a partir de agora
      fetchedAt: new Date(),
      bookmakerOdds: [
        { bookmaker: 'bet365', bookmakerName: 'Bet365', reliability: 5,
          market: 'totals', outcome: 'over_2.5', odd: overOdd, fetchedAt: new Date() },
        { bookmaker: 'betano', bookmakerName: 'Betano', reliability: 5,
          market: 'totals', outcome: 'under_2.5', odd: underOdd, fetchedAt: new Date() },
      ],
    };
  }

  test('detecta oportunidade com as odds do exemplo do prompt', () => {
    const event = makeEvent(1.6, 3.1);
    const opportunities = detector.detectAll([event], 150);
    expect(opportunities.length).toBeGreaterThan(0);

    const opp = opportunities[0]!;
    expect(opp.arbitrageMargin).toBeCloseTo(0.0524, 3);
    expect(opp.guaranteedProfit).toBeGreaterThan(0);
    expect(opp.status).toBe('active');
  });

  test('não detecta oportunidade quando não há arbitragem', () => {
    const event = makeEvent(1.4, 1.4); // inverseSum = 1.43 > 1
    const opportunities = detector.detectAll([event], 100);
    expect(opportunities.length).toBe(0);
  });

  test('não detecta oportunidades em eventos que começam em menos de 5 minutos', () => {
    const event = makeEvent(1.6, 3.1);
    event.commenceTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutos
    const opportunities = detector.detectAll([event], 100);
    expect(opportunities.length).toBe(0);
  });

  test('ordena oportunidades por margem decrescente', () => {
    const event1 = makeEvent(1.6, 3.1); // margem ~5.24%
    const event2 = { ...makeEvent(1.55, 3.5), id: 'event-2' }; // margem maior se válida
    const opportunities = detector.detectAll([event1, event2], 100);

    for (let i = 1; i < opportunities.length; i++) {
      expect(opportunities[i - 1]!.arbitrageMargin).toBeGreaterThanOrEqual(
        opportunities[i]!.arbitrageMargin,
      );
    }
  });
});
