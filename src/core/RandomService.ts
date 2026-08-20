/**
 * RandomService - Gerador de Números Pseudo-Aleatórios Seedado e Determinístico (AOS V4.7/V4.8)
 * 
 * Substitui o Math.random() não-determinístico do JS por um algoritmo LCG/PRNG de alta precisão.
 * Garante que qualquer campanha com a mesma seed produza EXATAMENTE os mesmos resultados
 * de dados, combate, eventos e geração de mundo.
 */
export class RandomService {
  private seed: number;

  constructor(seed: number = 1337) {
    this.seed = seed;
  }

  /**
   * Retorna um número flutuante no intervalo [0, 1) determinístico.
   */
  public next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Retorna um inteiro no intervalo [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Simula rolagem de dados no formato (ex: 1d20, 3d6+2).
   */
  public rollDice(count: number, sides: number, bonus: number = 0): { total: number; rolls: number[] } {
    const rolls: number[] = [];
    let total = bonus;
    for (let i = 0; i < count; i++) {
      const r = this.nextInt(1, sides);
      rolls.push(r);
      total += r;
    }
    return { total, rolls };
  }

  /**
   * Escolhe um elemento aleatório determinístico de um array.
   */
  public pick<T>(items: T[]): T {
    if (!items || items.length === 0) {
      throw new Error("RandomService.pick: Array vazio fornecido.");
    }
    const index = this.nextInt(0, items.length - 1);
    return items[index];
  }

  /**
   * Embaralha um array de forma determinística (Fisher-Yates).
   */
  public shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  public getSeed(): number {
    return this.seed;
  }

  public setSeed(seed: number): void {
    this.seed = seed;
  }
}

// Instância global padrão com seed de campanha
export const globalRNG = new RandomService(424242);
