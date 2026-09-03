import { RandomService } from '../../core/RandomService';

export type AgentArchetype = 'BUILDER' | 'MILITARIST' | 'DIPLOMAT' | 'BALANCED';

const BUILDER_INPUTS: readonly string[] = [
  'Construir paliçada de madeira reforçada ao redor do fosso.',
  'Iniciar obras de reparo nas muralhas do pátio leste.',
  'Construir depósito de suprimentos junto ao celeiro.',
  'Reforçar os portões da fortaleza com traves de carvalho.',
  'Qual o estado das nossas construções e fortificações?',
  'Comprar madeira dos mercadores para as obras da paliçada.',
  'Erguer torre de vigia no perímetro norte.',
  'Inspecionar os celeiros e estoque de grãos em Grey Keep.'
];

const MILITARIST_INPUTS: readonly string[] = [
  'Recrutar 10 soldados para reforçar a guarda das muralhas.',
  'Convoque 15 homens da infantaria para a guarnição.',
  'Enviar patrulha de lanceiros para vigiar o desfiladeiro.',
  'Qual é a situação atual das nossas tropas e guarnições?',
  'Recrutar 5 arqueiros para as ameias da fortaleza.',
  'Inspecione a prontidão militar dos guardas de vigília.',
  'Realizar exercícios de defesa com a guarnição do castelo.',
  'Comprar armaduras e aço para equipar os novos recrutas.'
];

const DIPLOMAT_INPUTS: readonly string[] = [
  'Enviar emissário para propor aliança comercial com a Casa Blackthorn.',
  'Redigir missiva de cortesia para o senhor da Casa Veyr.',
  'Qual é a nossa reputação e postura diplomática com as casas vizinhas?',
  'Enviar batedores para sondar os movimentos da Casa Blackthorn.',
  'Propor acordo de passagem de caravanas com os nobres do leste.',
  'Consultar notícias trazidas pelos viajantes sobre o reino.',
  'Reafirmar nossa lealdade aos pactos estabelecidos na região.',
  'Enviar mensageiro com termos de paz para as terras fronteiriças.'
];

const BALANCED_INPUTS: readonly string[] = [
  'Construir paliçada ao redor do pátio principal.',
  'Recrutar 10 soldados para a guarnição da fortaleza.',
  'Comprar grãos e fardos de comida dos mercadores de passagem.',
  'Enviar emissário para tratar de alianças com a Casa Blackthorn.',
  'Qual o saldo dos nossos cofres e suprimentos nos celeiros?',
  'Vender excedente de lã no mercado regional.',
  'Inspecionar as patrulhas nas estradas do feudo.',
  'Consultar o conselheiro sobre os relatórios do feudo.'
];

export class AgentArchetypeGenerator {
  public static getInput(
    turn: number,
    archetype: AgentArchetype,
    rng: RandomService
  ): string {
    let pool: readonly string[];

    switch (archetype) {
      case 'BUILDER':
        pool = BUILDER_INPUTS;
        break;
      case 'MILITARIST':
        pool = MILITARIST_INPUTS;
        break;
      case 'DIPLOMAT':
        pool = DIPLOMAT_INPUTS;
        break;
      case 'BALANCED':
      default:
        pool = BALANCED_INPUTS;
        break;
    }

    const index = rng.nextInt(0, pool.length - 1);
    return pool[index];
  }
}
