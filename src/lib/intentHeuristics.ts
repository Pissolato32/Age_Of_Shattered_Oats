import {
  NarrativeCommand,
  NarrativeAction,
  NARRATIVE_CONTRACT_VERSION
} from './narrativeContracts';

export const RECRUIT_KEYWORDS = ['recrutar', 'recrute', 'recruta', 'contratar', 'contrate', 'contrata', 'alistar', 'homens de armas', 'soldados para a guarda'];
export const BUILD_KEYWORDS = ['construir', 'construa', 'construi', 'reparar', 'repare', 'erguer', 'fortificar', 'edificar', 'reforcar', 'reforçar', 'paliçada', 'palisade', 'muralha'];
export const TRAVEL_KEYWORDS = ['viajar', 'marchar', 'viagem', 'travel', 'march'];
export const TRADE_KEYWORDS = ['comprar', 'compre', 'compra', 'vender', 'venda', 'vende', 'trocar', 'comercio', 'comércio', 'buy', 'sell'];
export const ESPIONAGE_KEYWORDS = ['espi', 'infiltr', 'batedor', 'investig', 'sond', 'reconhecimento', 'vigi', 'aprofund', 'levantamento', 'averig'];
export const DIPLOMACY_KEYWORDS = ['comitiva', 'emissário', 'emissario', 'delegação', 'delegacao', 'diploma', 'trégua', 'tregua', 'pacto', 'aliança', 'alianca', 'tratado', 'negociar paz', 'acordo de paz', 'carta formal', 'mensagem formal'];
export const MILITARY_KEYWORDS = ['mobiliz', 'piquete', 'bloqueio', 'bloquear', 'cercar', 'cerco', 'emboscada', 'manobra militar', 'atacar', 'ataque', 'batalha', 'assalto', 'destacamento'];
export const IMPOSSIBLE_KEYWORDS = ['mato o rei', 'matar o rei', 'kill the king'];
export const CLARIFY_KEYWORDS = ['quero falar com ele', 'falar com alguém', 'falar com alguem'];
export const INFO_KEYWORDS = ['informe', 'relato', 'relate', 'conselho', 'situacao', 'situação', 'perfil', 'resumo', 'inspecione', 'inspecao', 'inspeção', 'avaliar', 'avaliacao', 'avaliação'];

export function extractLocationOrTarget(input: string): string | undefined {
  const cleaned = input.replace(/\b(?:uma?\s+)?(?:comitiva(?:\s+formal)?|mensagem(?:\s+formal)?|carta(?:\s+formal)?|pequeno\s+destacamento|destacamento|piquete|investigação|investigacao|espionagem|patrulha|sondagem|missão|missao|ação|acao)\b/gi, '');
  const match = /(?:(?:\b(?:para|em|na|no|ao)\b)|(?:\s+à\s+))\s*(?:a|o|as|os|um|uma)?\s*([a-zA-Z0-9À-ÿ\s]{3,30}?)(?:\.|\,|[;:]|$|\bsob\b|\bcom\b|\bquero\b|\bmas\b|\bevite\b|\bsem\b|\bcontinue\b|\bnão\b|\bnao\b)/i.exec(cleaned);
  if (!match) return undefined;
  const loc = match[1].trim();
  return loc.length >= 3 ? loc : undefined;
}

export function extractStance(input: string): NarrativeCommand['stance'] {
  if (/agressiv|ameaç|ameac|força|forca|hostil/i.test(input)) return 'AGGRESSIVE';
  if (/cautel|cuidad|prudente|ocult|evit|recu|defensiv|não\s+ataque|nao\s+ataque/i.test(input)) return 'CAUTIOUS';
  if (/diploma|acordo|negoci/i.test(input)) return 'DIPLOMATIC';
  if (/escond|furtiv|dissimul|mentir/i.test(input)) return 'DECEPTIVE';
  if (/honra|justo|leal/i.test(input)) return 'HONORABLE';
  return 'NEUTRAL';
}

export function buildCommand(
  action: NarrativeAction,
  overrides: Partial<NarrativeCommand> = {},
  playerInput = ''
): NarrativeCommand {
  const cmd: NarrativeCommand = {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    commandId: overrides.commandId || `mock-${action.toLowerCase()}-command`,
    actorId: overrides.actorId || 'player',
    action,
    targetId: overrides.targetId,
    objectId: overrides.objectId,
    locationId: overrides.locationId,
    magnitude: overrides.magnitude,
    motivation: overrides.motivation,
    desiredOutcome: overrides.desiredOutcome || overrides.objectId || playerInput,
    stance: overrides.stance || extractStance(playerInput),
    constraints: overrides.constraints || [],
    confidence: overrides.confidence ?? 1.0,
    ambiguity: overrides.ambiguity || [],
    requiresClarification: overrides.requiresClarification ?? false
  };
  if (overrides.parameters !== undefined) {
    return { ...cmd, parameters: overrides.parameters };
  }
  return cmd;
}

/**
 * Single Source of Truth para Heurísticas Canônicas de Interpretação Offline.
 * Utilizado de forma idêntica por MockNarrativeLLM e GeminiNarrativeLLM.fallbackInterpret().
 */
export function interpretIntentHeuristically(playerInput: string): NarrativeCommand {
  if (playerInput.trim().length === 0) {
    return buildCommand('UNKNOWN', {
      requiresClarification: true,
      ambiguity: ['Nenhuma ordem inserida pelo jogador'],
      confidence: 0.0
    }, playerInput);
  }

  const normalized = ` ${playerInput.trim().toLowerCase()} `;

  // 1. Silêncio Político Deliberado (PART 122.9)
  if (/^\s*\.{3,}\s*$|sil[eê]ncio|calado|nada digo|n[aã]o respondo|sem resposta/i.test(normalized)) {
    return buildCommand('DIPLOMACY', {
      stance: 'CAUTIOUS',
      desiredOutcome: 'Silêncio político deliberado / Omissão diplomática',
      confidence: 0.95,
      requiresClarification: false
    }, playerInput);
  }

  // 2. Ações Impossíveis / Violações
  if (IMPOSSIBLE_KEYWORDS.some(k => normalized.includes(k))) {
    return buildCommand('UNKNOWN', {}, playerInput);
  }

  // 3. Ambiguidade explícita
  if (CLARIFY_KEYWORDS.some(k => normalized.includes(k))) {
    return buildCommand('UNKNOWN', {
      requiresClarification: true,
      ambiguity: ['alvo da conversa não identificado'],
      confidence: 0.6
    }, playerInput);
  }

  // 4. Precedência Semântica: Consultas de Custo, Perguntas e Negações Rígidas -> INFORMATION
  const isQuestionOrCostInquiry =
    /\?/.test(playerInput) ||
    /quanto custa|qual o custo|como funciona|how much|qual regra|o que fazer|como estamos|qual a situa[cç][aã]o/.test(normalized);

  const hasPrimaryAction =
    ESPIONAGE_KEYWORDS.some(k => normalized.includes(k)) ||
    TRADE_KEYWORDS.some(k => normalized.includes(k)) ||
    RECRUIT_KEYWORDS.some(k => normalized.includes(k)) ||
    TRAVEL_KEYWORDS.some(k => normalized.includes(k)) ||
    DIPLOMACY_KEYWORDS.some(k => normalized.includes(k)) ||
    MILITARY_KEYWORDS.some(k => normalized.includes(k));

  const hasExplicitNegation = /n[aã]o inicie|sem iniciar|apenas informe|sem mover tropas|sem iniciar obras|apenas relate|fa[cç]a a inspe[cç][aã]o/i.test(normalized);

  if (isQuestionOrCostInquiry || hasExplicitNegation || (!hasPrimaryAction && /relat[oó]rio|informe-me|informe|inspe[cç][aã]o/i.test(normalized))) {
    return buildCommand('INFORMATION', { 
      confidence: 0.95,
      desiredOutcome: playerInput
    }, playerInput);
  }

  // 5. ESPIONAGE
  if (ESPIONAGE_KEYWORDS.some(k => normalized.includes(k))) {
    const loc = extractLocationOrTarget(playerInput);
    if (!loc) {
      return buildCommand('ESPIONAGE', {
        requiresClarification: true,
        ambiguity: ['alvo ou local de espionagem não identificado'],
        confidence: 0.6
      }, playerInput);
    }
    const stance = /cautel|sem combate|evit|vigia|sem se envolver/i.test(normalized) ? 'CAUTIOUS' : 'NEUTRAL';
    return buildCommand('ESPIONAGE', {
      locationId: loc,
      targetId: loc,
      stance,
      confidence: 0.95,
      desiredOutcome: playerInput
    }, playerInput);
  }

  // 6. DIPLOMACY
  if (DIPLOMACY_KEYWORDS.some(k => normalized.includes(k))) {
    const loc = extractLocationOrTarget(playerInput);
    return buildCommand('DIPLOMACY', {
      targetId: loc || 'destacamento da ponte',
      locationId: loc,
      stance: 'DIPLOMATIC',
      confidence: 0.95,
      desiredOutcome: playerInput
    }, playerInput);
  }

  const isWorkerOrBuildMobilization =
    (normalized.includes('trabalhador') ||
     normalized.includes('mao de obra') ||
     normalized.includes('aldren') ||
     normalized.includes('repar') ||
     normalized.includes('constru') ||
     normalized.includes('palisad') ||
     normalized.includes('torre') ||
     normalized.includes('madeira')) &&
    !normalized.includes('soldado') &&
    !normalized.includes('tropa') &&
    !normalized.includes('guarnicao') &&
    !normalized.includes('patrulha') &&
    !normalized.includes('roric') &&
    !normalized.includes('marechal') &&
    !/\bren\b/i.test(normalized);

  // 7. MILITARY (exclui obras de trabalhadores)
  if (MILITARY_KEYWORDS.some(k => normalized.includes(k)) && !isWorkerOrBuildMobilization) {
    const loc = extractLocationOrTarget(playerInput);
    const stance = /cautel|patrulh|bloqueio|piquete|defens|n[aã]o ataque/i.test(normalized) ? 'CAUTIOUS' : 'AGGRESSIVE';
    return buildCommand('MILITARY', {
      targetId: loc || 'destacamento da ponte',
      locationId: loc,
      stance,
      confidence: 0.95,
      desiredOutcome: playerInput
    }, playerInput);
  }

  // 8. TRADE (Compras e Vendas imperativas)
  if (TRADE_KEYWORDS.some(k => normalized.includes(k))) {
    const material = /madeira|tora|wood|timber/.test(normalized)
      ? 'timber'
      : /pedra|stone/.test(normalized)
        ? 'stone'
        : /ferro|iron/.test(normalized)
          ? 'iron'
          : /gr[aã]o|comida|suprimento|food|grain/.test(normalized)
            ? 'food'
            : undefined;

    return buildCommand('TRADE', {
      objectId: material || 'mantimentos',
      desiredOutcome: playerInput,
      confidence: 0.95
    }, playerInput);
  }

  // 9. RECRUIT
  if (RECRUIT_KEYWORDS.some(k => normalized.includes(k))) {
    const numMatch = normalized.match(/\b(\d+)\b/);
    const magnitude = numMatch
      ? { mode: 'FIXED' as const, value: parseInt(numMatch[1], 10) }
      : { mode: 'ENGINE_DETERMINED' as const };

    return buildCommand('RECRUIT', {
      magnitude,
      desiredOutcome: 'recrutar soldados para a guarnição',
      confidence: 0.95
    }, playerInput);
  }

  // 10. BUILD
  if (BUILD_KEYWORDS.some(k => normalized.includes(k)) || isWorkerOrBuildMobilization) {
    const structure = /palisad|palisade|torre|reparo|reforma/.test(normalized)
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

  // 11. TRAVEL
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

  // 12. Generic Information Fallback
  if (INFO_KEYWORDS.some(k => normalized.includes(k))) {
    return buildCommand('INFORMATION', { 
      confidence: 0.95,
      desiredOutcome: playerInput
    }, playerInput);
  }

  return buildCommand('UNKNOWN', { confidence: 0.5 }, playerInput);
}
