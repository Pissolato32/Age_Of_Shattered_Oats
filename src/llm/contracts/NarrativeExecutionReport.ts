export interface NarrativeStateChange {
  readonly path: string;
  readonly qualitativeImpact: string; // e.g. "Os celeiros receberam novos fardos de grãos."
  readonly direction: 'INCREASED' | 'DECREASED' | 'MUTATED' | 'DEPLETED' | 'UNALTERED';
}

export interface NarrativePhysicalConsequence {
  readonly id: string;
  readonly description: string;
  readonly affectedScope: 'LOCAL' | 'HOLDING' | 'REALM' | 'MILITARY';
}

export interface NarrativeExecutionReport {
  readonly executionId: string;
  readonly turn: number;
  readonly action: {
    readonly domain: string;
    readonly intent: string;
  };
  readonly outcome: {
    readonly status: 'ACCEPTED' | 'REJECTED' | 'BLOCKED' | 'REQUIRES_CLARIFICATION';
    readonly explanation: string;
  };
  readonly facts: {
    readonly events: readonly string[];
    readonly entitiesInvolved: readonly string[];
    readonly stateChanges: readonly NarrativeStateChange[];
  };
  readonly narrativeHints: readonly string[];
  /**
   * Structural mechanical silence enforcement: this object prohibits internal numeric fields.
   */
  readonly mechanicalData?: never;
}

export class NarrativeReportSanitizer {
  /**
   * Transforms raw engine resolution into strict, sanitized NarrativeExecutionReport.
   * Strips away any raw coins, DCs, rolls, formulas, AC, XP.
   */
  public static sanitize(
    rawReport: {
      commandId: string;
      actionExecuted: string;
      status: string;
      reasonCode?: string;
      stateChanges?: Array<{ path: string; delta?: number; before?: unknown; after?: unknown }>;
      consequences?: Array<{ consequenceId: string; description: string }>;
    },
    turn = 1
  ): NarrativeExecutionReport {
    const narrativeChanges: NarrativeStateChange[] = (rawReport.stateChanges || []).map(sc => {
      const delta = sc.delta ?? 0;
      let direction: NarrativeStateChange['direction'] = 'UNALTERED';
      if (delta > 0) direction = 'INCREASED';
      else if (delta < 0) direction = 'DECREASED';

      let qualitativeImpact = `Alteração registrada em ${sc.path}.`;
      if (sc.path.includes('silverdew')) {
        qualitativeImpact = delta < 0
          ? 'Os cofres da tesouraria tornaram-se mais leves com os pagamentos efetuados.'
          : 'Novos tributos e rendas de prata ingressaram nos cofres senhoriais.';
      } else if (sc.path.includes('food')) {
        qualitativeImpact = delta < 0
          ? 'Os celeiros tiveram mantimentos retirados para a nutrição das tropas.'
          : 'Novas sacas de grãos foram estocadas nos celeiros da fortaleza.';
      } else if (sc.path.includes('units') || sc.path.includes('garrison')) {
        qualitativeImpact = 'Novos homens de armas perfilaram-se e receberam suas cotas de cota de malha.';
      }

      return {
        path: sc.path,
        qualitativeImpact,
        direction
      };
    });

    const narrativeHints: string[] = [];
    if (rawReport.status === 'REJECTED') {
      narrativeHints.push(`Ação rejeitada pelo conselho/motor: ${rawReport.reasonCode || 'Ordens impossibilitadas'}`);
    } else {
      narrativeHints.push(`Ação cumprida com sucesso: ${rawReport.actionExecuted}`);
    }

    return {
      executionId: rawReport.commandId || `exec_${Date.now()}`,
      turn,
      action: {
        domain: rawReport.actionExecuted,
        intent: rawReport.actionExecuted
      },
      outcome: {
        status: (rawReport.status as any) || 'ACCEPTED',
        explanation: rawReport.reasonCode || 'Ação resolvida conforme as leis da campanha.'
      },
      facts: {
        events: (rawReport.consequences || []).map(c => c.description),
        entitiesInvolved: ['Guarnição de Grey Keep', 'Conselho da Fortaleza'],
        stateChanges: narrativeChanges
      },
      narrativeHints
    };
  }
}
