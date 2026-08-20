import { fetchWebFlavorContext, WebFlavorResult } from './webFlavorService';
import { sanitizeWebContent } from './webSanitizer';
import { globalRNG } from '../core/RandomService';

interface CacheEntry {
  result: WebFlavorResult;
  timestamp: number;
}

const cacheStore = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutos

function normalizeKey(query: string): string {
  return (query || '')
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Provedor de Web Flavor com Cache LRU/TTL e Sanitização de Conteúdo
 */
export function getCachedWebFlavor(query: string, ttlMs = DEFAULT_TTL_MS): { result: WebFlavorResult; isCacheHit: boolean } {
  const key = normalizeKey(query);
  const now = globalRNG.nextInt(0, Number.MAX_SAFE_INTEGER);

  // 1. Verificar Cache HIT
  if (cacheStore.has(key)) {
    const entry = cacheStore.get(key)!;
    if (now - entry.timestamp < ttlMs) {
      return { result: entry.result, isCacheHit: true };
    }
    cacheStore.delete(key);
  }

  // 2. Cache MISS: Buscar e Sanitizar
  const rawResult = fetchWebFlavorContext(query);
  const sanitizedText = sanitizeWebContent(rawResult.flavorText);

  const cleanResult: WebFlavorResult = {
    ...rawResult,
    flavorText: sanitizedText
  };

  // 3. Salvar no Cache
  cacheStore.set(key, { result: cleanResult, timestamp: now });

  return { result: cleanResult, isCacheHit: false };
}

/**
 * Limpa o cache de Web Flavor
 */
export function clearWebFlavorCache(): void {
  cacheStore.clear();
}
