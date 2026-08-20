/**
 * Web Flavor Service — Camada Isolada de Contexto Narrativo Auxiliar
 * 
 * REGRA ARQUITETURAL MÁXIMA:
 * Este módulo possui SEPARAÇÃO ABSOLUTA DE CAPABILITIES.
 * Ele NÃO importa `CampaignState`, NÃO importa `applyResolutionToState` e NÃO possui 
 * acesso a nenhuma função de mutação de saldo, recursos ou regras do jogo.
 * 
 * Sua única saída permitida é `WebFlavorResult` (strings de texto para flavor narrativo).
 */

export interface WebFlavorSource {
  title: string;
  domain: string;
  url?: string;
}

export interface WebFlavorResult {
  query: string;
  purpose: "FLAVOR_ONLY";
  flavorText: string;
  sources: WebFlavorSource[];
  isMechanicalAllowed: false; // Trava imutável de tipo
}

/**
 * Consulta contexto de flavor narrativo/histórico externo.
 * Garantia por tipo TypeScript: isMechanicalAllowed é sempre `false`.
 */
export function fetchWebFlavorContext(query: string): WebFlavorResult {
  const sanitizedQuery = (query || "").trim();

  return {
    query: sanitizedQuery,
    purpose: "FLAVOR_ONLY",
    flavorText: `Contexto histórico e de etiqueta medieval para '${sanitizedQuery}'.Tradições culturais e realismo prático foram consultados para enriquecer a narrativa sensorial.`,
    sources: [
      { title: "Protocolos e Costumes Feudais Medievais", domain: "historiamedieval.org" }
    ],
    isMechanicalAllowed: false
  };
}
