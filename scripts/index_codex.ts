import fs from 'fs';
import path from 'path';

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

function processStructuredCodex() {
  const filePath = path.join(process.cwd(), 'codex_extracted.txt');
  if (!fs.existsSync(filePath)) {
    console.error('Arquivo codex_extracted.txt não encontrado!');
    process.exit(1);
  }

  console.log('Iniciando auditoria e indexação estrutural de codex_extracted.txt...');
  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.split(/\r?\n/);

  const nodes: StructuredCodexNode[] = [];

  let currentBook = 'BOOK 0: Front Matter';
  let currentPart = '0';
  let currentSection = '0.0';
  let currentPage = 1;
  let currentTitle = 'Front Matter';

  let currentBuffer: string[] = [];
  let chunkIndex = 0;
  let pageStart = 1;

  const saveNode = (title: string, bufferLines: string[], endPage: number) => {
    const rawContent = bufferLines.join('\n').trim();
    if (rawContent.length < 40) return;

    // Identificar tipo (TABLE, RULE, DIRECTIVE, SECTION)
    let type: 'RULE' | 'TABLE' | 'DIRECTIVE' | 'SECTION' = 'RULE';
    if (rawContent.includes('│') || rawContent.includes('┌') || title.toUpperCase().includes('TABLE') || title.toUpperCase().includes('TEMPLATE')) {
      type = 'TABLE';
    } else if (title.toUpperCase().includes('DIRECTIVE') || rawContent.includes('RULE OF CERTAINTY') || rawContent.includes('AXIOM')) {
      type = 'DIRECTIVE';
    } else if (title.toUpperCase().startsWith('BOOK') || title.toUpperCase().startsWith('PART')) {
      type = 'SECTION';
    }

    // Extrair Palavras-Chave
    const words = rawContent.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    const wordFreq: Record<string, number> = {};
    for (const w of words) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }

    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([w]) => w);

    // Extrair referências a outros Parts (ex: "Part 67.1a", "Part A.57", "Patch 6.1")
    const relatedMatches = rawContent.match(/\b(?:Part|Patch|Table)\s+[A-Z0-9\.]+/gi) || [];
    const related = Array.from(new Set(relatedMatches.map(m => m.trim())));

    // Determinar se é mecânico
    const mechanical = /[\d\+]+\s*(?:SD|SU|XP|AC|tier|weeks|months|timber|iron|stone|capacity|loyalty|morale)/i.test(rawContent) ||
      type === 'TABLE' || rawContent.includes('1d6') || rawContent.includes('2d6');

    // Identificar ID limpo (ex: rule_part_7_1 ou node_42)
    const cleanSectionId = currentSection.replace(/[^\w\.]/g, '_').toLowerCase();
    const id = `node_${chunkIndex++}_${cleanSectionId}`;

    nodes.push({
      id,
      type,
      book: currentBook,
      part: currentPart,
      section: currentSection,
      title: title || currentSection,
      pageStart,
      pageEnd: endPage,
      authority: 'CANON',
      version: '4.7',
      keywords,
      content: rawContent,
      mechanical,
      conditions: [],
      effects: [],
      related
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detectar trocas de página
    const pageMatch = line.match(/^--\s*(\d+)\s+of\s+\d+\s*--$/i);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10);
      continue;
    }

    // Detectar Troca de Livro
    if (line.match(/^BOOK\s+[0-9I|V|X]+:/i) || line.match(/^APPENDIX\s+[A-Z]+:/i)) {
      if (currentBuffer.length > 0) {
        saveNode(currentTitle, currentBuffer, currentPage);
        currentBuffer = [];
      }
      currentBook = line.trim();
      currentTitle = currentBook;
      pageStart = currentPage;
      continue;
    }

    // Detectar Troca de PART (ex: "PART 5: WORLD & TRAVEL RULES" ou "PART 40.1")
    const partMatch = line.match(/^PART\s+([A-Z0-9\.]+)\:?\s*(.*)$/i);
    if (partMatch) {
      if (currentBuffer.length > 0) {
        saveNode(currentTitle, currentBuffer, currentPage);
        currentBuffer = [];
      }
      currentPart = partMatch[1];
      currentSection = partMatch[1];
      currentTitle = line.trim();
      pageStart = currentPage;
      continue;
    }

    // Detectar subseção de regra (ex: "5.1 Travel Time Enforcement", "7.1 Currency (Part 67.1a)")
    const subMatch = line.match(/^(\d+\.\d+[a-z]?)\s+(.*)$/i);
    if (subMatch) {
      if (currentBuffer.length > 15) {
        saveNode(currentTitle, currentBuffer, currentPage);
        currentBuffer = [];
        currentSection = subMatch[1];
        currentTitle = line.trim();
        pageStart = currentPage;
      }
    }

    currentBuffer.push(line);

    // Salvar bloco se atingir limite máximo de linhas
    if (currentBuffer.length >= 100) {
      saveNode(currentTitle, currentBuffer, currentPage);
      currentBuffer = [];
      pageStart = currentPage;
    }
  }

  if (currentBuffer.length > 0) {
    saveNode(currentTitle, currentBuffer, currentPage);
  }

  const outputDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'codex_index.json');
  fs.writeFileSync(outputPath, JSON.stringify({ totalNodes: nodes.length, nodes }, null, 2), 'utf-8');
  console.log(`Indexação Estrutural concluída com sucesso! ${nodes.length} nós canon salvos em ${outputPath}`);
}

processStructuredCodex();
