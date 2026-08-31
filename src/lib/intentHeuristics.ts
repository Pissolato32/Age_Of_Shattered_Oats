import {
  NarrativeCommand,
  NarrativeAction,
  NARRATIVE_CONTRACT_VERSION
} from './narrativeContracts';

export interface SemanticParsedInput {
  raw: string;
  normalized: string;
  addressee?: 'roric' | 'aldren' | 'gerold' | 'tobin' | 'ren' | 'mara';
  actionLemmas: {
    commerce: boolean;
    construction: boolean;
    espionage: boolean;
    diplomacy: boolean;
    military: boolean;
    recruit: boolean;
    travel: boolean;
    information: boolean;
  };
  entities: {
    material?: 'timber' | 'stone' | 'iron' | 'food' | 'mounts';
    structure?: 'palisade' | 'stone_wall' | 'gate' | 'tower';
    hasCivilianWorkers: boolean;
    hasMilitaryTroops: boolean;
  };
  modifiers: {
    isQuestion: boolean;
    hasCostInquiry: boolean;
    hasExplicitNegation: boolean;
    isSilence: boolean;
    isImpossible: boolean;
    requiresClarification: boolean;
  };
}

export function extractLocationOrTarget(input: string): string | undefined {
  // 1. Primary: Prepositional location/target extraction (e.g., "na encruzilhada da estrada norte", "na velha ponte de pedra")
  const cleaned = input.replace(/\b(?:uma?\s+)?(?:comitiva(?:\s+formal)?|mensagem(?:\s+formal)?|carta(?:\s+formal)?|pequeno\s+destacamento|destacamento|piquete|investigação|investigacao|espionagem|patrulha|sondagem|missão|missao|ação|acao|linha\s+de\s+contenção|movimentos|observadores)\b/gi, '');
  const match = /(?:(?:\b(?:em|na|no|ao|sobre|junto\s+a|junto\s+aos|da|do|das|dos|rumo\s+a|para(?!\s+[a-z]+(?:ar|er|ir)))\b)|(?:\s+à\s+))\s*(?:a|o|as|os|um|uma)?\s*([a-zA-Z0-9À-ÿ\s]{3,35}?)(?:\.|\,|[;:]|$|\bsob\b|\bcom\b|\bquero\b|\bmas\b|\bevite\b|\bsem\b|\bcontinue\b|\bnão\b|\bnao\b)/i.exec(cleaned);
  if (match) {
    const loc = match[1].trim();
    if (loc.length >= 3) return loc;
  }

  // 2. Fallback: Known landmarks and regions
  const landmarkMatch = input.match(/\b(?:velha\s+ponte\s+de\s+pedra|ponte\s+de\s+pedra|velha\s+ponte|ponte\s+velha|ponte)\b/i);
  if (landmarkMatch) return landmarkMatch[0].trim();
  if (/\bironpeak\b/i.test(input)) return 'Ironpeak';
  if (/\bcentral\s+plains\b/i.test(input)) return 'Central Plains';
  if (/\bdesfiladeiro\b/i.test(input)) return 'desfiladeiro';
  if (/\bestrada\s+(?:norte|real|sul|leste|oeste)\b/i.test(input)) {
    const m = input.match(/\bestrada\s+(?:norte|real|sul|leste|oeste)\b/i);
    return m ? m[0] : undefined;
  }
  if (/\bfronteira\s+(?:norte|sul|leste|oeste)\b/i.test(input)) {
    const m = input.match(/\bfronteira\s+(?:norte|sul|leste|oeste)\b/i);
    return m ? m[0] : undefined;
  }

  return undefined;
}

export function extractStance(input: string): NarrativeCommand['stance'] {
  if (/agressiv|ameaç|ameac|força|forca|hostil/i.test(input)) return 'AGGRESSIVE';
  if (/cautel|cuidad|prudente|ocult|evit|recu|defensiv|não\s+ataque|nao\s+ataque|sem\s+combate|sem\s+se\s+envolver|apenas\s+observe|sem\s+ser\s+notad|patrulh|discret|não\s+provoque|nao\s+provoque|sem\s+confronto/i.test(input)) return 'CAUTIOUS';
  if (/diploma|acordo|negoci|amig[aá]vel|tr[eé]gua/i.test(input)) return 'DIPLOMATIC';
  if (/escond|furtiv|dissimul|mentir/i.test(input)) return 'DECEPTIVE';
  if (/honra|justo|leal/i.test(input)) return 'HONORABLE';
  return 'NEUTRAL';
}

export function extractTemporalScope(input: string, currentTurn?: number): { mode: 'CURRENT_STATE' | 'HISTORICAL_POINT' | 'TEMPORAL_EVOLUTION'; targetTurn?: number } {
  const normalized = input.toLowerCase();

  // 1. Detecção de Evolução Temporal
  if (/como\s+(?:nossa\s+compreens[aã]o|a\s+situa[cç][aã]o|o\s+cen[aá]rio)\s+mudou|evolu[cç][aã]o|ao\s+longo\s+da\s+campanha|hist[oó]rico\s+completo/i.test(normalized)) {
    return { mode: 'TEMPORAL_EVOLUTION' };
  }

  // 2. Detecção de Ponto Histórico Específico por Turno/Semana
  const turnMatch = normalized.match(/\b(?:turno|semana|turn|week)\s+(\d+)\b/i);
  if (turnMatch) {
    const targetTurn = parseInt(turnMatch[1], 10);
    return { mode: 'HISTORICAL_POINT', targetTurn };
  }

  // 3. Detecção de Retrospectiva Relativa (ex: antes de descobrirmos)
  if (/antes\s+de\s+(?:descobrirmos|confirmarmos|saber)|naquela\s+[eé]poca|no\s+passado|originalmente|inicialmente|primeiro\s+levantamento/i.test(normalized)) {
    return { mode: 'HISTORICAL_POINT', targetTurn: 9 }; // Ponto do levantamento inicial da campanha
  }

  // 4. Padrão: Estado Atual
  return { mode: 'CURRENT_STATE', targetTurn: currentTurn };
}

export function parseSemanticInput(playerInput: string): SemanticParsedInput {
  const raw = playerInput.trim();
  const normalized = ` ${raw.toLowerCase()} `;

  // 1. Addressee Detection (Agents)
  let addressee: SemanticParsedInput['addressee'] = undefined;
  if (/\broric\b/i.test(normalized)) addressee = 'roric';
  else if (/\baldren\b/i.test(normalized)) addressee = 'aldren';
  else if (/\bgerold\b/i.test(normalized)) addressee = 'gerold';
  else if (/\btobin\b/i.test(normalized)) addressee = 'tobin';
  else if (/\b(?:marechal|ren)\b/i.test(normalized)) addressee = 'ren';
  else if (/\bmara\b/i.test(normalized)) addressee = 'mara';

  // 2. Functional Action Lemmas (Morphological families with c/ç, c/qu, g/gu alternations)
  const normalizedForActions = normalized
    .replace(/\b(?:torre|posto|cabana)\s+de\s+vigia\b/gi, 'torre_vigia')
    .replace(/\blinha\s+de\s+conten[cç][aã]o\b/gi, 'linha_contencao');

  const actionLemmas: SemanticParsedInput['actionLemmas'] = {
    commerce: /\b(compr|adquir|pag|desembols|abaste[cç]|vend|tro[cq]|arremat|comercio|comércio|buy|sell|despach)[a-z]*\b/i.test(normalizedForActions),
    construction: /\b(constru|repar|refor[çc]|reform|edifi[cq]|conser|ergu|fortifi[cq]|nivel|empalissad)[a-z]*\b/i.test(normalizedForActions),
    espionage: (!/\b(?:n[aã]o|nao)\s+(?:fa[cç]a\s+)?(?:uma\s+|nenhuma\s+)?(?:nova\s+)?(?:investig|espion)[a-z]*/i.test(normalized)) && (!/\bsem\s+(?:uma\s+|nenhuma\s+)?(?:nova\s+)?(?:investig|espion)[a-z]*/i.test(normalized)) && (/\b(espi|infiltr|rastre|sond|averig|investig|vigi|avist|observ|acompanh|reconhec)[a-z]*\b|\bencalço\b|\bencalco\b|\bpegadas\b/i.test(normalizedForActions)),
    diplomacy: /\b(negoci|acord|tratad|pact|alian[çc]|tr[eé]gu|emiss[aá]ri|represent|delega[çc]|diploma)[a-z]*\b|\bsolu[cç][aã]o amig[aá]vel\b|\bcarta formal\b|\bmensagem formal\b|\bsalva-conduto\b/i.test(normalizedForActions),
    military: /\b(guarne[cç]|bloque|cer[cq]|embosc|assalt|piquet|manobra militar|mobiliz)[a-z]*\b|\blinha_contencao\b|\bposi[cç][aã]o t[aá]tic[a-z]*\b|\b(atac|ataqu|combater|enfrentar)[a-z]*\b/i.test(normalizedForActions),
    recruit: /\b(recrut|alist|contrat)[a-z]*\b/i.test(normalizedForActions),
    travel: /\b(viaj|march|desloc)[a-z]*\b/i.test(normalizedForActions),
    information: /\b(inform|relat|inspec|avali|consult|compar|diga-me|me diga|qual era|o que sabemos)[a-z]*\b/i.test(normalizedForActions)
  };

  // 3. Resources and Entities
  let material: SemanticParsedInput['entities']['material'] = undefined;
  if (/\b(madeira|tora|wood|timber)[a-z]*\b/i.test(normalized)) material = 'timber';
  else if (/\b(pedra|stone|cantaria)[a-z]*\b/i.test(normalized)) material = 'stone';
  else if (/\b(ferro|iron|min[eé]rio)[a-z]*\b/i.test(normalized)) material = 'iron';
  else if (/\b(gr[aã]o|centeio|trigo|comida|suprimento|food|grain|mantimento|carregamento)[a-z]*\b/i.test(normalized)) material = 'food';
  else if (/\b(cavalo|horse|destrier|courser|rouncey)[a-z]*\b/i.test(normalized)) material = 'mounts';

  let structure: SemanticParsedInput['entities']['structure'] = undefined;
  if (/\b(palisad|paliçada|palisade|estacada)[a-z]*\b/i.test(normalized)) structure = 'palisade';
  else if (/\b(muralha|muro|stone_wall)[a-z]*\b/i.test(normalized)) structure = 'stone_wall';
  else if (/\b(port[aã]o|gate)[a-z]*\b/i.test(normalized)) structure = 'gate';
  else if (/\b(torre|tower)[a-z]*\b/i.test(normalized)) structure = 'tower';

  const hasCivilianWorkers = /\b(trabalhador|artes[aã]o|carpinteiro|pedreiro|m[aã]o de obra)[a-z]*\b/i.test(normalized);
  const hasMilitaryTroops = /\b(soldado|tropa|lanceiro|infantaria|guarda|homens de armas|piquete|patrulha)[a-z]*\b/i.test(normalized);

  // 4. Modifiers & Edge Cases
  const isSilence = /^\s*\.{3,}\s*$|sil[eê]ncio|calado|nada digo|n[aã]o respondo|sem resposta/i.test(normalized);
  const isImpossible = /\bmato o rei\b|\bmatar o rei\b|\bkill the king\b/i.test(normalized);
  const requiresClarification = /\bquero falar com ele\b|\bfalar com algu[eé]m\b/i.test(normalized);
  const isQuestion = /\?/.test(raw);
  const hasCostInquiry = /quanto custa|qual o custo|como funciona|how much|qual regra|o que fazer|como estamos|qual a situa[cç][aã]o|como est[aá] a situa[cç][aã]o|o que sabemos|onde estamos|temos\s+(?:um\s+)?acampamento|a\s+esmo|como\s+est[aã]o\s+as\s+coisas|qual\s+(?:o\s+)?estado|qual\s+a\s+condi[cç][aã]o/i.test(normalized);
  const hasExplicitNegation = /n[aã]o inicie|sem iniciar|apenas informe|sem mover tropas|sem iniciar obras|apenas relate|fa[cç]a a inspe[cç][aã]o|n[aã]o fa[cç]a (?:uma\s+|nenhuma\s+)?(?:nova\s+)?investiga|sem (?:uma\s+|nenhuma\s+)?(?:nova\s+)?investiga|apenas compare|compare apenas|recuperar o conhecimento|recuperar um assunto|qual era a situa[cç][aã]o/i.test(normalized);

  return {
    raw,
    normalized,
    addressee,
    actionLemmas,
    entities: {
      material,
      structure,
      hasCivilianWorkers,
      hasMilitaryTroops
    },
    modifiers: {
      isQuestion,
      hasCostInquiry,
      hasExplicitNegation,
      isSilence,
      isImpossible,
      requiresClarification
    }
  };
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
 * Single Source of Truth para Resolução Semântica por Papéis (Semantic Role Resolution).
 * Separação estrita entre Agente, Verbo de Ação, Objeto/Recurso e Alvo.
 */
export function interpretIntentHeuristically(playerInput: string): NarrativeCommand {
  if (playerInput.trim().length === 0) {
    return buildCommand('UNKNOWN', {
      requiresClarification: true,
      ambiguity: ['Nenhuma ordem inserida pelo jogador'],
      confidence: 0.0
    }, playerInput);
  }

  const parsed = parseSemanticInput(playerInput);
  const { normalized, addressee, actionLemmas, entities, modifiers } = parsed;

  // 1. Silêncio Político Deliberado (PART 122.9)
  if (modifiers.isSilence) {
    return buildCommand('DIPLOMACY', {
      stance: 'CAUTIOUS',
      desiredOutcome: 'Silêncio político deliberado / Omissão diplomática',
      confidence: 0.95,
      requiresClarification: false
    }, playerInput);
  }

  // 2. Ações Impossíveis / Violações Rígidas
  if (modifiers.isImpossible) {
    return buildCommand('UNKNOWN', {}, playerInput);
  }

  // 3. Ambiguidade explícita
  if (modifiers.requiresClarification) {
    return buildCommand('UNKNOWN', {
      requiresClarification: true,
      ambiguity: ['alvo da conversa não identificado'],
      confidence: 0.6
    }, playerInput);
  }

  // 4. Cláusulas Compostas com Negação Rígida + Ação de Observação
  // Ex: "Roric, não ataque a ponte; apenas observe os movimentos" -> ESPIONAGE (CAUTIOUS)
  if (modifiers.hasExplicitNegation || /n[aã]o ataque|sem combate|sem lutar/i.test(normalized)) {
    if (actionLemmas.espionage || /apenas observe|apenas vigie/i.test(normalized)) {
      const loc = extractLocationOrTarget(playerInput);
      return buildCommand('ESPIONAGE', {
        locationId: loc,
        targetId: loc,
        stance: 'CAUTIOUS',
        confidence: 0.95,
        desiredOutcome: playerInput
      }, playerInput);
    }
  }

  // 5. Consultas Puras de Custo, Regras ou Negação de Obras -> INFORMATION
  const hasSubstantiveAction =
    actionLemmas.commerce ||
    actionLemmas.construction ||
    actionLemmas.espionage ||
    actionLemmas.diplomacy ||
    actionLemmas.military ||
    actionLemmas.recruit ||
    actionLemmas.travel;

  if (
    modifiers.isQuestion ||
    modifiers.hasCostInquiry ||
    modifiers.hasExplicitNegation ||
    (!hasSubstantiveAction && actionLemmas.information)
  ) {
    return buildCommand('INFORMATION', {
      confidence: 0.95,
      desiredOutcome: playerInput
    }, playerInput);
  }

  // 6. Ação Verbal Explícita: DIPLOMACY vs COMMERCE
  // Prevalece DIPLOMACY se houver termos políticos (barão, corte, trégua, tratado, emissário, aliança, paz)
  const isPoliticalDiplomacy = /\b(bar[aã]o|lorde|rei|corte|tr[eé]gua|alian[çc]|pacto|tratado|nobre|fronteira|paz|emiss[aá]ri|represent|delega[çc]|diploma|salva-conduto)\b/i.test(normalized);
  const isCommercialNegotiation = actionLemmas.commerce || /\b(pre[cç]o|valor|custo|moeda|mercado|comboio|carregamento|saca|mantimento)\b/i.test(normalized);

  if (actionLemmas.diplomacy && isPoliticalDiplomacy) {
    const loc = extractLocationOrTarget(playerInput);
    return buildCommand('DIPLOMACY', {
      targetId: loc || 'destacamento da ponte',
      locationId: loc,
      stance: extractStance(playerInput) === 'NEUTRAL' ? 'DIPLOMATIC' : extractStance(playerInput),
      confidence: 0.95,
      desiredOutcome: playerInput
    }, playerInput);
  }

  // 7. Ação Verbal Explícita: COMMERCE / TRADE
  // Prevalece sobre recursos isolados e agentes (ex: "Roric, compre madeira...", "Adquira toras...", "Negocie o preço")
  if (actionLemmas.commerce || (actionLemmas.diplomacy && isCommercialNegotiation)) {
    const obj = entities.material || 'mantimentos';
    return buildCommand('TRADE', {
      objectId: obj,
      desiredOutcome: playerInput,
      confidence: 0.95
    }, playerInput);
  }

  // 7b. DIPLOMACY Fallback (para outros termos diplomáticos sem menção política explícita)
  if (actionLemmas.diplomacy) {
    const loc = extractLocationOrTarget(playerInput);
    return buildCommand('DIPLOMACY', {
      targetId: loc || 'destacamento da ponte',
      locationId: loc,
      stance: extractStance(playerInput) === 'NEUTRAL' ? 'DIPLOMATIC' : extractStance(playerInput),
      confidence: 0.95,
      desiredOutcome: playerInput
    }, playerInput);
  }

  // 8. Ação Verbal Explícita: RECRUIT
  if (actionLemmas.recruit) {
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

  // 9. Ação Verbal Explícita: CONSTRUCTION / BUILD
  // Prevalece se houver verbo de construção ou reparo
  if (actionLemmas.construction) {
    const structure = entities.structure || (entities.material === 'timber' ? 'palisade' : entities.material === 'stone' ? 'stone_wall' : undefined);
    if (!structure) {
      return buildCommand('BUILD', {
        requiresClarification: true,
        ambiguity: ['estrutura a construir não identificada'],
        confidence: 0.6
      }, playerInput);
    }
    return buildCommand('BUILD', {
      commandId: `mock-build-${structure}`,
      objectId: structure,
      desiredOutcome: `construir ${structure}`,
      confidence: 0.95
    }, playerInput);
  }

  // 10. Ação Verbal Explícita: TRAVEL
  if (actionLemmas.travel) {
    if (!/central plains|fronteira/i.test(normalized)) {
      return buildCommand('TRAVEL', {
        requiresClarification: true,
        ambiguity: ['destino da viagem não identificado'],
        confidence: 0.6
      }, playerInput);
    }
    const loc = extractLocationOrTarget(playerInput);
    return buildCommand('TRAVEL', {
      locationId: loc || 'Central Plains',
      confidence: 0.9
    }, playerInput);
  }

  // 11. Ação Verbal Explícita: ESPIONAGE (exclui patrulhas armadas de tropas regulares)
  if (actionLemmas.espionage && (!entities.hasMilitaryTroops || /batedor|espi|infiltr|sond|rastre|reconhec/i.test(normalized))) {
    const loc = extractLocationOrTarget(playerInput);
    if (!loc && !addressee) {
      return buildCommand('ESPIONAGE', {
        requiresClarification: true,
        ambiguity: ['alvo ou local de espionagem não identificado'],
        confidence: 0.6
      }, playerInput);
    }
    const stance = extractStance(playerInput);
    return buildCommand('ESPIONAGE', {
      locationId: loc,
      targetId: loc,
      stance,
      confidence: 0.95,
      desiredOutcome: playerInput
    }, playerInput);
  }

  // 12. Desambiguação de Mobilização: MILITARY vs BUILD
  if (actionLemmas.military) {
    // Se mobilização explícita for de trabalhadores civis sem tropas militares -> BUILD
    if (entities.hasCivilianWorkers && !entities.hasMilitaryTroops && !actionLemmas.military) {
      const structure = entities.structure || 'palisade';
      return buildCommand('BUILD', {
        commandId: `mock-build-${structure}`,
        objectId: structure,
        desiredOutcome: `construir ${structure}`,
        confidence: 0.95
      }, playerInput);
    }

    const loc = extractLocationOrTarget(playerInput);
    const stance = extractStance(playerInput) === 'NEUTRAL' ? 'AGGRESSIVE' : extractStance(playerInput);
    return buildCommand('MILITARY', {
      targetId: loc || 'destacamento da ponte',
      locationId: loc,
      stance,
      confidence: 0.95,
      desiredOutcome: playerInput
    }, playerInput);
  }

  // 13. AGENT AFFORDANCE DESEMPATE (Apenas quando não houver verbo de ação explícito)
  if (addressee === 'roric') {
    const loc = extractLocationOrTarget(playerInput);
    return buildCommand('ESPIONAGE', {
      locationId: loc,
      targetId: loc,
      stance: extractStance(playerInput),
      confidence: 0.85,
      desiredOutcome: playerInput
    }, playerInput);
  }

  if (addressee === 'aldren') {
    const structure = entities.structure || 'palisade';
    return buildCommand('BUILD', {
      commandId: `mock-build-${structure}`,
      objectId: structure,
      desiredOutcome: playerInput,
      confidence: 0.85
    }, playerInput);
  }

  if (addressee === 'gerold') {
    return buildCommand('TRADE', {
      objectId: entities.material || 'mantimentos',
      desiredOutcome: playerInput,
      confidence: 0.85
    }, playerInput);
  }

  if (addressee === 'tobin') {
    const loc = extractLocationOrTarget(playerInput);
    return buildCommand('DIPLOMACY', {
      targetId: loc,
      locationId: loc,
      stance: 'DIPLOMATIC',
      confidence: 0.85,
      desiredOutcome: playerInput
    }, playerInput);
  }

  if (addressee === 'ren') {
    const loc = extractLocationOrTarget(playerInput);
    return buildCommand('MILITARY', {
      targetId: loc,
      locationId: loc,
      confidence: 0.85,
      desiredOutcome: playerInput
    }, playerInput);
  }

  // 14. Fallback Seguro -> UNKNOWN
  return buildCommand('UNKNOWN', { confidence: 0.5 }, playerInput);
}
