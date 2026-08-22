import {
  NARRATIVE_CONTRACT_VERSION,
  NarrativeCommand,
  NarrativeContext,
  NarrativeAction
} from './narrativeContracts';
import { InterpretInput, NarrativeLLM } from './narrativeLLM';

/**
 * Deterministic offline provider for the vertical slice. Keyword-driven, no
 * network, no API key, no RNG, no clock. It never accesses CampaignState
 * directly: it grounds only on the Engine-authorized inputs it receives
 * (ObserverProjection for interpretation, NarrativeContext for narration).
 */
export class MockNarrativeLLM implements NarrativeLLM {
  readonly providerId = 'mock';
  readonly modelId = 'mock-deterministic';

  interpret(input: InterpretInput): Promise<NarrativeCommand> {
    return Promise.resolve(interpretInput(input.playerInput));
  }

  narrate(context: NarrativeContext): Promise<string> {
    return Promise.resolve(narrateReport(context));
  }
}

function extractStance(input: string): NarrativeCommand['stance'] {
  if (/agressiv|ameaç|força|hostil/i.test(input)) return 'AGGRESSIVE';
  if (/cautel|cuidad|prudente|ocult|evit|recu|defensiv|não\s+ataque/i.test(input)) return 'CAUTIOUS';
  if (/diploma|acordo|negoci/i.test(input)) return 'DIPLOMATIC';
  if (/escond|furtiv|dissimul|mentir/i.test(input)) return 'DECEPTIVE';
  if (/honra|justo|leal/i.test(input)) return 'HONORABLE';
  return 'NEUTRAL';
}

function buildCommand(action: NarrativeAction, overrides: Partial<NarrativeCommand> = {}, playerInput = ''): NarrativeCommand {
  return {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: `mock-${action.toLowerCase()}-command`,
    actorId: 'player',
    action,
    stance: extractStance(playerInput),
    constraints: [],
    confidence: 1,
    ambiguity: [],
    requiresClarification: false,
    ...overrides
  };
}

function extractQuantity(input: string): number | undefined {
  const match = /\b(\d+)\b/.exec(input);
  if (!match) return undefined;
  const quantity = parseInt(match[1], 10);
  return Number.isFinite(quantity) && quantity >= 1 ? quantity : undefined;
}

const CLARIFY_KEYWORDS = ['falar com', 'falar com ele', 'conversar', 'talk to', 'speak with'];
const RECRUIT_KEYWORDS = ['recrut', 'recruit', 'soldado', 'soldier', 'infantaria'];
const BUILD_KEYWORDS = ['constru', 'build', 'palisad', 'palisade', 'fortifica'];
const INFO_KEYWORDS = [
  'quanto custa', 'qual o custo', 'como funciona', 'how much', 'qual regra',
  'avaliar', 'situacao', 'situação', 'diplomacia', 'inimig', 'necessidade', 'povo', 'popula',
  'conselh', 'como estamos', 'o que fazer', 'relatorio', 'relatório', 'inform',
  'mara', 'ren', 'baldur', 'roric', 'gerold', 'aldren', 'chancel', 'marechal',
  'fronteir', 'hosti', 'ameac', 'ameaç', 'perig', 'batedor', 'patrulh', 'guarda', 'acao', 'ação', 'passo', 'atencao', 'atenção', 'demanda', 'moviment',
  'quem', 'como', 'onde', 'qual', 'quando', 'por que', 'porque', 'o que', 'quais'
];
const TRAVEL_KEYWORDS = ['viajar', 'marchar', 'viagem', 'travel', 'march'];
const TRADE_KEYWORDS = ['comprar', 'compre', 'compra', 'vender', 'venda', 'vende', 'trocar', 'comercio', 'comércio', 'buy', 'sell'];
const ESPIONAGE_KEYWORDS = ['espi', 'infiltr', 'batedor', 'investig', 'sond', 'reconhecimento', 'vigi', 'aprofund'];
const DIPLOMACY_KEYWORDS = ['comitiva', 'emissário', 'emissario', 'diploma', 'trégua', 'tregua', 'pacto', 'aliança', 'alianca', 'tratado', 'carta formal', 'mensagem formal'];
const MILITARY_KEYWORDS = ['mobiliz', 'piquete', 'bloqueio', 'bloquear', 'cercar', 'cerco', 'emboscada', 'manobra militar', 'atacar', 'ataque', 'batalha', 'assalto', 'destacamento'];
const IMPOSSIBLE_KEYWORDS = ['mato o rei', 'matar o rei', 'kill the king'];

function extractLocationOrTarget(input: string): string | undefined {
  const cleaned = input.replace(/\b(?:uma?\s+)?(?:comitiva(?:\s+formal)?|mensagem(?:\s+formal)?|carta(?:\s+formal)?|pequeno\s+destacamento|destacamento|piquete|investigação|investigacao|espionagem|patrulha|sondagem|missão|missao|ação|acao)\b/gi, '');
  const match = /(?:(?:\b(?:para|em|na|no|ao)\b)|(?:\s+à\s+))\s*(?:a|o|as|os|um|uma)?\s*([a-zA-Z0-9À-ÿ\s]{3,30}?)(?:\.|\,|[;:]|$|\bsob\b|\bcom\b|\bquero\b|\bmas\b|\bevite\b|\bsem\b|\bcontinue\b|\bnão\b|\bnao\b)/i.exec(cleaned);
  if (!match) return undefined;
  const loc = match[1].trim();
  return loc.length >= 3 ? loc : undefined;
}

function interpretInput(playerInput: string): NarrativeCommand {
  const normalized = ` ${playerInput.trim().toLowerCase()} `;

  if (IMPOSSIBLE_KEYWORDS.some(k => normalized.includes(k))) {
    return buildCommand('UNKNOWN', {}, playerInput);
  }

  if (CLARIFY_KEYWORDS.some(k => normalized.includes(k))) {
    return buildCommand('UNKNOWN', {
      requiresClarification: true,
      ambiguity: ['alvo da conversa não identificado'],
      confidence: 0.6
    }, playerInput);
  }

  // 1. Explicit Interrogatives & Cost inquiries
  if (/\?/.test(playerInput) || /quanto custa|qual o custo|como funciona|how much|qual regra|o que fazer|relatorio|relatório/.test(normalized)) {
    return buildCommand('INFORMATION', { 
      confidence: 0.95,
      desiredOutcome: 'dialogar com conselheiros e consultar o estado das fronteiras e do feudo'
    }, playerInput);
  }

  // 2. Action: ESPIONAGE
  if (ESPIONAGE_KEYWORDS.some(k => normalized.includes(k))) {
    const loc = extractLocationOrTarget(playerInput);
    if (!loc) {
      return buildCommand('ESPIONAGE', {
        requiresClarification: true,
        ambiguity: ['alvo ou local de espionagem não identificado'],
        confidence: 0.6
      }, playerInput);
    }
    return buildCommand('ESPIONAGE', {
      locationId: loc,
      targetId: loc,
      confidence: 0.95,
      desiredOutcome: playerInput
    }, playerInput);
  }

  // 3. Action: DIPLOMACY
  if (DIPLOMACY_KEYWORDS.some(k => normalized.includes(k))) {
    const loc = extractLocationOrTarget(playerInput);
    return buildCommand('DIPLOMACY', {
      targetId: loc || 'destacamento da ponte',
      locationId: loc,
      confidence: 0.95,
      desiredOutcome: playerInput
    }, playerInput);
  }

  // 4. Action: MILITARY
  if (MILITARY_KEYWORDS.some(k => normalized.includes(k))) {
    const loc = extractLocationOrTarget(playerInput);
    return buildCommand('MILITARY', {
      targetId: loc || 'destacamento da ponte',
      locationId: loc,
      confidence: 0.95,
      desiredOutcome: playerInput
    }, playerInput);
  }

  // 3. Action: TRADE
  if (TRADE_KEYWORDS.some(k => normalized.includes(k))) {
    const goods = ['mantimentos', 'comida', 'grãos', 'graos', 'saca', 'sacas', 'cereal', 'cereais', 'madeira', 'ferro', 'pedra', 'racao', 'ração', 'sal'].find(g =>
      normalized.includes(g)
    );
    return buildCommand('TRADE', {
      objectId: goods || 'grãos',
      confidence: 0.95,
      desiredOutcome: playerInput
    }, playerInput);
  }

  // 4. Action: RECRUIT
  if (RECRUIT_KEYWORDS.some(k => normalized.includes(k))) {
    const quantity = extractQuantity(playerInput);
    if (quantity === undefined) {
      return buildCommand('RECRUIT', {
        magnitude: { mode: 'ENGINE_DETERMINED' },
        desiredOutcome: 'reforçar as fileiras com novos soldados',
        confidence: 0.85
      }, playerInput);
    }
    return buildCommand('RECRUIT', {
      commandId: `mock-recruit-${quantity}`,
      magnitude: { mode: 'FIXED', value: quantity },
      desiredOutcome: `recrutar ${quantity} soldados`,
      confidence: 0.95
    }, playerInput);
  }

  // 5. Action: BUILD
  if (BUILD_KEYWORDS.some(k => normalized.includes(k))) {
    const structure = /palisad|palisade/.test(normalized)
      ? 'palisade'
      : /muralha|pedra|stone/.test(normalized)
        ? 'stone_wall'
        : undefined;
    if (structure === undefined) {
      return buildCommand('BUILD', {
        requiresClarification: true,
        ambiguity: ['estrutura a construir não identificada'],
        confidence: 0.6
      }, playerInput);
    }
    return buildCommand('BUILD', {
      commandId: `mock-build-${structure}`,
      objectId: structure,
      desiredOutcome: `construir ${structure === 'palisade' ? 'palisada de madeira' : 'muralha de pedra'}`,
      confidence: 0.95
    }, playerInput);
  }

  // 6. Action: TRAVEL
  if (TRAVEL_KEYWORDS.some(k => normalized.includes(k))) {
    if (!/central plains|fronteira/.test(normalized)) {
      return buildCommand('TRAVEL', {
        requiresClarification: true,
        ambiguity: ['destino da viagem não identificado'],
        confidence: 0.6
      }, playerInput);
    }
    return buildCommand('TRAVEL', {
      locationId: 'Central Plains',
      confidence: 0.9
    }, playerInput);
  }

  // 7. Generic Counselor Consult / Info Fallback
  if (INFO_KEYWORDS.some(k => normalized.includes(k))) {
    return buildCommand('INFORMATION', { 
      confidence: 0.95,
      desiredOutcome: 'dialogar com conselheiros e consultar o estado das fronteiras e do feudo'
    }, playerInput);
  }

  return buildCommand('UNKNOWN', { confidence: 0.5 }, playerInput);
}

function narrateReport(context: NarrativeContext): string {
  const report = context.executionResult;
  const loc = context.scene.locationId || 'Grey Keep';

  if (report.status === 'REJECTED') {
    if (report.reasonCode.includes('esclarecimento')) {
      return 'Antes de qualquer ação, preciso de um esclarecimento: o que exatamente deseja fazer?';
    }
    return `A ação solicitada não foi executada: ${report.reasonCode}`;
  }

  switch (report.actionExecuted) {
    case 'RECRUIT': {
      const levies = report.stateChanges.find(sc => sc.path === 'army.units.levies')?.delta ?? 0;
      return `O recrutamento foi autorizado: ${levies} soldados incorporados às suas forças, e o tesouro arcou com o ônus devido.`;
    }
    case 'BUILD': {
      const silverdew = report.stateChanges.find(sc => sc.path === 'weeklyLedger.silverdew')?.delta ?? 0;
      return `A construção foi autorizada: a paliçada avança sob as muralhas, custo total de ${Math.abs(silverdew)} SD.`;
    }
    case 'TRADE': {
      const foodChange = report.stateChanges.find(sc => sc.path === 'weeklyLedger.food')?.delta;
      if (foodChange !== undefined && typeof foodChange === 'number') {
        return foodChange < 0
          ? `O intendente concluiu a negociação com a caravana mercantil: as sacas de grãos foram entregues aos comboios e as moedas de prata ingressaram nos cofres de ferro da fortaleza.`
          : `A compra de provisões foi concluída junto aos mercadores e os suprimentos foram descarregados nos depósitos.`;
      }
      return 'As negociações comerciais foram autorizadas e registradas pelos intendentes da fortaleza.';
    }
    case 'ESPIONAGE': {
      const csq = report.consequences[0]?.description;
      if (csq) return csq;
      return 'A missão de reconhecimento foi executada e os batedores retornaram aos postos da fortaleza.';
    }
    case 'DIPLOMACY': {
      const csq = report.consequences[0]?.description;
      if (csq) return csq;
      return 'A comitiva formal concluiu a missão diplomática e apresentou os despachos oficiais perante a corte.';
    }
    case 'MILITARY': {
      const csq = report.consequences[0]?.description;
      if (csq) return csq;
      return 'O destacamento militar manobrou no terreno e estabeleceu a posição tática ordenada.';
    }
    case 'INFORMATION': {
      return `Mara e o Marechal Ren reúnem os pergaminhos sobre a mesa em ${loc}. As defesas permanecem sob vigilância e o conselho recomenda reforçar a guarda, fortificar as muralhas ou enviar batedores para sondar as fronteiras.`;
    }
    default:
      return 'A solicitação foi registrada e autorizada sem alteração mecânica.';
  }
}