import type { BookmakerOdd } from '../../types/index.js';

export interface StakeResult {
  bookmaker: string;
  outcome: string;
  odd: number;
  stake: number;
  expectedReturn: number;
  profit: number;
}

export class StakeCalculator {
  /**
   * Calcula o stake ótimo para cada outcome de uma oportunidade de arbitragem.
   *
   * Fórmula:
   *   stake_i = bankroll × (1/odd_i) / Σ(1/odd_j)
   *
   * Garante que o retorno em qualquer cenário seja igual ao bankroll × (1 / inverseSum),
   * ou seja, acima do bankroll investido (lucro garantido).
   *
   * @throws Error se sum(1/odds) >= 1 — não há arbitragem
   */
  calculate(bankroll: number, odds: BookmakerOdd[]): StakeResult[] {
    if (odds.length === 0) throw new Error('Nenhuma odd fornecida para cálculo');
    if (bankroll <= 0) throw new Error('Bankroll deve ser maior que zero');

    const inverseSum = odds.reduce((sum, o) => sum + 1 / o.odd, 0);

    // Validação matemática obrigatória — nunca calcular se não há arbitragem
    if (inverseSum >= 1) {
      throw new Error(
        `Sem oportunidade de arbitragem: soma dos inversos = ${inverseSum.toFixed(4)} (deve ser < 1)`,
      );
    }

    const results: StakeResult[] = odds.map((o) => {
      const stake = (bankroll * (1 / o.odd)) / inverseSum;
      const stakeRounded = Math.round(stake * 100) / 100; // 2 casas decimais
      const expectedReturn = Math.round(stakeRounded * o.odd * 100) / 100;
      const profit = Math.round((expectedReturn - bankroll) * 100) / 100;

      return {
        bookmaker: o.bookmaker,
        outcome: o.outcome,
        odd: o.odd,
        stake: stakeRounded,
        expectedReturn,
        profit,
      };
    });

    return results;
  }

  /**
   * Valida se uma lista de odds forma uma oportunidade de arbitragem válida.
   * Retorna a margem (> 0 = válida) ou null se não houver arbitragem.
   */
  static validate(odds: number[]): number | null {
    if (odds.length === 0) return null;
    if (odds.some((o) => o <= 1)) return null; // odds inválidas

    const inverseSum = odds.reduce((sum, o) => sum + 1 / o, 0);
    const margin = 1 - inverseSum;

    return margin > 0 ? margin : null;
  }
}
