import 'dotenv/config';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ModelRegistry } from '../../src/llm/registry/ModelRegistry';

describe('=== M27.5: ADAPTIVE TASK ROUTER & MODEL LIFECYCLE FAILOVER ===', () => {
  it('[ROUTER-01] Deve rotear tarefas de forma especializada (Interpreter vs Narrator)', () => {
    const registry = new ModelRegistry();

    // Com Gemini e OpenRouter disponíveis:
    // Gemini (interpreterScore: 9.5) deve ser selecionado para INTERPRET_INTENT
    const interpreterModel = registry.resolveModelForTask('INTERPRET_INTENT', 'free-tier');
    assert.strictEqual(interpreterModel.provider, 'gemini');

    // OpenRouter (narratorScore: 9.3) deve ser selecionado para NARRATE_EXECUTION
    const narratorModel = registry.resolveModelForTask('NARRATE_EXECUTION', 'free-tier');
    assert.strictEqual(narratorModel.provider, 'openrouter');
  });

  it('[ROUTER-02] Simulação 404 / Descontinuação: Deve realizar substituição de modelo 100% transparente', () => {
    const registry = new ModelRegistry();

    // 1. Gemini está ativo como interpreter
    const primary = registry.resolveModelForTask('INTERPRET_INTENT', 'free-tier');
    assert.strictEqual(primary.id, 'gemini-free-default');

    // 2. Gemini sofre 404 e é marcado como UNAVAILABLE
    registry.markUnavailable('gemini-free-default');
    assert.strictEqual(registry.getModelStatus('gemini-free-default'), 'UNAVAILABLE');

    // 3. Router transiciona automaticamente para o próximo candidato qualificado sem lançar erro
    const fallback = registry.resolveModelForTask('INTERPRET_INTENT', 'free-tier');
    assert.notStrictEqual(fallback.id, 'gemini-free-default');
    assert.strictEqual(fallback.provider, 'openrouter');
  });

  it('[ROUTER-03] Simulação Modelo Pago: Deve ser rejeitado pelo pool gratuito', () => {
    const registry = new ModelRegistry();

    // OpenRouter é marcado como PAID
    registry.markPaid('openrouter-free-default');
    assert.strictEqual(registry.getModelStatus('openrouter-free-default'), 'PAID');

    // Ao solicitar NARRATE_EXECUTION, não deve escolher o modelo pago
    const narrator = registry.resolveModelForTask('NARRATE_EXECUTION', 'free-tier');
    assert.notStrictEqual(narrator.id, 'openrouter-free-default');
  });

  it('[ROUTER-04] Simulação Rate Limit (429): Deve respeitar cooldown temporário e reativar após expiração', async () => {
    const registry = new ModelRegistry();

    // 1. Marca Gemini com cooldown de 50ms
    registry.markRateLimited('gemini-free-default', 50);
    assert.strictEqual(registry.getModelStatus('gemini-free-default'), 'RATE_LIMITED');

    // Durante o cooldown, Gemini é ignorado
    const temporaryChoice = registry.resolveModelForTask('INTERPRET_INTENT', 'free-tier');
    assert.notStrictEqual(temporaryChoice.id, 'gemini-free-default');

    // 2. Aguarda expiração do cooldown
    await new Promise(r => setTimeout(r, 60));

    // 3. Status volta automaticamente para ACTIVE e Gemini volta a ser o primário
    assert.strictEqual(registry.getModelStatus('gemini-free-default'), 'ACTIVE');
    const recoveredChoice = registry.resolveModelForTask('INTERPRET_INTENT', 'free-tier');
    assert.strictEqual(recoveredChoice.id, 'gemini-free-default');
  });

  it('[ROUTER-05] Blackout Total Remoto: Deve acionar MockAdapter determinístico sem quebrar a execução', () => {
    const registry = new ModelRegistry();

    // Desativa todos os modelos online
    registry.markUnavailable('gemini-free-default');
    registry.markUnavailable('openrouter-free-default');
    registry.markUnavailable('opencode-free-default');
    registry.markUnavailable('huggingface-free-default');

    const interpreter = registry.resolveModelForTask('INTERPRET_INTENT', 'free-tier');
    const narrator = registry.resolveModelForTask('NARRATE_EXECUTION', 'free-tier');

    assert.strictEqual(interpreter.provider, 'mock');
    assert.strictEqual(narrator.provider, 'mock');
  });
});
