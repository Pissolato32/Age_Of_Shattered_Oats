export interface ParsedIntent {
  category: 'MECHANICAL' | 'FLAVOR' | 'INFORMATION' | 'AMBIGUOUS';
  actionType: 'RECRUIT' | 'CRAFT' | 'BUILD' | 'TRAVEL' | 'TRADE' | 'FLAVOR_QUERY' | 'UNKNOWN';
  target?: string;
  quantity?: number | null;
  confidence: number;
  requiresClarification: boolean;
  clarificationPrompt?: string;
  rawInput: string;
}

/**
 * Intent Parser — Traduz linguagem natural do jogador em Intenções Estruturadas
 * 
 * Regra de Ouro:
 * Se os parâmetros forem vagos, ambíguos ou incompletos (ex: "reunir alguns homens", "prepare meus homens"), 
 * o parser NÃO inventa números ou assume valores padrão. Ele marca `requiresClarification: true`
 * e solicita confirmação do jogador.
 */
export function parseUserIntent(rawInput: string): ParsedIntent {
  const input = (rawInput || "").trim();
  if (!input) {
    return {
      category: 'AMBIGUOUS',
      actionType: 'UNKNOWN',
      confidence: 0,
      requiresClarification: true,
      clarificationPrompt: "Por favor, especifique qual ação deseja realizar.",
      rawInput: ""
    };
  }

  const lower = input.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Detecção de Elementos Fantásticos / Não Suportados (Dragão, Mithril, Aço Valiriano, Poção)
  if (lower.includes('dragao') || lower.includes('valiriano') || lower.includes('mithril') || lower.includes('pocao') || lower.includes('bola de fogo')) {
    return {
      category: 'INFORMATION',
      actionType: 'UNKNOWN',
      confidence: 0.95,
      requiresClarification: false,
      rawInput: input
    };
  }

  // 2. Detecção de Dúvidas de INFORMAÇÃO / CONSULTA ("quanto custa", "como funciona", "qual o preço")
  if (lower.includes('quanto custa') || lower.includes('qual o preco') || lower.includes('como funciona') || lower.includes('saber quanto')) {
    return {
      category: 'INFORMATION',
      actionType: 'UNKNOWN',
      confidence: 0.95,
      requiresClarification: false,
      rawInput: input
    };
  }

  // 2. Detecção de Perguntas de FLAVOR / CULTURA ("como seria", "etiqueta", "protocolo", "costumes", "banquete")
  if (lower.startsWith('como seria') || lower.includes('etiqueta') || lower.includes('protocolo') || lower.includes('costumes') || lower.includes('banquete')) {
    return {
      category: 'FLAVOR',
      actionType: 'FLAVOR_QUERY',
      confidence: 0.95,
      requiresClarification: false,
      rawInput: input
    };
  }

  // 3. Casos Ambíguos Conhecidos ("prepare meus homens", "aumentar o tamanho da minha tropa", "organizar exército")
  if (lower.includes('prepare meus homens') || lower.includes('aumentar o tamanho') || lower.includes('preparar exercito') || lower.includes('juntar a tropa')) {
    return {
      category: 'AMBIGUOUS',
      actionType: 'RECRUIT',
      target: 'INFANTRY_LEVIES',
      quantity: null,
      confidence: 0.85,
      requiresClarification: true,
      clarificationPrompt: "Você deseja recrutar mais soldados ou mover suas tropas existentes? Especifique a quantidade exata de homens.",
      rawInput: input
    };
  }

  // 4. Intenção de RECRUTAMENTO ou MOVIMENTO DE TROPAS ("recrutar", "contratar", "mandar X homens", "reunir X homens")
  if (lower.includes('recrut') || lower.includes('contrat') || lower.includes('reunir') || lower.includes('mandar') || lower.includes('homens') || lower.includes('soldado') || lower.includes('infantaria')) {
    const quantityMatch = input.match(/\b(\d+)\b/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : null;

    if (quantity === null || lower.includes('alguns') || lower.includes('poucos')) {
      return {
        category: 'AMBIGUOUS',
        actionType: 'RECRUIT',
        target: 'INFANTRY_LEVIES',
        quantity: null,
        confidence: 0.85,
        requiresClarification: true,
        clarificationPrompt: "Quantos soldados você deseja mobilizar ou recrutar? (Especifique a quantidade exata, ex: 10, 20 ou 50).",
        rawInput: input
      };
    }

    if (quantity <= 0) {
      return {
        category: 'AMBIGUOUS',
        actionType: 'RECRUIT',
        target: 'INFANTRY_LEVIES',
        quantity: 0,
        confidence: 0.85,
        requiresClarification: true,
        clarificationPrompt: "A quantidade de soldados para recrutamento deve ser maior que zero.",
        rawInput: input
      };
    }

    const isTravel = lower.includes('mandar') || lower.includes('fronteira') || lower.includes('marchar');
    return {
      category: 'MECHANICAL',
      actionType: isTravel ? 'TRAVEL' : 'RECRUIT',
      target: 'INFANTRY_LEVIES',
      quantity,
      confidence: 0.98,
      requiresClarification: false,
      rawInput: input
    };
  }

  // 5. Intenção de COMÉRCIO / COMPRA DE RECURSOS / IMPOSTOS ("comprar", "coletar impostos", "trocar", "vender")
  if (lower.includes('comprar') || lower.includes('coletar impostos') || lower.includes('trocar') || lower.includes('vender') || lower.includes('impostos')) {
    return {
      category: 'MECHANICAL',
      actionType: 'TRADE',
      confidence: 0.92,
      requiresClarification: false,
      rawInput: input
    };
  }

  // 6. Intenção de CONSTRUÇÃO / FORTIFICAÇÃO
  if (lower.includes('constru') || lower.includes('fortifica') || lower.includes('palisada')) {
    let target = 'WOODEN_PALISADE';
    if (lower.includes('pedra')) target = 'STONE_WALL';

    return {
      category: 'MECHANICAL',
      actionType: 'BUILD',
      target,
      confidence: 0.92,
      requiresClarification: false,
      rawInput: input
    };
  }

  // 7. Intenção de VIAGEM / DESLOCAMENTO
  if (lower.includes('viajar') || lower.includes('marchar') || lower.includes('deslocar')) {
    return {
      category: 'MECHANICAL',
      actionType: 'TRAVEL',
      confidence: 0.88,
      requiresClarification: false,
      rawInput: input
    };
  }

  // Fallback para consultas informativas
  return {
    category: 'INFORMATION',
    actionType: 'UNKNOWN',
    confidence: 0.5,
    requiresClarification: false,
    rawInput: input
  };
}
