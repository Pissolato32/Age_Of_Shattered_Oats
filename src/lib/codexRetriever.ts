import codexIndexData from '../../data/codex_index.json';

export interface StructuredCodexNode {
  id: string;
  type: 'RULE' | 'TABLE' | 'DIRECTIVE' | 'SECTION';
  book: string;
  part: string;
  section: string;
  title: string;
  pageStart: number;
  pageEnd: number;
  authority: string;
  version: string;
  keywords: string[];
  content: string;
  mechanical: boolean;
  conditions: string[];
  effects: string[];
  related: string[];
}

export interface CodexSearchResult {
  node: StructuredCodexNode;
  score: number;
  matchedTerms: string[];
  exactRuleMatch?: boolean;
}

interface CodexIndexData {
  totalNodes: number;
  nodes: StructuredCodexNode[];
}

function loadIndex(): CodexIndexData | null {
  return codexIndexData as unknown as CodexIndexData;
}

const PT_EN_MAP: Record<string, string[]> = {
  recrutamento: ["recruitment", "recruit", "retinue", "raising"],
  infantaria: ["infantry", "levy", "soldiers"],
  soldado: ["soldier", "troops", "warrior"],
  fortificacao: ["fortification", "palisade", "wall", "bastion", "siege"],
  fortificacoes: ["fortification", "palisade", "wall", "bastion", "siege"],
  madeira: ["timber", "wood"],
  combate: ["combat", "battle", "doctrine"],
  naval: ["naval", "ship", "fleet", "vessel", "galley"],
  navio: ["ship", "vessel", "galley", "fleet"],
  galera: ["galley", "ship"],
  barco: ["boat", "vessel", "ship"],
  viagem: ["travel", "journey", "distance"],
  viajar: ["travel", "journey"],
  titulo: ["title", "titles", "lord"],
  titulos: ["title", "titles", "lord"],
  norte: ["northern", "north"],
  racao: ["ration", "food", "grain", "procurement"],
  racoes: ["ration", "food", "grain", "procurement"],
  inverno: ["winter", "thawtide"],
  imposto: ["tax", "tribute", "income"],
  impostos: ["tax", "tribute", "income"],
  exercito: ["army", "levy", "garrison"],
  ferreiro: ["smith", "blacksmith", "crafting"],
  ouro: ["gold"],
  prata: ["silver", "silverdew"],
  cavalo: ["horse", "mount"],
  cavalaria: ["cavalry", "knights"],
  cerco: ["siege", "siegecraft"],
  diplomacia: ["diplomacy", "envoy", "council"],
  saque: ["loot", "looting", "plunder"]
};

/**
 * Busca Lexical / Estruturada Determinística no Codex de 529 Páginas
 */
export function searchCodex(
  query: string, 
  options: { bookFilter?: string; typeFilter?: 'RULE' | 'TABLE' | 'DIRECTIVE' | 'SECTION'; mechanicalOnly?: boolean; limit?: number } = {}
): CodexSearchResult[] {
  const index = loadIndex();
  if (!index || !index.nodes || index.nodes.length === 0) {
    return [];
  }

  const limit = options.limit || 5;
  const normalizedQuery = (query || '')
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Verificar se há solicitação direta de número de regra (ex: "18.25", "Part 40", "Rule 7.1")
  const ruleNumberMatch = normalizedQuery.match(/\b(?:part|rule|section|table)?\s*(\d+(?:\.\d+[a-z]?)?)\b/i);
  const targetRuleNumber = ruleNumberMatch ? ruleNumberMatch[1] : null;

  const rawTerms = normalizedQuery
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);

  if (rawTerms.length === 0 && !targetRuleNumber) return [];

  // Expandir termos com dicionário PT->EN
  const expandedTerms: string[] = [...rawTerms];
  for (const term of rawTerms) {
    if (PT_EN_MAP[term]) {
      expandedTerms.push(...PT_EN_MAP[term]);
    }
  }

  const results: CodexSearchResult[] = [];

  for (const node of index.nodes) {
    if (options.bookFilter && !node.book.toLowerCase().includes(options.bookFilter.toLowerCase())) {
      continue;
    }
    if (options.typeFilter && node.type !== options.typeFilter) {
      continue;
    }
    if (options.mechanicalOnly && !node.mechanical) {
      continue;
    }

    let score = 0;
    let exactRuleMatch = false;
    const matchedTerms: string[] = [];

    // Correspondência exata de número de regra/seção/part (Score máximo)
    if (targetRuleNumber) {
      if (node.part === targetRuleNumber || node.section === targetRuleNumber || node.id.includes(targetRuleNumber)) {
        score += 50;
        exactRuleMatch = true;
        matchedTerms.push(`REGRA_${targetRuleNumber}`);
      }
    }

    const lowerContent = node.content.toLowerCase();
    const lowerTitle = node.title.toLowerCase();

    for (const term of expandedTerms) {
      // Peso do Título
      if (lowerTitle.includes(term)) {
        score += 15;
        if (!matchedTerms.includes(term)) matchedTerms.push(term);
      }

      // Peso das Palavras-Chave da Seção
      if (node.keywords.includes(term)) {
        score += 8;
        if (!matchedTerms.includes(term)) matchedTerms.push(term);
      }

      // Ocorrências no corpo da regra
      let count = 0;
      let pos = lowerContent.indexOf(term);
      while (pos !== -1 && count < 6) {
        count++;
        pos = lowerContent.indexOf(term, pos + term.length);
      }

      if (count > 0) {
        score += count * 2;
        if (!matchedTerms.includes(term)) matchedTerms.push(term);
      }
    }

    if (score > 0) {
      results.push({
        node,
        score,
        matchedTerms,
        exactRuleMatch
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
