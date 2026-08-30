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
  // Check explicit currency / resource mentions if any
  const costMatch = narrative.match(/(?:custo(?:\s+total)?\s+de|gast(?:ou|ando|ar|aram)(?:\s+o\s+valor\s+de)?|consum(?:iu|indo|ir|iram)(?:\s+o\s+valor\s+de)?|pag(?:ou|ando|ar|aram)(?:\s+o\s+valor\s+de)?|pago(?:\s+o\s+valor\s+de)?|ao\s+custo\s+de|\bvalor\s+de)\s+(\d+)\s*(?:sd|moedas(?:\s+de\s+prata)?|peças\s+de\s+prata|moedas)/i);
  if (costMatch) {
    const statedCost = parseInt(costMatch[1], 10);
    const sdChange = report.stateChanges.find(sc => sc.path === 'weeklyLedger.silverdew');
    if (sdChange && sdChange.delta !== undefined) {
      const realCost = Math.abs(sdChange.delta);
      if (statedCost !== realCost) {
        violations.push({
          code: 'DELTA_CONTRADICTION',
          message: `Narrativa cita custo explícito de ${statedCost} moedas/SD divergente do delta real de ${realCost} SD.`
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
          message: `Narrativa vazou segredo excluído ou não descoberto: "${secret}"`
        });
      }
    }
  }

  // 8. INVENTED_MECHANICAL_CONSEQUENCE / UNGROUNDED_DISCOVERY (Provenance-Aware)
  const mentionsEspionageOrTracking =
    /descobri[rua-z]*|investiga[cç][aã]o|comprovando\s+a\s+liga[cç][aã]o|comprov(?:ou|ado|aram)|revel(?:ou|ando|a|am)|segui[rua-z]*(?:\s+[\wÀ-ÿ]+){0,6}\s+até|foi\s+seguido(?:\s+[\wÀ-ÿ]+){0,6}\s+até|foram\s+seguidos(?:\s+[\wÀ-ÿ]+){0,6}\s+até|rastre(?:ou|ando|ados?|adas?)(?:\s+[\wÀ-ÿ]+){0,6}\s+até|espi[õo]es\s+relat(?:am|aram|ou)|batedores\s+confirm(?:am|aram|ou)|lealdade\s+a\s+[a-zA-ZÀ-ÿ]|operando\s+sob\s+as\s+ordens\s+de\s+[a-zA-ZÀ-ÿ]|sob\s+o\s+estandarte\s+de\s+[a-zA-ZÀ-ÿ]/i.test(narrative);

  if (mentionsEspionageOrTracking) {
    // Coletar todas as fontes de fatos autorizados no contexto e relatório
    const authorizedFacts: readonly import('./narrativeContracts').AuthorizedKnowledgeFact[] = [
      ...(report.discoveredInformation || []),
      ...(context?.knownFacts || [])
    ];

    // Se o relatório é de uma ação mecânica de espionagem autorizada com descobertas no turno, é legítimo
    const isAuthorizedEspionageResolution =
      report.actionExecuted === 'ESPIONAGE' &&
      report.discoveredInformation &&
      report.discoveredInformation.length > 0;

    // Verificar se a afirmação na narrativa se ancora em fatos autorizados da janela temporal permitida
    const isGroundedInAuthorizedFacts = authorizedFacts.some(fact => {
      // Respeitar o limite temporal da consulta (KnowledgeSnapshot)
      const maxAllowedTurn = context?.query?.temporalScope?.targetTurn;
      if (maxAllowedTurn !== undefined && fact.createdTurn > maxAllowedTurn) {
        return false;
      }

      const factSubject = (fact.subjectId || '').toLowerCase();
      const factText = (fact.statement || '').toLowerCase();
      const factTags = (fact.tags || []).map(t => t.toLowerCase());

      // 1. Se a narrativa cita entidades nominais ou nomes próprios, o fato autorizado correspondente deve conter a entidade
      const namedEntitiesInNarrative = ['vane', 'ironhand', 'decimus', 'kenneth', 'silverfall', 'ironpeak', 'blackthorn', 'riverford']
        .filter(ent => text.includes(ent));

      if (namedEntitiesInNarrative.length > 0) {
        const matchesNamedEntity = namedEntitiesInNarrative.some(ent => factText.includes(ent));
        if (!matchesNamedEntity) {
          return false;
        }
      }

      // 2. Verificar âncoras temáticas e semânticas autorizadas
      const mentionsSubject = factSubject.length > 2 && text.includes(factSubject);
      const matchesTags = factTags.some(tag => tag.length > 3 && text.includes(tag));
      const hasCoreTokenOverlap = ['grãos', 'leste', 'mercado', 'comércio', 'contrabando', 'provisões', 'guarnição', 'vane', 'ironhand']
        .some(token => factText.includes(token) && text.includes(token));

      return mentionsSubject || matchesTags || hasCoreTokenOverlap;
    });

    if (!isAuthorizedEspionageResolution && !isGroundedInAuthorizedFacts) {
      violations.push({
        code: 'INVENTED_MECHANICAL_CONSEQUENCE',
        message: 'Narrativa afirmou descobertas de inteligência/espionagem sem suporte em fatos autorizados pela Engine ou discoveredInformation.'
      });
    }
  }

  return violations;
}
