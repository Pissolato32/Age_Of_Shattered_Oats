import { executePlaytestTurnPristine, loadOrCreatePlaytestState } from './PlaytestSessionRunner';

interface TurnScript {
  week: number;
  expectedDomain: string;
  order: string;
}

const CAMPAIGN_ORDERS: TurnScript[] = [
  // --- MÊS 1: GREENING (Primavera / Semeadura / Organização) ---
  {
    week: 1,
    expectedDomain: 'INFORMATION',
    order: 'Gerold, qual é a situação atual dos nossos cofres, celeiros e das aldeias de Ravens Watch?'
  },
  {
    week: 2,
    expectedDomain: 'BUILD',
    order: 'Aldren, mobilize os trabalhadores para construir uma paliçada de defesa ao redor dos celeiros da fortaleza.'
  },
  {
    week: 3,
    expectedDomain: 'TRADE',
    order: 'Gerold, compre 10 sacas de cereais dos mercadores fluviais para reforçar nossa reserva de sementes.'
  },
  {
    week: 4,
    expectedDomain: 'RECRUIT',
    order: 'Marechal Ren, recrutar 10 soldados da infantaria entre os jovens da vila para reforçar a guarda.'
  },

  // --- MÊS 2: BLOOM (Florescimento / Fronteiras / Diplomacia) ---
  {
    week: 5,
    expectedDomain: 'ESPIONAGE',
    order: 'Roric, envie batedores para a velha ponte de pedra para investigar quem está acampado ali, mantendo discrição.'
  },
  {
    week: 6,
    expectedDomain: 'DIPLOMACY',
    order: 'Tobin, envie uma comitiva formal à ponte velha sob bandeira de trégua para exigir identificação pacífica.'
  },
  {
    week: 7,
    expectedDomain: 'MILITARY',
    order: 'Roric, mobilize um destacamento para estabelecer um piquete na encruzilhada da estrada norte e bloquear suprimentos.'
  },
  {
    week: 8,
    expectedDomain: 'INFORMATION',
    order: 'Tobin, como está o humor do povo e a lealdade dos vassalos vizinhos neste mês?'
  },

  // --- MÊS 3: SUNHEIGHT (Verão / Produção / Obras) ---
  {
    week: 9,
    expectedDomain: 'BUILD',
    order: 'Aldren, construa reforços de madeira nas torres da muralha oeste.'
  },
  {
    week: 10,
    expectedDomain: 'TRADE',
    order: 'Gerold, venda 5 sacas de mantimentos para os mercadores da caravana de sal.'
  },
  {
    week: 11,
    expectedDomain: 'RECRUIT',
    order: 'Marechal Ren, recrutar 5 soldados para completar a guarnição das torres.'
  },
  {
    week: 12,
    expectedDomain: 'MILITARY',
    order: 'Roric, mobilize a patrulha armada para fazer uma manobra militar nas colinas e garantir a segurança das estradas.'
  },

  // --- MÊS 4: HARVEST (Colheita / Abastecimento / Celeiros) ---
  {
    week: 13,
    expectedDomain: 'INFORMATION',
    order: 'Gerold, quanto custa expandir o armazenamento dos celeiros antes das chuvas?'
  },
  {
    week: 14,
    expectedDomain: 'TRADE',
    order: 'Gerold, compre 15 sacas de grãos dos camponeses para encher as tulhas de inverno.'
  },
  {
    week: 15,
    expectedDomain: 'DIPLOMACY',
    order: 'Tobin, envie um emissário ao Barão Valerius para propor um pacto de não-agressão nas colinas.'
  },
  {
    week: 16,
    expectedDomain: 'ESPIONAGE',
    order: 'Roric, faça um reconhecimento discreto nas ravinas ao norte para verificar movimentações estranhas.'
  },

  // --- MÊS 5: FROSTFALL (Outono / Queda de Folhas / Preparação) ---
  {
    week: 17,
    expectedDomain: 'BUILD',
    order: 'Aldren, construir valas de proteção e paliçadas ao redor da aldeia baixa.'
  },
  {
    week: 18,
    expectedDomain: 'INFORMATION',
    order: 'Roric, qual o relatório de patrulha e as condições da floresta com a chegada do frio?'
  },
  {
    week: 19,
    expectedDomain: 'TRADE',
    order: 'Gerold, venda 10 sacas de cereais excedentes para acumular prata para os soldos de inverno.'
  },
  {
    week: 20,
    expectedDomain: 'MILITARY',
    order: 'Marechal Ren, mobilize a guarnição em prontidão defensiva nos portões da fortaleza.'
  },

  // --- MÊS 6: DEEPWINTER (Inverno Profundo / Frio / Resistência) ---
  {
    week: 21,
    expectedDomain: 'INFORMATION',
    order: 'Gerold, como estão nossos estoques de lenha e comida para atravessar a nevasca?'
  },
  {
    week: 22,
    expectedDomain: 'DIPLOMACY',
    order: 'Tobin, envie uma mensagem formal aos lordes vizinhos reiterando nossa aliança comercial de inverno.'
  },
  {
    week: 23,
    expectedDomain: 'BUILD',
    order: 'Aldren, conserte e reforce os telhados dos armazéns contra o peso da neve.'
  },
  {
    week: 24,
    expectedDomain: 'INFORMATION',
    order: 'Tobin, qual a situação do povo e o moral da guarnição com o término do inverno?'
  }
];

export async function runFullCampaignPlaytest(): Promise<void> {
  console.log('=== INICIANDO PLAYTEST CAUSAL CONTÍNUO MULTI-SEMANAL (ANO 342) ===\n');

  for (const step of CAMPAIGN_ORDERS) {
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`[TURNO ${step.week}] Ordem do Jogador: "${step.order}"`);

    const result = await executePlaytestTurnPristine(step.order);
    const trace = result.traceEntry;

    console.log(`-> Ação Classificada: ${trace.classifiedAction} (Esperada: ${step.expectedDomain})`);
    console.log(`-> Resolução da Engine: ${trace.engineResult.status} | Mutated: ${trace.engineResult.mutated}`);
    console.log(`-> Estado Antes: SD=${trace.stateBefore.silverdew.toFixed(1)}, Comida=${trace.stateBefore.food.toFixed(1)}, Guarnição=${trace.stateBefore.garrison}`);
    console.log(`-> Estado Depois: SD=${trace.stateAfter.silverdew.toFixed(1)}, Comida=${trace.stateAfter.food.toFixed(1)}, Guarnição=${trace.stateAfter.garrison}`);
    console.log(`-> Data no Estado: ${trace.date}`);
    console.log(`-> Violações Semânticas: ${trace.semanticValidationViolations.length === 0 ? 'NENHUMA (100% Grounded)' : trace.semanticValidationViolations.join(', ')}`);
    console.log(`-> Narrativa: "${trace.llmResponse.slice(0, 100)}..."\n`);

    if (trace.semanticValidationViolations.length > 0) {
      throw new Error(`[FALHA DE GROUNDING NO TURNO ${step.week}]: ${trace.semanticValidationViolations.join('; ')}`);
    }

    if (trace.classifiedAction !== step.expectedDomain && step.expectedDomain !== 'ANY') {
      console.warn(`⚠️ [AVISO DE CLASSIFICAÇÃO]: Esperado ${step.expectedDomain}, obteve ${trace.classifiedAction}`);
    }
  }

  const finalState = loadOrCreatePlaytestState();
  console.log('================================================================================');
  console.log('🎉 PLAYTEST CAUSAL CONTÍNUO DE 24 SEMANAS CONCLUÍDO COM 100% DE SUCESSO!');
  console.log(`Estado Final: Semana ${finalState.worldLedger.currentDate.week}, Mês ${finalState.worldLedger.currentDate.month}, Ano ${finalState.worldLedger.currentDate.year}`);
  console.log(`Silverdew Final: ${finalState.weeklyLedger.silverdew.toFixed(1)} SD`);
  console.log(`Food Final: ${finalState.weeklyLedger.food.toFixed(1)} FSU`);
  console.log(`Guarnição Final: ${finalState.holdings.garrison}`);
  console.log('Todos os traces persistidos em artifacts/playtest_causal_traces.jsonl');
}

if (process.argv[1]?.includes('CampaignContinuousPlaytester')) {
  runFullCampaignPlaytest().catch(err => {
    console.error('ERRO NO PLAYTEST CONTÍNUO:', err);
    process.exit(1);
  });
}
