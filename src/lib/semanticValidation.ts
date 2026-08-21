import { ExecutionReport, NarrativeContext } from './narrativeContracts';

export type SemanticViolationCode =
  | 'STATUS_CONTRADICTION'
  | 'DELTA_CONTRADICTION'
  | 'QUANTITY_CONTRADICTION'
  | 'RESOURCE_INVENTION'
  | 'CASUALTY_INVENTION'
  | 'SECRET_LEAKAGE'
  | 'CLARIFICATION_VIOLATION'
  | 'ACTION_CONTRADICTION'
  | 'RUMOR_AS_FACT_VIOLATION'
  | 'INVENTED_MECHANICAL_CONSEQUENCE';

export interface SemanticViolation {
  readonly code: SemanticViolationCode;
  readonly message: string;
}

export interface SemanticValidationOptions {
  readonly excludedSecretStatements?: readonly string[];
}

/**
 * Authoritative semantic validator ensuring that any narrative response produced
 * by a model strictly adheres to the facts, deltas, and boundaries of the ExecutionReport.
 */
export function validateNarrativeConsistency(
  report: ExecutionReport,
  context: NarrativeContext | null | undefined,
  narrative: string,
  options?: SemanticValidationOptions
): SemanticViolation[] {
  const violations: SemanticViolation[] = [];
  const text = narrative.toLowerCase();

  // 1. CLARIFICATION_VIOLATION
  if (report.reasonCode && report.reasonCode.toLowerCase().includes('esclarecimento')) {
    if (text.includes('executado com sucesso') || text.includes('autorizado') || text.includes('concluída com sucesso')) {
      violations.push({
        code: 'CLARIFICATION_VIOLATION',
        message: 'Narrativa afirma execução para um comando que requer esclarecimento.'
      });
    }
  }

  // 2. STATUS_CONTRADICTION
  if (report.status === 'REJECTED') {
    const isNegated =
      text.includes('não foi executada') ||
      text.includes('não foi possível') ||
      text.includes('recusad') ||
      text.includes('negad') ||
      text.includes('rejeitad') ||
      text.includes('impedid') ||
      text.includes('falhou');

    if ((text.includes('com sucesso') || text.includes('foi executado') || text.includes('foi autorizado')) && !isNegated) {
      violations.push({
        code: 'STATUS_CONTRADICTION',
        message: 'Narrativa afirma sucesso sobre uma ação rejeitada pelo Engine.'
      });
    }
  } else if (report.status === 'ACCEPTED') {
    if (
      (text.includes('foi recusada') || text.includes('não foi possível') || text.includes('foi rejeitada')) &&
      !text.includes('apesar de')
    ) {
      violations.push({
        code: 'STATUS_CONTRADICTION',
        message: 'Narrativa afirma falha sobre uma ação aceita pelo Engine.'
      });
    }
  }

  // 3. ACTION_CONTRADICTION
  if (report.actionExecuted === 'RECRUIT') {
    if (text.includes('caravanas partiram') || text.includes('vendeu mercadorias')) {
      violations.push({
        code: 'ACTION_CONTRADICTION',
        message: 'Narrativa descreve ação de comércio para um comando de recrutamento.'
      });
    }
  } else if (report.actionExecuted === 'BUILD') {
    if (text.includes('recrutou novos soldados') || text.includes('viajou até a capital')) {
      violations.push({
        code: 'ACTION_CONTRADICTION',
        message: 'Narrativa descreve recrutamento ou viagem para um comando de construção.'
      });
    }
  }

  // 4. DELTA & QUANTITY CONTRADICTION
  // Check SD cost mentioned in narrative
  const costMatch = narrative.match(/custo total de (\d+)\s*SD/i);
  if (costMatch) {
    const statedCost = parseInt(costMatch[1], 10);
    const sdChange = report.stateChanges.find(sc => sc.path === 'weeklyLedger.silverdew');
    if (sdChange && sdChange.delta !== undefined) {
      const realCost = Math.abs(sdChange.delta);
      if (statedCost !== realCost) {
        violations.push({
          code: 'DELTA_CONTRADICTION',
          message: `Narrativa cita custo de ${statedCost} SD divergente do delta real de ${realCost} SD.`
        });
      }
    }
  }

  // Check troop count contradiction
  const troopMatch = narrative.match(/(\d+)\s+(soldados|homens|infantarias|recrutas)/i);
  if (troopMatch && report.actionExecuted === 'RECRUIT' && report.status === 'ACCEPTED') {
    const statedTroops = parseInt(troopMatch[1], 10);
    const levyChange = report.stateChanges.find(sc => sc.path === 'army.units.levies');
    const realTroops = levyChange?.delta ?? report.magnitude?.value;
    if (realTroops !== undefined && statedTroops !== realTroops) {
      violations.push({
        code: 'QUANTITY_CONTRADICTION',
        message: `Narrativa cita quantidade de ${statedTroops} tropas divergente da resolução real de ${realTroops}.`
      });
    }
  }

  // 5. CASUALTY_INVENTION (Invented deaths/casualties)
  const hasCasualtyFact = report.consequences.some(c => /morte|baixa|casualt|tomb/i.test(c.description));
  if (!hasCasualtyFact) {
    if (
      /dezenas de mortos|massacre total|soldados tombaram mortos|baixas catastróficas/i.test(narrative)
    ) {
      violations.push({
        code: 'CASUALTY_INVENTION',
        message: 'Narrativa inventou baixas e mortes mecânicas sem suporte no ExecutionReport.'
      });
    }
  }

  // 6. RUMOR_AS_FACT_VIOLATION (Treating rumors as confirmed facts)
  if (/é fato consumado e comprovado que|confirmado oficialmente que/i.test(narrative)) {
    if (context?.knownFacts?.some(f => f.tier === 'RUMOR')) {
      violations.push({
        code: 'RUMOR_AS_FACT_VIOLATION',
        message: 'Narrativa tratou rumor incerto como fato oficial confirmado.'
      });
    }
  }

  // 7. SECRET_LEAKAGE
  if (options?.excludedSecretStatements) {
    for (const secret of options.excludedSecretStatements) {
      if (
        narrative.toLowerCase().includes('conspira secretamente') ||
        narrative.toLowerCase().includes('planeja secretamente') ||
        narrative.toLowerCase().includes(secret.toLowerCase())
      ) {
        violations.push({
          code: 'SECRET_LEAKAGE',
          message: `Narrativa vazou segredo excluído: "${secret}"`
        });
      }
    }
  }

  return violations;
}
