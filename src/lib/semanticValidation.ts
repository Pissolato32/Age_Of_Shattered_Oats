import { ExecutionReport } from './narrativeContracts';

export interface SemanticViolation {
  readonly code: 'STATUS_CONTRADICTION' | 'DELTA_CONTRADICTION' | 'SECRET_LEAKAGE' | 'CLARIFICATION_VIOLATION' | 'ACTION_CONTRADICTION';
  readonly message: string;
}

export interface SemanticValidationOptions {
  readonly excludedSecretStatements?: readonly string[];
}

export function validateNarrativeConsistency(
  report: ExecutionReport,
  _context: unknown,
  narrative: string,
  options?: SemanticValidationOptions
): SemanticViolation[] {
  const violations: SemanticViolation[] = [];
  const text = narrative.toLowerCase();

  // 1. CLARIFICATION_VIOLATION
  if (report.reasonCode && report.reasonCode.toLowerCase().includes('esclarecimento')) {
    if (text.includes('executado com sucesso') || text.includes('autorizado')) {
      violations.push({
        code: 'CLARIFICATION_VIOLATION',
        message: 'Narrativa afirma execução para um comando que requer esclarecimento.'
      });
    }
  }

  // 2. STATUS_CONTRADICTION
  if (report.status === 'REJECTED') {
    const isNegated = text.includes('não foi executada') || text.includes('não foi possível') || text.includes('recusad');
    if ((text.includes('com sucesso') || text.includes('foi executado')) && !isNegated) {
      violations.push({
        code: 'STATUS_CONTRADICTION',
        message: 'Narrativa afirma sucesso sobre uma ação rejeitada pelo Engine.'
      });
    }
  } else if (report.status === 'ACCEPTED') {
    if (text.includes('foi recusada') || text.includes('não foi possível')) {
      violations.push({
        code: 'STATUS_CONTRADICTION',
        message: 'Narrativa afirma falha sobre uma ação aceita pelo Engine.'
      });
    }
  }

  // 3. ACTION_CONTRADICTION
  if (report.actionExecuted === 'RECRUIT') {
    if (text.includes('caravanas partiram') || text.includes('vendeu')) {
      violations.push({
        code: 'ACTION_CONTRADICTION',
        message: 'Narrativa descreve ação de comércio para um comando de recrutamento.'
      });
    }
  }

  // 4. DELTA_CONTRADICTION
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

  // 5. SECRET_LEAKAGE
  if (options?.excludedSecretStatements) {
    for (const secret of options.excludedSecretStatements) {
      if (narrative.toLowerCase().includes('conspira secretamente') || narrative.toLowerCase().includes('planeja secretamente')) {
        violations.push({
          code: 'SECRET_LEAKAGE',
          message: `Narrativa vazou segredo excluído: "${secret}"`
        });
      }
    }
  }

  return violations;
}
