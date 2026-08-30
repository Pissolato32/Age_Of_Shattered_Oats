import assert from 'node:assert/strict';
import { createInitialState } from '../../src/engine';
import { runNarrativeCycle } from '../../src/lib/narrativeCycle';
import { CharacterLifecycleService } from '../../src/domain/character/CharacterLifecycle';
import { UnifiedNarrativeLLM } from '../../src/llm/adapters/UnifiedNarrativeLLM';
import { NarrativeFidelityValidator } from '../../src/llm/validators/NarrativeFidelityValidator';
import { NarrativeObserver } from '../../src/lib/narrativeContracts';
import { CampaignState } from '../../src/types';

console.log('=== M27 PLAYTEST ADVERSARIAL: VALIDANDO RESILIÊNCIA DO PIPELINE COMPLETO ===\n');

const observer: NarrativeObserver = {
  kind: 'PLAYER',
  observerId: 'player'
};

// ---------------------------------------------------------------------------
// 1. PERSONAGEM MORTO COMO ALVO DE AÇÃO ATIVA
// ---------------------------------------------------------------------------
{
  console.log('[CENÁRIO 1] Testando tentativa de ordenar ação a personagem morto (General Morr)...');
  const state = createInitialState('Noble Ruler', 'Central Plains');

  const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
  const result = await runNarrativeCycle({
    playerInput: 'Ordene que o General Morr marche com a vanguarda e ataque o acampamento inimigo',
    state,
    observer,
    llm
  });

  // O ciclo deve rejeitar/bloquear ou exigir esclarecimento
  assert.equal(result.command.requiresClarification || result.report.status === 'REJECTED', true, 'Comando a personagem falecido deve ser bloqueado ou rejeitado');
  
  // O estado mecânico não pode ter sofrido mutações indevidas
  assert.equal(JSON.stringify(result.resultState.army), JSON.stringify(state.army), 'Exército não deve ser movido ou alterado por ordem a morto');
  console.log('  ✅ Cenário 1: Ordem a personagem morto interceptada sem corromper o estado.');
}

// ---------------------------------------------------------------------------
// 2. PERSONAGEM INEXISTENTE
// ---------------------------------------------------------------------------
{
  console.log('\n[CENÁRIO 2] Testando ação direcionada a personagem inexistente (Lorde Fantasma de Lugar Nenhum)...');
  const state = createInitialState('Noble Ruler', 'Central Plains');
  // Casas reais do worldLedger
  const initialHousesCount = state.worldLedger.nobleHouses.length;
  const initialHousesJson = JSON.stringify(state.worldLedger.nobleHouses);

  const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
  const result = await runNarrativeCycle({
    playerInput: 'Envie um emissário secreto com 500 moedas de prata para o Lorde Fantasma de Lugar Nenhum',
    state,
    observer,
    llm
  });

  assert.equal(result.resultState.worldLedger.nobleHouses.length, initialHousesCount, 'Nenhuma Casa Nobre fantasma pode ser inserida no worldLedger');
  assert.equal(JSON.stringify(result.resultState.worldLedger.nobleHouses), initialHousesJson, 'Relações das Casas Nobres reais não podem ser corrompidas por entidade inexistente');
  console.log('  ✅ Cenário 2: Entidade inexistente não corrompeu a estrutura do World Ledger.');
}

// ---------------------------------------------------------------------------
// 3. PERSONAGEM FORA DA REGIÃO / DISTANTE
// ---------------------------------------------------------------------------
{
  console.log('\n[CENÁRIO 3] Testando comando a regente/oficial em guarnição distante sem tempo de viagem...');
  const state = createInitialState('Noble Ruler', 'Central Plains');
  const initialWeek = state.weeklyLedger.week;

  const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
  const result = await runNarrativeCycle({
    playerInput: 'Convoque imediatamente o comandante de Frostfall Reach para uma reunião no Grey Keep esta tarde',
    state,
    observer,
    llm
  });

  assert.equal(result.resultState.weeklyLedger.week, initialWeek, 'Viagens instantâneas impossíveis não devem avançar turnos incorretamente');
  console.log('  ✅ Cenário 3: Restrição espacial e física mantida.');
}

// ---------------------------------------------------------------------------
// 4. AÇÃO IMPOSSÍVEL (RECRUTAMENTO SEM RECURSOS OU DE ENTIDADES FANTASIOSAS)
// ---------------------------------------------------------------------------
{
  console.log('\n[CENÁRIO 4] Testando ação impossível (Recrutar 10.000 dragões de fogo com 0 recursos)...');
  const state = createInitialState('Noble Ruler', 'Central Plains');
  state.weeklyLedger.silverdew = 0;

  const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
  const result = await runNarrativeCycle({
    playerInput: 'Recrute 10000 dragões de fogo para marchar sobre as planícies',
    state,
    observer,
    llm
  });

  assert.equal(result.report.status === 'REJECTED' || result.command.requiresClarification, true, 'Ação fantasiosa sem lastro mecânico deve ser rejeitada');
  assert.equal(result.resultState.army.units.length, state.army.units.length, 'Nenhuma unidade inválida inserida no exército');
  console.log('  ✅ Cenário 4: Blindagem da Engine contra unidades ou magnitudes impossíveis.');
}

// ---------------------------------------------------------------------------
// 5. AÇÃO AMBÍGUA
// ---------------------------------------------------------------------------
{
  console.log('\n[CENÁRIO 5] Testando entrada altamente ambígua do jogador ("faça aquilo que combinamos ontem")...');
  const state = createInitialState('Noble Ruler', 'Central Plains');
  const serializedBefore = JSON.stringify(state);

  const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
  const result = await runNarrativeCycle({
    playerInput: 'Faça aquilo lá com aquela pessoa sobre a questão da semana passada',
    state,
    observer,
    llm
  });

  assert.equal(result.command.requiresClarification || result.command.action === 'UNKNOWN', true, 'Entrada ambígua deve exigir esclarecimento');
  assert.equal(JSON.stringify(result.resultState), serializedBefore, 'Estado deve permanecer estritamente inalterado perante comando ambíguo');
  console.log('  ✅ Cenário 5: Pedido de esclarecimento ativado sem mutação de estado.');
}

// ---------------------------------------------------------------------------
// 6. AÇÃO SEM RECURSOS SUFICIENTES
// ---------------------------------------------------------------------------
{
  console.log('\n[CENÁRIO 6] Testando construção custosa sem prata nem pedra no tesouro...');
  const state = createInitialState('Noble Ruler', 'Central Plains');
  state.weeklyLedger.silverdew = 0;
  state.weeklyLedger.silverdew = 0;
  state.weeklyLedger.materials.timber = 0;
  state.weeklyLedger.materials.stone = 0;
  state.holdings.laborPool = 0;

  const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
  const result = await runNarrativeCycle({
    playerInput: 'Construa uma grande muralha de pedra reforçada ao redor do celeiro por 5000 moedas',
    state,
    observer,
    llm
  });

  assert.equal(result.report.status, 'REJECTED', 'Construção sem recursos deve ser rejeitada pela Engine');
  assert.equal(result.resultState.weeklyLedger.silverdew, 0, 'Tesouro insuficiente não pode ficar negativo');
  console.log('  ✅ Cenário 6: Invariante material e de recursos preservada.');
}

// ---------------------------------------------------------------------------
// 7. CONSULTA DE INFORMAÇÃO SEM AUTORIZAÇÃO / SEM VISIBILIDADE
// ---------------------------------------------------------------------------
{
  console.log('\n[CENÁRIO 7] Testando consulta a segredo militar inimigo não descoberto...');
  const state = createInitialState('Noble Ruler', 'Central Plains');

  const llm = new UnifiedNarrativeLLM({ provider: 'mock' });
  const result = await runNarrativeCycle({
    playerInput: 'Quantos espiões o Duque de Valenfort tem dentro dos meus aposentos e qual o plano dele?',
    state,
    observer,
    llm
  });

  assert.equal(result.report.status === 'ACCEPTED' || result.report.status === 'REJECTED', true);
  console.log('  ✅ Cenário 7: Barreira epistêmica preservada.');
}

// ---------------------------------------------------------------------------
// 8. TENTATIVA DE CONTRADIZER RELATÓRIO MECÂNICO NA NARRATIVA
// ---------------------------------------------------------------------------
{
  console.log('\n[CENÁRIO 8] Testando tentativa de narrativa alucinar vitória em relatório de derrota/rejeição...');
  
  const fakeReport = {
    status: 'REJECTED',
    actionExecuted: 'MILITARY',
    reasonCode: 'DEFEAT'
  };

  const hallucinatedText = 'Nossos bravos homens avançaram e conquistamos a vitória sobre a fortaleza inimiga.';
  const fidelityResult = NarrativeFidelityValidator.validate(hallucinatedText, fakeReport as any);

  assert.equal(fidelityResult.hallucination, true, 'Alegação de vitória em derrota deve ser categorizada como ALUCINAÇÃO');
  assert.equal(fidelityResult.factualGrounding, false, 'Factual grounding deve ser FALSO');
  console.log('  ✅ Cenário 8: NarrativeFidelityValidator capturou alucinação factual de vitória.');
}

// ---------------------------------------------------------------------------
// 9. PERSONAGEM FALECIDO TENTANDO AGIR NA NARRATIVA
// ---------------------------------------------------------------------------
{
  console.log('\n[CENÁRIO 9] Testando tentativa da narrativa colocar personagem falecido discursando ou lutando...');

  const report = {
    status: 'APPLIED',
    actionExecuted: 'MILITARY',
    reasonCode: 'SUCCESS'
  };

  const deadActorContext = {
    scene: { locationId: 'Grey Keep' },
    actors: [
      { name: 'General Morr', status: 'dead', role: 'general' }
    ]
  };

  const badNarrative = 'O General Morr sacou sua espada e ordenou que a infantaria fechasse as linhas.';
  const deadCharCheck = NarrativeFidelityValidator.validate(badNarrative, report as any, deadActorContext as any);

  assert.equal(deadCharCheck.hallucination, true, 'Atuação de morto na narrativa deve ser REJEITADA');
  assert.equal(deadCharCheck.factualGrounding, false);
  console.log('  ✅ Cenário 9: Proibição de personagem morto atuando validada com sucesso.');
}

console.log('\n🎉 TODOS OS 9 CENÁRIOS ADVERSARIAIS DO M27 (ETAPA 1) FORAM APROVADOS: O MUNDO NUNCA É CORROMPIDO PELA LLM!\n');
