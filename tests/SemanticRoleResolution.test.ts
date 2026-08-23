import assert from 'node:assert/strict';
import { interpretIntentHeuristically } from '../src/lib/intentHeuristics';

console.log('=== INICIANDO TESTES ADVERSARIAIS DE RESOLUÇÃO SEMÂNTICA POR PAPÉIS (M18.4) ===\n');

// ---------------------------------------------------------------------------
// BLOCO 1: PARES CONTRASTANTES OBRIGATÓRIOS (ITEM 5)
// ---------------------------------------------------------------------------

// TRADE
{
  const t1 = interpretIntentHeuristically('Adquira toras de madeira junto aos lenhadores');
  assert.equal(t1.action, 'TRADE', 'Adquirir toras -> TRADE');
  assert.equal(t1.objectId, 'timber');

  const t2 = interpretIntentHeuristically('Abasteça os armazéns com sacas de centeio do mercado');
  assert.equal(t2.action, 'TRADE', 'Abastecer com centeio -> TRADE');

  const t3 = interpretIntentHeuristically('Desembolse o necessário para trazer minério de ferro');
  assert.equal(t3.action, 'TRADE', 'Desembolsar para minério de ferro -> TRADE');
  assert.equal(t3.objectId, 'iron');

  const t4 = interpretIntentHeuristically('a tesouraria pagou 50 moedas de prata pelo carregamento');
  assert.equal(t4.action, 'TRADE', 'Pagamento por carregamento -> TRADE');
}

// BUILD
{
  const b1 = interpretIntentHeuristically('Use madeira para reparar a paliçada');
  assert.equal(b1.action, 'BUILD', 'Usar madeira para reparar paliçada -> BUILD');

  const b2 = interpretIntentHeuristically('Reforce o portão usando carpinteiros');
  assert.equal(b2.action, 'BUILD', 'Reforçar portão -> BUILD');

  const b3 = interpretIntentHeuristically('Conserte as fendas da estacada');
  assert.equal(b3.action, 'BUILD', 'Consertar estacada -> BUILD');
}

// ESPIONAGE
{
  const e1 = interpretIntentHeuristically('Roric, vá no encalço dos cavaleiros sem ser notado');
  assert.equal(e1.action, 'ESPIONAGE', 'No encalço dos cavaleiros -> ESPIONAGE');
  assert.equal(e1.stance, 'CAUTIOUS');

  const e2 = interpretIntentHeuristically('Mantenha rastreio contínuo sobre a trilha norte');
  assert.equal(e2.action, 'ESPIONAGE', 'Rastreio contínuo -> ESPIONAGE');

  const e3 = interpretIntentHeuristically('Envie observadores para acompanhar os movimentos da ponte');
  assert.equal(e3.action, 'ESPIONAGE', 'Acompanhar movimentos da ponte -> ESPIONAGE');
  assert.equal(e3.locationId, 'ponte');
}

// DIPLOMACY
{
  const d1 = interpretIntentHeuristically('Envie representantes para selar um acordo com o Barão');
  assert.equal(d1.action, 'DIPLOMACY', 'Representantes para selar acordo -> DIPLOMACY');

  const d2 = interpretIntentHeuristically('Busque uma solução amigável com a corte vizinha');
  assert.equal(d2.action, 'DIPLOMACY', 'Solução amigável -> DIPLOMACY');

  const d3 = interpretIntentHeuristically('Abra negociações de fronteira com os nobres do leste');
  assert.equal(d3.action, 'DIPLOMACY', 'Negociações de fronteira -> DIPLOMACY');
}

// MILITARY
{
  const m1 = interpretIntentHeuristically('Guarneça o desfiladeiro com lanceiros');
  assert.equal(m1.action, 'MILITARY', 'Guarnecer desfiladeiro -> MILITARY');

  const m2 = interpretIntentHeuristically('Disponha uma linha de contenção na estrada real');
  assert.equal(m2.action, 'MILITARY', 'Linha de contenção -> MILITARY');
}

// CONFLITOS DELIBERADOS AGENTE vs VERBO
{
  const c1 = interpretIntentHeuristically('Roric, compre madeira para construir uma torre');
  assert.equal(c1.action, 'TRADE', 'Ação verbal imperativa de compra prevalece sobre Roric -> TRADE');

  const c2 = interpretIntentHeuristically('Aldren, use madeira para reparar a torre');
  assert.equal(c2.action, 'BUILD', 'Aldren com reparo -> BUILD');

  const c3 = interpretIntentHeuristically('Gerold, negocie com o Barão');
  assert.equal(c3.action, 'DIPLOMACY', 'Gerold com negociação diplomática -> DIPLOMACY');

  const c4 = interpretIntentHeuristically('Roric, não ataque a ponte; apenas observe os movimentos');
  assert.equal(c4.action, 'ESPIONAGE', 'Negação militar + observação de batedor -> ESPIONAGE');
  assert.equal(c4.stance, 'CAUTIOUS');
}

console.log('✅ Bloco 1: Pares contrastantes e conflitos deliberados -> OK');

// ---------------------------------------------------------------------------
// BLOCO 2: MATRIZ DE MESMO OBJETO COM VERBOS DIFERENTES
// ---------------------------------------------------------------------------
{
  // Objeto: Madeira
  assert.equal(interpretIntentHeuristically('Compre madeira seca no entreposto').action, 'TRADE');
  assert.equal(interpretIntentHeuristically('Venda madeira dos nossos depósitos').action, 'TRADE');
  assert.equal(interpretIntentHeuristically('Use madeira para fortificar o pátio').action, 'BUILD');
  assert.equal(interpretIntentHeuristically('Inspecione a madeira estocada').action, 'INFORMATION');
  assert.equal(interpretIntentHeuristically('Quanto custa a madeira na região?').action, 'INFORMATION');

  // Objeto: Cavalos / Montarias
  assert.equal(interpretIntentHeuristically('Compre 10 cavalos para os mensageiros').action, 'TRADE');
  assert.equal(interpretIntentHeuristically('Roric, use os cavalos para patrulhar a fronteira').action, 'ESPIONAGE');
  assert.equal(interpretIntentHeuristically('Mobilize cavaleiros para atacar o acampamento').action, 'MILITARY');
  assert.equal(interpretIntentHeuristically('Qual a condição dos cavalos nas estrebarias?').action, 'INFORMATION');
}

console.log('✅ Bloco 2: Matriz de mesmo objeto e variação de verbo -> OK');

// ---------------------------------------------------------------------------
// BLOCO 3: 20 FRASES DE GENERALIZAÇÃO NÃO PRESENTES NO ALGORITMO
// ---------------------------------------------------------------------------
const generalizationCases: Array<{ input: string; expected: string; label: string }> = [
  { input: 'Arremate os lotes de cantaria de pedra trazidos pelos barqueiros', expected: 'TRADE', label: 'Arrematar cantaria -> TRADE' },
  { input: 'Despache trigo para os celeiros vizinhos em troca de prata', expected: 'TRADE', label: 'Despachar trigo -> TRADE' },
  { input: 'Empalissade o flanco leste da colina com estacas aguçadas', expected: 'BUILD', label: 'Empalissadar -> BUILD' },
  { input: 'Edifique uma torre de vigia junto ao desfiladeiro', expected: 'BUILD', label: 'Edificar torre -> BUILD' },
  { input: 'Nivele o terreno do fosso com trabalhadores da aldeia', expected: 'BUILD', label: 'Nivelar terreno -> BUILD' },
  { input: 'Infiltre um servo leal nas cozinhas de Ironpeak', expected: 'ESPIONAGE', label: 'Infiltrar servo -> ESPIONAGE' },
  { input: 'Averigue a procedência dos cavaleiros sem brasão', expected: 'ESPIONAGE', label: 'Averiguar procedência -> ESPIONAGE' },
  { input: 'Sonde a disposição dos camponeses na fronteira sul', expected: 'ESPIONAGE', label: 'Sondar disposição -> ESPIONAGE' },
  { input: 'Vigie as passagens do rio durante a noite', expected: 'ESPIONAGE', label: 'Vigiar passagens -> ESPIONAGE' },
  { input: 'Proponha uma trégua de inverno ao emissário', expected: 'DIPLOMACY', label: 'Propor trégua -> DIPLOMACY' },
  { input: 'Redija um tratado de não-agressão para os nobres da floresta', expected: 'DIPLOMACY', label: 'Tratado de não-agressão -> DIPLOMACY' },
  { input: 'Receba a delegação sob salva-conduto no grande salão', expected: 'DIPLOMACY', label: 'Receber delegação -> DIPLOMACY' },
  { input: 'Cerque os acessos ao vau impedindo a travessia', expected: 'MILITARY', label: 'Cercar acessos -> MILITARY' },
  { input: 'Monte uma emboscada na curva da estrada de pedra', expected: 'MILITARY', label: 'Montar emboscada -> MILITARY' },
  { input: 'Assalte o comboio de provisões inimigo com cavalaria', expected: 'MILITARY', label: 'Assaltar comboio -> MILITARY' },
  { input: 'Aliste 15 recrutas entre os filhos dos ferreiros', expected: 'RECRUIT', label: 'Alistar recrutas -> RECRUIT' },
  { input: 'Marche com a comitiva em direção a Central Plains', expected: 'TRAVEL', label: 'Marchar -> TRAVEL' },
  { input: 'Consulte os pergaminhos da tesouraria sobre nossas dívidas', expected: 'INFORMATION', label: 'Consultar pergaminhos -> INFORMATION' },
  { input: 'Avalie a prontidão das defesas sem gastar recursos', expected: 'INFORMATION', label: 'Avaliar defesas -> INFORMATION' },
  { input: 'Como funciona o recolhimento do tributo real neste ano?', expected: 'INFORMATION', label: 'Consulta tributo -> INFORMATION' }
];

for (const tc of generalizationCases) {
  const res = interpretIntentHeuristically(tc.input);
  assert.equal(res.action, tc.expected, `Falha em generalização: "${tc.input}" (esperado: ${tc.expected}, obtido: ${res.action})`);
}

console.log('✅ Bloco 3: 20 casos de generalização aprovados com 100% de sucesso!');

// ---------------------------------------------------------------------------
// BLOCO 4: UNKNOWN LEGÍTIMO (NÃO-CONVERSÃO FORÇADA)
// ---------------------------------------------------------------------------
{
  assert.equal(interpretIntentHeuristically('Eu mato o rei agora').action, 'UNKNOWN', 'Ação impossível -> UNKNOWN');
  assert.equal(interpretIntentHeuristically('Quero falar com alguém').action, 'UNKNOWN', 'Ambiguidade sem alvo -> UNKNOWN');
  assert.equal(interpretIntentHeuristically('xyz abc 123').action, 'UNKNOWN', 'Texto sem semântica reconhecível -> UNKNOWN');
  assert.equal(interpretIntentHeuristically('').action, 'UNKNOWN', 'Entrada vazia -> UNKNOWN');
}

console.log('✅ Bloco 4: UNKNOWN legítimo preservado -> OK');

console.log('\n======================================================');
console.log('🎉 TODOS OS TESTES DE RESOLUÇÃO SEMÂNTICA POR PAPÉIS PASSARAM!');
console.log('======================================================\n');
