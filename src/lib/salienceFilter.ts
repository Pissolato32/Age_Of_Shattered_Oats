import {
  NarrativeContext,
  ExecutionReport,
  NarrativeRelationship,
  AuthorizedKnowledgeFact
} from './narrativeContracts';
import { MemoryRecord, KnowledgeRecord } from '../memory/contracts';

export interface SalienceFilterOptions {
  readonly maxMemories?: number;
  readonly maxKnowledge?: number;
  readonly maxRelationships?: number;
}

const MECHANICAL_ACTIONS = new Set([
  'BUILD',
  'RECRUIT',
  'TRAVEL',
  'MILITARY',
  'HARVEST'
]);

const ACTION_THEMATIC_KEYWORDS: Record<string, readonly string[]> = {
  BUILD: ['constru', 'paliçada', 'muralha', 'torre', 'madeira', 'pedra', 'obra', 'defesa'],
  RECRUIT: ['recrut', 'soldado', 'infantaria', 'guarniç', 'tropa', 'alistamento', 'arma'],
  TRAVEL: ['viagem', 'estrada', 'deslocamento', 'passo', 'marcha', 'fronteira', 'caminho'],
  TRADE: ['comércio', 'mercado', 'caravana', 'ouro', 'prata', 'grão', 'trigo', 'compra', 'venda'],
  DIPLOMACY: ['acordo', 'tratado', 'aliança', 'pacto', 'carta', 'emissário', 'mensageiro', 'nobre', 'casa'],
  ESPIONAGE: ['espi', 'batedor', 'infiltração', 'segredo', 'vigilância', 'sondagem'],
  MILITARY: ['patrulha', 'manobra', 'combate', 'emboscada', 'sentinela', 'guarnição'],
  INFORMATION: ['relatório', 'censo', 'registro', 'histórico', 'notícia']
};

/**
 * Normalizes text to lowercase without accents for robust fuzzy matching.
 */
function normalize(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Salience / Relevance Gate (NAR-002 Pilar 1 & 2):
 * Filters NarrativeContext to include only facts, memories, and relationships
 * that have direct causal, spatial, or thematic relevance to the executed action.
 * 
 * Invariant: Context Available ≠ Context Narratively Relevant.
 */
export function filterContextBySalience(
  context: NarrativeContext,
  report: ExecutionReport,
  options: SalienceFilterOptions = {}
): NarrativeContext {
  const maxMemories = options.maxMemories ?? 2;
  const maxKnowledge = options.maxKnowledge ?? 2;
  const maxRelationships = options.maxRelationships ?? 1;

  const action = report.actionExecuted;
  const targetId = normalize(report.command?.targetId);
  const locationId = normalize(report.command?.locationId || context.scene?.locationId);
  const objectId = normalize(report.command?.objectId);
  const isMechanical = MECHANICAL_ACTIONS.has(action);

  const keywords = (ACTION_THEMATIC_KEYWORDS[action] || []).map(normalize);

  // 1. Filter Relationships
  let filteredRelationships: readonly NarrativeRelationship[] = [];
  if (context.relationships && context.relationships.length > 0) {
    if (!isMechanical && targetId) {
      // Find relationship involving targetId
      const matched = context.relationships.filter(r => {
        const source = normalize(r.sourceActorId);
        const target = normalize(r.targetActorId);
        return source.includes(targetId) || target.includes(targetId) || targetId.includes(target);
      });
      filteredRelationships = matched.slice(0, maxRelationships);
    } else if (action === 'DIPLOMACY' || action === 'SOCIAL' || action === 'INTRIGUE') {
      filteredRelationships = context.relationships.slice(0, maxRelationships);
    } else {
      // For internal mechanical actions without a foreign target, exclude external noble relations completely
      filteredRelationships = [];
    }
  }

  // 2. Filter Retrieved Memories
  let filteredMemories: readonly MemoryRecord[] | undefined = undefined;
  if (context.retrievedMemories && context.retrievedMemories.length > 0) {
    const scoredMemories = context.retrievedMemories.map(m => {
      let score = 0;
      const desc = normalize(m.description);
      const subj = normalize(m.subjectId);
      const tags = (m.tags || []).map(normalize);

      if (targetId && (subj.includes(targetId) || desc.includes(targetId))) score += 5;
      if (locationId && (desc.includes(locationId) || tags.some(t => t.includes(locationId)))) score += 3;
      if (objectId && (desc.includes(objectId) || tags.some(t => t.includes(objectId)))) score += 3;

      for (const kw of keywords) {
        if (desc.includes(kw) || tags.some(t => t.includes(kw))) {
          score += 1;
        }
      }

      return { memory: m, score };
    });

    // Only retain memories that have positive relevance score (score > 0)
    const relevant = scoredMemories
      .filter(sm => sm.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxMemories)
      .map(sm => sm.memory);

    filteredMemories = relevant.length > 0 ? relevant : [];
  }

  // 3. Filter Retrieved Knowledge
  let filteredKnowledge: readonly KnowledgeRecord[] | undefined = undefined;
  if (context.retrievedKnowledge && context.retrievedKnowledge.length > 0) {
    const scoredKnowledge = context.retrievedKnowledge.map(k => {
      let score = 0;
      const factStr = typeof k.value === 'object' ? JSON.stringify(k.value) : String(k.value);
      const normFact = normalize(`${k.factId} ${factStr}`);

      if (targetId && normFact.includes(targetId)) score += 5;
      if (locationId && normFact.includes(locationId)) score += 3;
      if (objectId && normFact.includes(objectId)) score += 3;

      for (const kw of keywords) {
        if (normFact.includes(kw)) score += 1;
      }

      return { knowledge: k, score };
    });

    const relevant = scoredKnowledge
      .filter(sk => sk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxKnowledge)
      .map(sk => sk.knowledge);

    filteredKnowledge = relevant.length > 0 ? relevant : [];
  }

  // 4. Filter Known Facts from projection
  let filteredKnownFacts = context.knownFacts;
  if (context.knownFacts && context.knownFacts.length > 0) {
    if (isMechanical && !targetId) {
      // In mechanical actions without an external target, prune foreign house diplomatic facts
      filteredKnownFacts = context.knownFacts.filter(f => !f.statement.startsWith('[Diplomacia / Casa Nobre]'));
    }
  }

  return {
    ...context,
    relationships: filteredRelationships,
    retrievedMemories: filteredMemories,
    retrievedKnowledge: filteredKnowledge,
    knownFacts: filteredKnownFacts
  };
}
