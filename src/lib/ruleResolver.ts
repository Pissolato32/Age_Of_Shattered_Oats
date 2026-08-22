import { searchCodex, CodexSearchResult, StructuredCodexNode } from './codexRetriever';
import { CampaignState } from '../types';
import { globalRNG } from '../core/RandomService';

export interface RuleCondition {
  condition: string;
  result: boolean;
  actualValue?: string | number;
  requiredValue?: string | number;
}

export interface RuleEffect {
  resource: string;
  delta: number | string;
}

export interface EvidenceItem {
  nodeId: string;
  book: string;
  part: string;
  section: string;
  pageStart: number;
  pageEnd: number;
  title: string;
  score: number;
  authority: 'CANON';
  type: 'RULE' | 'TABLE' | 'DIRECTIVE' | 'SECTION';
}

export interface RuleResolutionResult {
  intent: 'RECRUIT' | 'CRAFT' | 'BUILD' | 'TRAVEL' | 'TRADE' | 'FLAVOR_INQUIRY' | 'UNKNOWN_MECHANIC' | 'INFORMATION';
  decision: 'ALLOWED' | 'DENIED' | 'NOT_FOUND' | 'AMBIGUOUS';
  authority: 'CODEX' | 'AUXILIARY_WEB' | 'NOT_FOUND';
  canonRule?: {
    id: string;
    part: string;
    section: string;
    title: string;
    book: string;
  };
  conditions: RuleCondition[];
  effects: RuleEffect[];
  evidence: EvidenceItem[];
  mechanicalAllowed: boolean;
  decisionReason: string;
  webFlavorAllowed: boolean;
}

/**
 * Normaliza e sanitiza a string de ação contra Prompt Injection e textos maliciosos.
 */
function sanitizeActionText(rawText: string): string {
  if (!rawText) return "";
  let text = rawText;
  
  // Neutralizar tentativas de prompt injection comuns
  text = text.replace(/ignore\s+(the\s+)?(game\s+)?rules/gi, "[INJECTION_BLOCKED]")
             .replace(/system\s+override/gi, "[INJECTION_BLOCKED]")
             .replace(/set\s+\w+\s*=\s*\d+/gi, "[INJECTION_BLOCKED]");
             
  return text;
}

/**
 * Rule Resolver Determinístico de Alta Fidelidade (AOS V4.7)
 * 
 * Etapas de Resolução:
 * 1. Sanitização e Parse de Intenção do Jogador (RECRUIT, CRAFT, BUILD, TRAVEL, TRADE, FLAVOR, UNKNOWN).
 * 2. Busca Lexical Estruturada no Codex Canon para vincular à PART/RULE exata.
 * 3. Avaliação Determinística de Condições contra o World Ledger (Manpower, Silverdew, Materiais).
 * 4. Cálculo de Efeitos Mecânicos (Deltas de recursos).
 * 5. Emissão de Decisão: ALLOWED, DENIED, NOT_FOUND ou AMBIGUOUS com Evidências Canon.
 */
export function resolveAction(userActionRaw: string, worldState?: CampaignState): RuleResolutionResult {
  const userAction = sanitizeActionText(userActionRaw);

  if (!userAction || userAction.trim().length === 0) {
    return {
      intent: 'UNKNOWN_MECHANIC',
      decision: 'NOT_FOUND',
      authority: 'NOT_FOUND',
      conditions: [],
      effects: [],
      evidence: [],
      mechanicalAllowed: false,
      decisionReason: 'Ação vazia ou não especificada.',
      webFlavorAllowed: false
    };
  }

  const lowerAction = userAction.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // --------------------------------------------------------------------------
  // CASO A: Detector de Itens/Mecânicas Inexistentes no Codex (Ex: Aço Valiriano)
  // --------------------------------------------------------------------------
  const fantasyKeywords = ['valiriano', 'valyrian', 'adamantium', 'mithril', 'pocao', 'magia negra', 'dragao magico', 'dragao'];
  for (const word of fantasyKeywords) {
    if (lowerAction.includes(word)) {
      return {
        intent: 'UNKNOWN_MECHANIC',
        decision: 'NOT_FOUND',
        authority: 'NOT_FOUND',
        conditions: [
          { condition: `Elemento '${word}' existe no Codex Canon`, result: false }
        ],
        effects: [],
        evidence: [],
        mechanicalAllowed: false,
        decisionReason: `O elemento '${word}' não existe no Codex de Age of Shattered Oaths. Pelo princípio do sistema fechado (AGENTS.md), o resultado é falha mecânica imediata.`,
        webFlavorAllowed: true
      };
    }
  }
  if (/\bmana\b/i.test(lowerAction)) {
    return {
      intent: 'UNKNOWN_MECHANIC',
      decision: 'NOT_FOUND',
      authority: 'NOT_FOUND',
      conditions: [{ condition: "Elemento 'mana' existe no Codex Canon", result: false }],
      effects: [],
      evidence: [],
      mechanicalAllowed: false,
      decisionReason: `O elemento 'mana' não existe no Codex.`,
      webFlavorAllowed: true
    };
  }

  // --------------------------------------------------------------------------
  // CASO B: Pergunta de Flavor / Etiqueta (Ex: Protocolo de apresentação feudal)
  // --------------------------------------------------------------------------
  if (lowerAction.includes('protocolo') || lowerAction.includes('apresentacao') || lowerAction.includes('etiqueta') || lowerAction.includes('como um nobre') || lowerAction.includes('costumes') || lowerAction.includes('banquete') || lowerAction.includes('como seria') || lowerAction.includes('caravanas')) {
    const codexMatches = searchCodex(userAction, { limit: 2 });
    const evidence: EvidenceItem[] = codexMatches.map(m => ({
      nodeId: m.node.id,
      book: m.node.book,
      part: m.node.part,
      section: m.node.section,
      pageStart: m.node.pageStart,
      pageEnd: m.node.pageEnd,
      title: m.node.title,
      score: m.score,
      authority: 'CANON',
      type: m.node.type
    }));

    return {
      intent: 'FLAVOR_INQUIRY',
      decision: 'NOT_FOUND',
      authority: codexMatches.length > 0 ? 'CODEX' : 'AUXILIARY_WEB',
      conditions: [],
      effects: [],
      evidence,
      mechanicalAllowed: false,
      decisionReason: 'Consulta de contexto narrativo e cultura. Nenhuma alteração mecânica ou de recursos é requerida.',
      webFlavorAllowed: true
    };
  }

  // --------------------------------------------------------------------------
  // CASO INFORMATIVO: Consultas de Preço/Regra (Sem dedução de saldos)
  // --------------------------------------------------------------------------
  if (lowerAction.includes('quanto') || lowerAction.includes('preco') || lowerAction.includes('como funciona') || lowerAction.includes('saber quanto')) {
    const codexMatches = searchCodex(userAction, { limit: 3 });
    const topNode = codexMatches.length > 0 ? codexMatches[0].node : null;
    const evidence: EvidenceItem[] = codexMatches.map(m => ({
      nodeId: m.node.id,
      book: m.node.book,
      part: m.node.part,
      section: m.node.section,
      pageStart: m.node.pageStart,
      pageEnd: m.node.pageEnd,
      title: m.node.title,
      score: m.score,
      authority: 'CANON',
      type: m.node.type
    }));

    return {
      intent: 'INFORMATION',
      decision: 'ALLOWED',
      authority: 'CODEX',
      canonRule: topNode ? { id: topNode.id, part: topNode.part, section: topNode.section, title: topNode.title, book: topNode.book } : undefined,
      conditions: [{ condition: "Consulta de regra canon", result: true }],
      effects: [],
      evidence,
      mechanicalAllowed: true,
      decisionReason: "Consulta informativa de regras do Codex Canon. Nenhuma alteração mecânica de saldo foi realizada.",
      webFlavorAllowed: true
    };
  }

  // --------------------------------------------------------------------------
  // CASO C: Intenção RECRUIT (Recrutamento de Tropas)
  // --------------------------------------------------------------------------
  if (lowerAction.includes('recrut') || lowerAction.includes('contrat') || lowerAction.includes('infantaria') || lowerAction.includes('soldado')) {
    // Buscar especificamente a regra de recrutamento (Part 40 / Part 18)
    const codexMatches = searchCodex("Part 40 RECRUITMENT RETINUE GROWTH", { limit: 3 });
    const topNode = codexMatches.length > 0 ? codexMatches[0].node : null;

    const quantityMatch = userAction.match(/\b(\d+)\b/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 10;
    
    if (quantity <= 0) {
      return {
        intent: 'RECRUIT',
        decision: 'DENIED',
        authority: 'CODEX',
        canonRule: topNode ? { id: topNode.id, part: topNode.part, section: topNode.section, title: topNode.title, book: topNode.book } : undefined,
        conditions: [{ condition: "Quantidade de recrutamento maior que zero", result: false }],
        effects: [],
        evidence: [],
        mechanicalAllowed: false,
        decisionReason: "Recrutamento RECUSADO. A quantidade de soldados deve ser de no mínimo 1.",
        webFlavorAllowed: true
      };
    }
    const unitCostSD = 3; // Custo canon base por soldado
    const totalCostSD = quantity * unitCostSD;

    const evidence: EvidenceItem[] = codexMatches.map(m => ({
      nodeId: m.node.id,
      book: m.node.book,
      part: m.node.part,
      section: m.node.section,
      pageStart: m.node.pageStart,
      pageEnd: m.node.pageEnd,
      title: m.node.title,
      score: m.score,
      authority: 'CANON',
      type: m.node.type
    }));

    // Se temos um World State disponível, validamos condições materiais
    if (worldState) {
      const currentSD = worldState.weeklyLedger.silverdew;
      const laborPool = worldState.holdings.laborPool;

      const condSD = {
        condition: `Tesouraria Silverdew (${currentSD} SD) >= Custo Total (${totalCostSD} SD)`,
        result: currentSD >= totalCostSD,
        actualValue: currentSD,
        requiredValue: totalCostSD
      };

      const condLabor = {
        condition: `Mão de Obra Disponível (${laborPool}) >= Quantidade Solicitada (${quantity})`,
        result: laborPool >= quantity,
        actualValue: laborPool,
        requiredValue: quantity
      };

      const allConditionsMet = condSD.result && condLabor.result;

      if (!allConditionsMet) {
        return {
          intent: 'RECRUIT',
          decision: 'DENIED',
          authority: 'CODEX',
          canonRule: topNode ? {
            id: topNode.id,
            part: topNode.part,
            section: topNode.section,
            title: topNode.title,
            book: topNode.book
          } : undefined,
          conditions: [condSD, condLabor],
          effects: [],
          evidence,
          mechanicalAllowed: false,
          decisionReason: `Recrutamento RECUSADO (DENIED). Recursos ou mão de obra insuficientes no World Ledger (Requer: ${totalCostSD} SD e ${quantity} homens).`,
          webFlavorAllowed: true
        };
      }

      return {
        intent: 'RECRUIT',
        decision: 'ALLOWED',
        authority: 'CODEX',
        canonRule: topNode ? {
          id: topNode.id,
          part: topNode.part,
          section: topNode.section,
          title: topNode.title,
          book: topNode.book
        } : undefined,
        conditions: [condSD, condLabor],
        effects: [
          { resource: 'weeklyLedger.silverdew', delta: -totalCostSD },
          { resource: 'holdings.laborPool', delta: -quantity },
          { resource: 'army.units.levies', delta: +quantity }
        ],
        evidence,
        mechanicalAllowed: true,
        decisionReason: `Recrutamento AUTORIZADO (ALLOWED) pela Part 40 do Codex. Custo: ${totalCostSD} SD para ${quantity} tropas.`,
        webFlavorAllowed: true
      };
    }

    // Se não há worldState passado (consulta estática de regras), confirma a existência da regra
    return {
      intent: 'RECRUIT',
      decision: 'ALLOWED',
      authority: 'CODEX',
      canonRule: topNode ? {
        id: topNode.id,
        part: topNode.part,
        section: topNode.section,
        title: topNode.title,
        book: topNode.book
      } : undefined,
      conditions: [
        { condition: "Part 40 Recruitment Rules Present", result: true }
      ],
      effects: [
        { resource: 'silverdew', delta: `-${totalCostSD} SD` },
        { resource: 'army', delta: `+${quantity} tropas` }
      ],
      evidence,
      mechanicalAllowed: true,
      decisionReason: `Regra de recrutamento de tropas validada na Part 40 (Págs 159-164). Requer validação de saldo ao executar no World Ledger.`,
      webFlavorAllowed: true
    };
  }

  // --------------------------------------------------------------------------
  // CASO D: Intenção BUILD (Construção de Fortificações / Edificações)
  // --------------------------------------------------------------------------
  if (lowerAction.includes('constru') || lowerAction.includes('palisada') || lowerAction.includes('fortifica') || lowerAction.includes('muralha')) {
    const codexMatches = searchCodex("Part 54 SIEGE FORTIFICATIONS", { limit: 3 });
    const topNode = codexMatches.length > 0 ? codexMatches[0].node : null;

    const isStoneWall = lowerAction.includes('pedra') || lowerAction.includes('muralha');
    const reqTimber = isStoneWall ? 40 : 20;
    const reqStone = isStoneWall ? 50 : 10;
    const reqSD = isStoneWall ? 200 : 50;

    const evidence: EvidenceItem[] = codexMatches.map(m => ({
      nodeId: m.node.id,
      book: m.node.book,
      part: m.node.part,
      section: m.node.section,
      pageStart: m.node.pageStart,
      pageEnd: m.node.pageEnd,
      title: m.node.title,
      score: m.score,
      authority: 'CANON',
      type: m.node.type
    }));

    if (worldState) {
      const curTimber = worldState.weeklyLedger.materials.timber;
      const curStone = worldState.weeklyLedger.materials.stone;
      const curSD = worldState.weeklyLedger.silverdew;

      const condTimber = { condition: `Madeira (${curTimber}) >= ${reqTimber}`, result: curTimber >= reqTimber };
      const condStone = { condition: `Pedra (${curStone}) >= ${reqStone}`, result: curStone >= reqStone };
      const condSD = { condition: `Silverdew (${curSD} SD) >= ${reqSD} SD`, result: curSD >= reqSD };

      const allowed = condTimber.result && condStone.result && condSD.result;

      return {
        intent: 'BUILD',
        decision: allowed ? 'ALLOWED' : 'DENIED',
        authority: 'CODEX',
        canonRule: topNode ? {
          id: topNode.id,
          part: topNode.part,
          section: topNode.section,
          title: topNode.title,
          book: topNode.book
        } : undefined,
        conditions: [condTimber, condStone, condSD],
        effects: allowed ? [
          { resource: 'materials.timber', delta: -reqTimber },
          { resource: 'materials.stone', delta: -reqStone },
          { resource: 'weeklyLedger.silverdew', delta: -reqSD }
        ] : [],
        evidence,
        mechanicalAllowed: allowed,
        decisionReason: allowed 
          ? `Construção AUTORIZADA pela Part 54 do Codex.`
          : `Construção RECUSADA (DENIED). Materiais insuficientes no World Ledger (Requer: ${reqTimber} madeira, ${reqStone} pedra, ${reqSD} SD).`,
        webFlavorAllowed: true
      };
    }

    return {
      intent: 'BUILD',
      decision: 'ALLOWED',
      authority: 'CODEX',
      canonRule: topNode ? {
        id: topNode.id,
        part: topNode.part,
        section: topNode.section,
        title: topNode.title,
        book: topNode.book
      } : undefined,
      conditions: [{ condition: "Part 54 Siege & Fortifications Rules Present", result: true }],
      effects: [{ resource: 'holdings.fortification', delta: '+1 Palisade Tier' }],
      evidence,
      mechanicalAllowed: true,
      decisionReason: `Regra de fortificação encontrada na Part 54 (Págs 177-182).`,
      webFlavorAllowed: true
    };
  }

  // --------------------------------------------------------------------------
  // CASO E: Intenção TRADE / TAXES (Coleta de Impostos, Comércio, Compras)
  // --------------------------------------------------------------------------
  if (
    lowerAction.includes('imposto') ||
    lowerAction.includes('coletar') ||
    lowerAction.includes('silverdew semanal') ||
    lowerAction.includes('comprar') ||
    lowerAction.includes('compra') ||
    lowerAction.includes('compre') ||
    lowerAction.includes('trocar') ||
    lowerAction.includes('vender') ||
    lowerAction.includes('venda') ||
    lowerAction.includes('vende') ||
    lowerAction.includes('negociar') ||
    lowerAction.includes('negocie') ||
    lowerAction.includes('comercio') ||
    lowerAction.includes('comércio')
  ) {
    const codexMatches = searchCodex("Part 70 WEEKLY INCOME ECONOMIC CYCLE", { limit: 3 });
    const topNode = codexMatches.length > 0 ? codexMatches[0].node : null;

    const evidence: EvidenceItem[] = codexMatches.map(m => ({
      nodeId: m.node.id,
      book: m.node.book,
      part: m.node.part,
      section: m.node.section,
      pageStart: m.node.pageStart,
      pageEnd: m.node.pageEnd,
      title: m.node.title,
      score: m.score,
      authority: 'CANON',
      type: m.node.type
    }));

    let effects: RuleEffect[] = [];
    let decisionReason = `Operação comercial ou coleta autorizada pela Part 70 do Codex Canon (Págs 212-218).`;
    let allowed = true;
    const conditions: RuleCondition[] = [
      { condition: "Part 70 Weekly Income Rules Present", result: true }
    ];

    if (lowerAction.includes('imposto') || lowerAction.includes('coletar')) {
      effects = [{ resource: 'weeklyLedger.silverdew', delta: 50 }];
    } else if (lowerAction.includes('vender') || lowerAction.includes('venda')) {
      // Venda de Grãos / Alimentos
      const numMatch = userAction.match(/\b(\d+)\b/);
      const qty = numMatch ? parseInt(numMatch[1], 10) : 10;
      const unitPrice = 2.5;
      const totalSd = Math.floor(qty * unitPrice);

      if (worldState) {
        const curFood = worldState.weeklyLedger.food;
        const hasFood = curFood >= qty;
        conditions.push({
          condition: `Estoque de Comida (${curFood.toFixed(1)} FSU) >= ${qty} FSU`,
          result: hasFood
        });
        if (hasFood) {
          effects = [
            { resource: 'weeklyLedger.food', delta: -qty },
            { resource: 'weeklyLedger.silverdew', delta: totalSd }
          ];
          decisionReason = `Venda comercial autorizada: ${qty} FSU de grãos convertidos em +${totalSd} SD.`;
        } else {
          allowed = false;
          decisionReason = `Venda RECUSADA (DENIED). Estoque de comida insuficiente (${curFood.toFixed(1)} FSU < ${qty} FSU).`;
        }
      } else {
        effects = [
          { resource: 'weeklyLedger.food', delta: -qty },
          { resource: 'weeklyLedger.silverdew', delta: totalSd }
        ];
      }
    }

    return {
      intent: 'TRADE',
      decision: allowed ? 'ALLOWED' : 'DENIED',
      authority: 'CODEX',
      canonRule: topNode ? {
        id: topNode.id,
        part: topNode.part,
        section: topNode.section,
        title: topNode.title,
        book: topNode.book
      } : undefined,
      conditions,
      effects,
      evidence,
      mechanicalAllowed: allowed,
      decisionReason,
      webFlavorAllowed: true
    };
  }

  // --------------------------------------------------------------------------
  // CASO F: Intenção TRAVEL (Deslocamento / Viagem / Marcha)
  // --------------------------------------------------------------------------
  if (lowerAction.includes('viajar') || lowerAction.includes('marchar') || lowerAction.includes('deslocar') || lowerAction.includes('fronteira')) {
    const codexMatches = searchCodex("Part 8 TRAVEL MEASUREMENT", { limit: 3 });
    const topNode = codexMatches.length > 0 ? codexMatches[0].node : null;

    const evidence: EvidenceItem[] = codexMatches.map(m => ({
      nodeId: m.node.id,
      book: m.node.book,
      part: m.node.part,
      section: m.node.section,
      pageStart: m.node.pageStart,
      pageEnd: m.node.pageEnd,
      title: m.node.title,
      score: m.score,
      authority: 'CANON',
      type: m.node.type
    }));

    return {
      intent: 'TRAVEL',
      decision: 'ALLOWED',
      authority: 'CODEX',
      canonRule: topNode ? {
        id: topNode.id,
        part: topNode.part,
        section: topNode.section,
        title: topNode.title,
        book: topNode.book
      } : undefined,
      conditions: [{ condition: "Part 8 Travel Measurement Rules Present", result: true }],
      effects: [],
      evidence,
      mechanicalAllowed: true,
      decisionReason: `Deslocamento/Viagem de marcha autorizado pela Part 8 do Codex Canon.`,
      webFlavorAllowed: true
    };
  }

  // --------------------------------------------------------------------------
  // CASO GENERALIZADO: Busca Genérica no Codex Canon
  // --------------------------------------------------------------------------
  const codexMatches = searchCodex(userAction, { limit: 4 });
  const evidence: EvidenceItem[] = codexMatches.map(m => ({
    nodeId: m.node.id,
    book: m.node.book,
    part: m.node.part,
    section: m.node.section,
    pageStart: m.node.pageStart,
    pageEnd: m.node.pageEnd,
    title: m.node.title,
    score: m.score,
    authority: 'CANON',
    type: m.node.type
  }));

  const topMatch = codexMatches.length > 0 ? codexMatches[0] : null;

  if (topMatch && topMatch.score >= 25) {
    return {
      intent: 'CRAFT',
      decision: 'ALLOWED',
      authority: 'CODEX',
      canonRule: {
        id: topMatch.node.id,
        part: topMatch.node.part,
        section: topMatch.node.section,
        title: topMatch.node.title,
        book: topMatch.node.book
      },
      conditions: [{ condition: `Regra referente a '${topMatch.node.title}' localizada no Codex`, result: true }],
      effects: [],
      evidence,
      mechanicalAllowed: true,
      decisionReason: `Ação mecânica consultada no Codex Canon (${topMatch.node.title}).`,
      webFlavorAllowed: true
    };
  }

  // Fallback: Nenhuma regra encontrada no Codex Canon
  return {
    intent: 'UNKNOWN_MECHANIC',
    decision: 'NOT_FOUND',
    authority: 'NOT_FOUND',
    conditions: [{ condition: 'Regra mecânica no Codex Canon', result: false }],
    effects: [],
    evidence,
    mechanicalAllowed: false,
    decisionReason: 'Nenhuma regra mecânica ou precedente canon foi localizado no Codex de 529 páginas.',
    webFlavorAllowed: true
  };
}

/**
 * Aplica os efeitos mecânicos de uma resolução de ação no Estado do Mundo (World Ledger).
 * 
 * GARANTIA DE ATOMICIDADE:
 * Se a decisão for 'DENIED' ou 'NOT_FOUND', a função retorna exatamente o estado anterior sem nenhuma mutação (zero side-effects).
 * Apenas decisões 'ALLOWED' aplicam deltas de recursos.
 */
export function applyResolutionToState(
  state: CampaignState, 
  resolution: RuleResolutionResult
): { updatedState: CampaignState; mutated: boolean } {
  // Garantia Atômica: Se não for ALLOWED ou se não for permitido mecanicamente, zero mutações.
  if (resolution.decision !== 'ALLOWED' || !resolution.mechanicalAllowed || resolution.effects.length === 0) {
    return { updatedState: state, mutated: false };
  }

  // Clone profundo do estado para preservar imutabilidade em caso de erro
  const newState: CampaignState = JSON.parse(JSON.stringify(state));

  for (const effect of resolution.effects) {
    if (typeof effect.delta !== 'number') continue;

    if (effect.resource === 'weeklyLedger.silverdew') {
      newState.weeklyLedger.silverdew += effect.delta;
    } else if (effect.resource === 'weeklyLedger.food') {
      newState.weeklyLedger.food = Math.max(0, newState.weeklyLedger.food + effect.delta);
    } else if (effect.resource === 'holdings.laborPool') {
      newState.holdings.laborPool += effect.delta;
    } else if (effect.resource === 'materials.timber') {
      newState.weeklyLedger.materials.timber += effect.delta;
    } else if (effect.resource === 'materials.iron') {
      newState.weeklyLedger.materials.iron += effect.delta;
    } else if (effect.resource === 'materials.stone') {
      newState.weeklyLedger.materials.stone += effect.delta;
    } else if (effect.resource === 'army.units.levies') {
      const quantity = effect.delta;
      const existingUnit = newState.army.units.find(u => u.type === 'Levy');
      if (existingUnit) {
        existingUnit.size += quantity;
        existingUnit.maxSize += quantity;
      } else {
        newState.army.units.push({
          id: `u_recruited_${globalRNG.nextInt(0, 1000000)}`,
          name: "Landed Levy Retinue",
          size: quantity,
          maxSize: quantity,
          tier: 1,
          ac: 3,
          weapon: "Spears",
          mount: "None",
          morale: 4,
          type: "Levy"
        });
      }
    }
  }

  return { updatedState: newState, mutated: true };
}

/**
 * Canon Integrity Test: Gera o hash determinístico da porção mecânica do Estado do Mundo.
 * Permite verificar a integridade defensiva do World Ledger antes e depois de chamadas à Web ou IA Sensorial.
 */
export function hashMechanicalState(state: CampaignState): string {
  if (!state) return "";
  const mechanicalSlice = {
    silverdew: state.weeklyLedger.silverdew,
    food: state.weeklyLedger.food,
    materials: state.weeklyLedger.materials,
    laborPool: state.holdings.laborPool,
    fortificationTier: state.holdings.fortification.tier,
    armyUnitSizes: state.army.units.map(u => `${u.id}:${u.size}`).sort(),
    soulEssence: state.character.soulEssence || 0
  };
  return JSON.stringify(mechanicalSlice);
}

/**
 * Valida se o estado mecânico permaneceu 100% idêntico (integridade mantida).
 */
export function verifyStateIntegrity(beforeState: CampaignState, afterState: CampaignState): boolean {
  return hashMechanicalState(beforeState) === hashMechanicalState(afterState);
}


