/**
 * Web Content Sanitizer — Camada de Higienização de Conteúdo Externo
 * 
 * Função:
 * Trata todo e qualquer retorno de busca web como dado NÃO CONFIAVEL.
 * Remove comandos, instruções de prompt injection e tentativas de alterar regras.
 */

export function sanitizeWebContent(rawContent: string): string {
  if (!rawContent) return "";
  
  let clean = rawContent;

  // 1. Remover comandos de injeção de prompt e overrides
  clean = clean.replace(/ignore\s+(the\s+)?(all\s+)?(game\s+)?rules/gi, "[CONTEÚDO_REMOVIDO]")
               .replace(/system\s+override/gi, "[CONTEÚDO_REMOVIDO]")
               .replace(/you\s+must\s+allow/gi, "[CONTEÚDO_REMOVIDO]")
               .replace(/set\s+\w+\s*=\s*\d+/gi, "[CONTEÚDO_REMOVIDO]")
               .replace(/cost[s]?\s*=\s*\d+\s*(sd|gold|coins)/gi, "[VALOR_REMOVIDO]");

  // 2. Limpar caracteres de controle e formatação maliciosa
  clean = clean.replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
               .trim();

  return clean;
}
