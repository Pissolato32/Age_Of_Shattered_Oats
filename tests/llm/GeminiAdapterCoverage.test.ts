import assert from 'node:assert/strict';
import { GeminiAdapter } from '../../src/llm/adapters/GeminiAdapter';
import { ModelConfig } from '../../src/llm/contracts/LLMContract';

const GEMINI_MODEL_CONFIG: ModelConfig = {
  id: 'gemini-free-default',
  provider: 'gemini',
  model: 'gemini-flash-lite-latest',
  freePolicy: 'free-tier',
  maxCost: 0,
  enabled: true
};

function makeGeminiResponse(text: string, usage?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text }] } }],
      usageMetadata: usage || { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 }
    }),
    text: async () => ''
  } as unknown as Response;
}

function makeErrorResponse(status: number, body: string) {
  return {
    ok: false,
    status,
    text: async () => body
  } as unknown as Response;
}

function makeEmptyResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: '' }] } }],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 0, totalTokenCount: 10 }
    }),
    text: async () => ''
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// TEST 1 — Response Parsing: Gemini API shape → LLMGenerationResponse
// ---------------------------------------------------------------------------
{
  const capturedRequests: any[] = [];
  const mockFetch: typeof fetch = async (url, init) => {
    capturedRequests.push({ url, body: JSON.parse(init?.body as string) });
    return makeGeminiResponse('Os sinos da fortaleza ecoam quando os recrutas juram fidelidade.');
  };

  const adapter = new GeminiAdapter(GEMINI_MODEL_CONFIG, 'test-api-key', mockFetch);
  const result = await adapter.generate({
    userPrompt: '<PLAYER_INPUT>Recrutar 10 soldados</PLAYER_INPUT>',
    responseFormat: 'json'
  });

  assert.equal(result.text, 'Os sinos da fortaleza ecoam quando os recrutas juram fidelidade.');
  assert.equal(result.providerId, 'gemini');
  assert.equal(result.modelId, 'gemini-flash-lite-latest');
  assert.equal(result.usage.verifiedFree, true);
  assert.equal(result.usage.cost, 0);
  assert.ok(typeof result.latencyMs === 'number');
  assert.ok(result.rawResponse, 'rawResponse deve ser preservado');

  // Verifica payload enviado
  const payload = capturedRequests[0].body;
  assert.ok(payload.contents[0].parts[0].text.includes('<PLAYER_INPUT>'));
  assert.equal(capturedRequests[0].body.generationConfig.responseMimeType, 'application/json');

  console.log('  ✅ TEST 1: Response parsing — Gemini API shape → LLMGenerationResponse');
}

// ---------------------------------------------------------------------------
// TEST 2 — Response Parsing: systemInstruction separada do userPrompt
// ---------------------------------------------------------------------------
{
  const capturedRequests: any[] = [];
  const mockFetch: typeof fetch = async (url, init) => {
    capturedRequests.push({ body: JSON.parse(init?.body as string) });
    return makeGeminiResponse('Narrativa de teste.');
  };

  const adapter = new GeminiAdapter(GEMINI_MODEL_CONFIG, 'test-api-key', mockFetch);
  await adapter.generate({
    systemPrompt: 'Você é o cronista de Fenwick.',
    userPrompt: '<PLAYER_INPUT>Construir palisada</PLAYER_INPUT>'
  });

  const payload = capturedRequests[0].body;
  assert.ok(payload.systemInstruction, 'systemInstruction deve existir no payload');
  assert.equal(payload.systemInstruction.parts[0].text, 'Você é o cronista de Fenwick.');
  assert.ok(!payload.contents[0].parts[0].text.includes('Você é o cronista'),
    'systemInstruction não deve estar concatenada ao userPrompt');

  console.log('  ✅ TEST 2: systemInstruction separada do userPrompt no payload');
}

// ---------------------------------------------------------------------------
// TEST 3 — Response Parsing: usage metadata extraída corretamente
// ---------------------------------------------------------------------------
{
  const mockFetch: typeof fetch = async () => {
    return makeGeminiResponse('Teste de usage.', {
      promptTokenCount: 42,
      candidatesTokenCount: 18,
      totalTokenCount: 60
    });
  };

  const adapter = new GeminiAdapter(GEMINI_MODEL_CONFIG, 'test-api-key', mockFetch);
  const result = await adapter.generate({ userPrompt: 'teste' });

  assert.equal(result.usage.promptTokens, 42);
  assert.equal(result.usage.completionTokens, 18);
  assert.equal(result.usage.totalTokens, 60);

  console.log('  ✅ TEST 3: Usage metadata extraída corretamente');
}

// ---------------------------------------------------------------------------
// TEST 4 — HTTP Error: 503 → propaga erro com mensagem descritiva
// ---------------------------------------------------------------------------
{
  const mockFetch: typeof fetch = async () => {
    return makeErrorResponse(503, 'Service Unavailable');
  };

  const adapter = new GeminiAdapter(GEMINI_MODEL_CONFIG, 'test-api-key', mockFetch);

  let caught = false;
  try {
    await adapter.generate({ userPrompt: 'teste' });
  } catch (err: any) {
    caught = true;
    assert.ok(err.message.includes('503'), `Erro deve conter status 503: ${err.message}`);
    assert.ok(err.message.includes('Gemini API Error'), `Erro deve conter prefixo Gemini: ${err.message}`);
    assert.ok(err.message.includes('Service Unavailable'), `Erro deve conter body: ${err.message}`);
  }
  assert.ok(caught, 'Deve ter lançado erro para HTTP 503');

  console.log('  ✅ TEST 4: HTTP 503 → propaga erro com mensagem descritiva');
}

// ---------------------------------------------------------------------------
// TEST 5 — HTTP Error: 429 → propaga erro (rate limit)
// ---------------------------------------------------------------------------
{
  const mockFetch: typeof fetch = async () => {
    return makeErrorResponse(429, 'Rate limit exceeded');
  };

  const adapter = new GeminiAdapter(GEMINI_MODEL_CONFIG, 'test-api-key', mockFetch);

  let caught = false;
  try {
    await adapter.generate({ userPrompt: 'teste' });
  } catch (err: any) {
    caught = true;
    assert.ok(err.message.includes('429'));
  }
  assert.ok(caught, 'Deve ter lançado erro para HTTP 429');

  console.log('  ✅ TEST 5: HTTP 429 → propaga erro (rate limit)');
}

// ---------------------------------------------------------------------------
// TEST 6 — Fallback: modelo primário falha → tenta fallback
// ---------------------------------------------------------------------------
{
  let callCount = 0;
  const mockFetch: typeof fetch = async (url) => {
    callCount++;
    const urlStr = String(url);
    if (urlStr.includes('gemini-flash-lite-latest')) {
      return makeErrorResponse(503, 'Primary model down');
    }
    // Fallback model succeeds
    return makeGeminiResponse('Resposta do modelo fallback.');
  };

  const configWithFallback: ModelConfig = {
    ...GEMINI_MODEL_CONFIG,
    fallbackModels: ['gemini-1.5-flash']
  };

  const adapter = new GeminiAdapter(configWithFallback, 'test-api-key', mockFetch);
  const result = await adapter.generate({ userPrompt: 'teste' });

  assert.equal(callCount, 2, 'Deve ter chamado 2 modelos (primário + fallback)');
  assert.equal(result.text, 'Resposta do modelo fallback.');
  assert.equal(result.modelId, 'gemini-1.5-flash');

  console.log('  ✅ TEST 6: Fallback — primário 503 → modelo alternativo com sucesso');
}

// ---------------------------------------------------------------------------
// TEST 7 — Empty Response: candidato vazio → erro
// ---------------------------------------------------------------------------
{
  const mockFetch: typeof fetch = async () => {
    return makeEmptyResponse();
  };

  const adapter = new GeminiAdapter(GEMINI_MODEL_CONFIG, 'test-api-key', mockFetch);

  let caught = false;
  try {
    await adapter.generate({ userPrompt: 'teste' });
  } catch (err: any) {
    caught = true;
    assert.ok(err.message.includes('Empty response'));
  }
  assert.ok(caught, 'Deve ter lançado erro para resposta vazia');

  console.log('  ✅ TEST 7: Resposta vazia do Gemini → erro "Empty response"');
}

// ---------------------------------------------------------------------------
// TEST 8 — Missing API Key: lança erro imediatamente
// ---------------------------------------------------------------------------
{
  const mockFetch: typeof fetch = async () => {
    return makeGeminiResponse('não deve chegar aqui');
  };

  const adapter = new GeminiAdapter(GEMINI_MODEL_CONFIG, undefined, mockFetch);

  let caught = false;
  try {
    await adapter.generate({ userPrompt: 'teste' });
  } catch (err: any) {
    caught = true;
    assert.ok(err.message.includes('API key missing'), `Erro deve mencionar API key: ${err.message}`);
  }
  assert.ok(caught, 'Deve ter lançado erro para API key ausente');

  console.log('  ✅ TEST 8: Missing API key → lança erro "API key missing"');
}

// ---------------------------------------------------------------------------
// TEST 9 — Timeout: AbortController aborta após timeoutMs
// ---------------------------------------------------------------------------
{
  let fetchAborted = false;
  const mockFetch: typeof fetch = async (_url, init): Promise<Response> => {
    // Simula request lento — nunca resolve
    return new Promise((_, reject) => {
      const signal = init?.signal;
      if (signal) {
        signal.addEventListener('abort', () => {
          fetchAborted = true;
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      }
    });
  };

  const adapter = new GeminiAdapter(GEMINI_MODEL_CONFIG, 'test-api-key', mockFetch);

  let caught = false;
  const start = Date.now();
  try {
    await adapter.generate({ userPrompt: 'teste', timeoutMs: 100 });
  } catch (err: any) {
    caught = true;
    // O erro pode ser AbortError ou propagado do fetch
  }
  const elapsed = Date.now() - start;

  assert.ok(caught, 'Deve ter lançado erro por timeout');
  assert.ok(fetchAborted, 'AbortController deve ter abortado o fetch');
  assert.ok(elapsed < 2000, `Timeout deve ser rápido (<2s), elapsed: ${elapsed}ms`);

  console.log('  ✅ TEST 9: Timeout → AbortController aborta fetch');
}

// ---------------------------------------------------------------------------
// TEST 10 — JSON mode: generationConfig inclui responseMimeType
// ---------------------------------------------------------------------------
{
  const capturedRequests: any[] = [];
  const mockFetch: typeof fetch = async (_url, init) => {
    capturedRequests.push({ body: JSON.parse(init?.body as string) });
    return makeGeminiResponse('{"action":"RECRUIT"}');
  };

  const adapter = new GeminiAdapter(GEMINI_MODEL_CONFIG, 'test-api-key', mockFetch);
  await adapter.generate({ userPrompt: 'teste', responseFormat: 'json' });

  const config = capturedRequests[0].body.generationConfig;
  assert.equal(config.responseMimeType, 'application/json');

  console.log('  ✅ TEST 10: JSON mode → responseMimeType = application/json');
}

// ---------------------------------------------------------------------------
// TEST 11 — temperature e maxTokens propagados ao generationConfig
// ---------------------------------------------------------------------------
{
  const capturedRequests: any[] = [];
  const mockFetch: typeof fetch = async (_url, init) => {
    capturedRequests.push({ body: JSON.parse(init?.body as string) });
    return makeGeminiResponse('ok');
  };

  const adapter = new GeminiAdapter(GEMINI_MODEL_CONFIG, 'test-api-key', mockFetch);
  await adapter.generate({ userPrompt: 'teste', temperature: 0.7, maxTokens: 512 });

  const config = capturedRequests[0].body.generationConfig;
  assert.equal(config.temperature, 0.7);
  assert.equal(config.maxOutputTokens, 512);

  console.log('  ✅ TEST 11: temperature e maxTokens propagados ao generationConfig');
}

console.log('GeminiAdapterCoverage.test.ts: TODOS OS 11 TESTES PASSARAM');
