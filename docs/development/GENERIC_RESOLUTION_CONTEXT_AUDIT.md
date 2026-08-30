# GENERIC RESOLUTION CONTEXT & DERIVATION AUDIT (M12 — Gate 1)

**Data**: 2026-08-20  
**Branch**: `integration/legacy-consolidation`  
**Commit Baseline**: `d32b87f`  
**Status**: READ-ONLY ARCHITECTURAL AUDIT  

---

## 1. Estado do Repositório

- **Branch**: `integration/legacy-consolidation`
- **HEAD Commit**: `d32b87f` (`ahead 0, behind 0` em relação a `origin/integration/legacy-consolidation`)
- **Status da Working Tree**: Limpa, sem alterações funcionais pendentes.
- **Autoridade Mecânica**: O princípio `ENGINE > CONTRACTS > NARRATIVE LAYER > LLM` permanece 100% íntegro em todas as camadas.

---

## 2. Inventário de Fatores Reais do Jogo

| Fator | Existe no Código? | Fonte no Código | Tipo | Pode Influenciar Resolução Genérica? |
|---|---|---|---|---|
| **Settlement Tier** | Sim | `state.holdings.type` / `state.holdings.tier` | Canônico / Derivado | **SIM** (Escala do feudo: Bastion=1, Town=2, Castle=3, City=4) |
| **Labor Pool** | Sim | `state.holdings.laborPool` / `LaborService` | Derivado ($40\%$ pop civil) | **SIM** (Capacidade de homens/força bruta) |
| **Silverdew (Tesouro)** | Sim | `state.weeklyLedger.silverdew` | Estado Canônico | **SIM** (Teto orçamentário e custos materiais) |
| **População** | Sim | `state.holdings.population` | Estado Canônico | **SIM** (Base demográfica de recrutamento e esforço) |
| **Infraestrutura** | Sim | `state.holdings.fortification`, `resourcePatches` | Estado Canônico | **SIM** (Qualidade e bônus de oficina/defesa) |
| **Weather (Clima)** | Sim | `state.weeklyLedger.weather` | Estado Canônico | **SIM** (Modificador de atrito e deslocamento) |
| **Season (Estação)** | Sim | `state.weeklyLedger.season` | Estado Canônico | **SIM** (Penalidades agrícolas no inverno: -25% ou +50% custo) |
| **Terrain (Terreno)** | Parcial | `state.character.location.region` | Domínio / Geográfico | **SIM** (Dificuldade de viagem e atrito de terreno) |
| **Distância** | Sim | `state.character.location.distanceNearTown`, `VisibilityService` | Derivado / Matriz | **SIM** (Atraso temporal em dias/semanas) |
| **Relações (Opinião)** | Sim | `Relationship.opinion` (-3 a +3), `NobleHouse.opinion` | Domínio Canônico | **SIM** (Modificador de diplomacia/suborno/negociação) |
| **Oposição** | Sim | `NobleHouse.status`, `TribalRelation.opinion` | Domínio Canônico | **SIM** (Resistência passiva ou ativa de facções) |
| **Capacidade do Ator** | Sim | `state.character.stats.commanderTier`, `reputation` | Domínio Canônico | **SIM** (Bônus de liderança e prestígio do governante) |
| **Risco** | Derivado | Matriz de Oposição $\times$ Terreno $\times$ Clima | Derivado Matemático | **SIM** (Probabilidade de falha crítica ou custo excedente) |
| **Tempo Disponível** | Sim | `state.worldState.turn`, `state.weeklyLedger.week` | Estado Canônico | **SIM** (Resolução imediata vs semanal) |

---

## 3. Detalhamento e Fontes Reais de Cada Fator

### Fator 1: Settlement Structural Tier
- **Source**: `src/types.ts` (`Holdings.type`, `Holdings.tier`) e `src/lib/magnitudeConfig.ts` (`structuralTypeTier`).
- **Exact Field**: `state.holdings.type` ('Bastion' \| 'Fortified Town' \| 'Castle' \| 'Walled City').
- **Semantic Meaning**: Tamanho estrutural e complexidade logística do assentamento governado.
- **Current Value Range**: 1 a 4 (com 5 reservado conceitualmente para Capital imperial).
- **Safe to Use?**: **SIM**.
- **Justification**: Dados consolidados em todos os testes e schemas da campanha.

### Fator 2: Available Labor Pool (Mão de Obra)
- **Source**: `src/types.ts` (`Holdings.laborPool`) e `src/domain/kingdom/services/LaborService.ts`.
- **Exact Field**: `state.holdings.laborPool` / `LaborService.calculateAvailableLabor(...)`.
- **Semantic Meaning**: Força de trabalho civil ativa não alocada em minas ou lavouras (40% da população base menos alocações).
- **Current Value Range**: 0 a 10.000+ trabalhadores.
- **Safe to Use?**: **SIM**.
- **Justification**: Modelo contábil canônico fechado com validação estrita de disponibilidade.

### Fator 3: Liquid Treasury (Silverdew)
- **Source**: `src/types.ts` (`WeeklyLedger.silverdew`) e `src/domain/kingdom/services/TreasuryService.ts`.
- **Exact Field**: `state.weeklyLedger.silverdew`.
- **Semantic Meaning**: Moeda líquida de prata disponível na tesouraria do senhor feudal.
- **Current Value Range**: $\ge 0$ SD (sujeito a default caso atinja 0 com despesas ativas).
- **Safe to Use?**: **SIM**.
- **Justification**: Restaurado com integridade contábil no Milestone 1.

### Fator 4: Season & Weather Friction
- **Source**: `src/types.ts` (`WeeklyLedger.season`, `WeeklyLedger.weather`).
- **Exact Field**: `state.weeklyLedger.season` ('Thawtide' \| 'Sunreach' \| 'Reapingfall' \| 'Deepfrost').
- **Semantic Meaning**: Estação do ano e intempéries climáticas. No Codex, 'Deepfrost' impõe penalidades severas a operações externas.
- **Current Value Range**: Union de 4 estações canônicas.
- **Safe to Use?**: **SIM**.
- **Justification**: Propriedades existentes no ledger semanal determinístico.

### Fator 5: Diplomatic Opinion & Target Resistance
- **Source**: `src/domain/relationship/Relationship.ts` e `src/types.ts` (`NobleHouse.opinion`).
- **Exact Field**: `Relationship.opinion` / `state.relationships.houses[].opinion`.
- **Semantic Meaning**: Índice de afinidade entre o governante e o alvo (-3 = Inimigo Mortal, 0 = Neutro, +3 = Aliado Leal).
- **Current Value Range**: Inteiro estritamente contido no intervalo $[-3, +3]$.
- **Safe to Use?**: **SIM**.
- **Justification**: Totalmente modelado com métodos autoritativos de clamp (`adjustOpinion`).

### Fator 6: Commander Tier & Reputation
- **Source**: `src/types.ts` (`Character.stats.commanderTier`, `Character.reputation`).
- **Exact Field**: `state.character.stats.commanderTier` (1 a 5) e `state.character.reputation` (0 a 100+).
- **Semantic Meaning**: Grau de autoridade militar e prestígio político do governante perante a região.
- **Current Value Range**: CommanderTier: 1 a 5; Reputation: $\ge 0$.
- **Safe to Use?**: **SIM**.
- **Justification**: Dados fundamentais da ficha de personagem autorizada.

---

## 4. Auditoria dos Hardcodes Atuais em `genericResolution.ts`

| Arquivo e Linha | Expressão / Valor | Origem do Valor | Classificação | Impacto |
|---|---|---|---|---|
| `genericResolution.ts:139` | `params.men ?? 15` | Default de contingência quando jogador não especifica | `HEURISTIC` | Aloca 15 homens por padrão na falta de valor |
| `genericResolution.ts:166` | `Math.round(assignedMen * 0.1)` | Custo heurístico de ferramentas (0.1 SD/homem) | `HEURISTIC` | Consome prata sem tabela explícita do Codex |
| `genericResolution.ts:171` | `roll >= 5 && hasFunds` | Limiar DC 5 de rolagem 1d20 para sucesso em estrada | `HEURISTIC` | Dificuldade fixa arbitrária |
| `genericResolution.ts:173` | `roll >= 15 ? 'SUCCESS' : 'PARTIAL'` | Limiar DC 15 de rolagem 1d20 para sucesso pleno | `HEURISTIC` | Dificuldade fixa arbitrária |
| `genericResolution.ts:215` | `params.amount ?? 20` | Default de 20 SD para suborno não quantificado | `HEURISTIC` | Deduz 20 SD sem avaliar status da corte |
| `genericResolution.ts:229` | `roll >= 10` | Limiar DC 10 de rolagem 1d20 para aceitação de suborno | `HEURISTIC` | Ignora a `Relationship.opinion` do alvo |
| `genericResolution.ts:264` | `roll >= 12` | Limiar DC 12 de rolagem 1d20 para ação genérica geral | `HEURISTIC` | Resolução crua sem contexto do assentamento |

---

## 5. Auditoria de Interação entre MRS e Generic Resolution

- **MRS v0.1 (`magnitudeResolution.ts`)**:
  - Implementa resolução contextual completa baseada em $5$ dimensões de estado (Estrutural, População, Labor, Militar e Tesouraria).
  - Classificação dos números do MRS:
    - Custo `sdPerSoldier = 3`: **`CANONICAL`** (Codex §69.3).
    - Custo `laborPerSoldier = 1`: **`CANONICAL`** (Codex §41.6).
    - Coeficiente demográfico `0.012`: **`CALIBRATION`** (Calibrado empiricamente contra §40.14 e §45.1).
    - Envelopes $[\text{min}, \text{max}]$ por tier: **`CALIBRATION`** (Validado por simulação de 2.000 runs).
    - Cap semanal por unidade $= 10$: **`CANONICAL`** (Codex §41.6).
- **Generic Resolution v0.1 (`genericResolution.ts`)**:
  - Camada de contingência para intenções plausíveis sem regra explícita no Codex.
  - Atualmente opera com limiares fixos de DC em vez de consumir o envelope contextual do feudo.

---

## 6. Propostas Matemáticas para o Envelope Contextual (v0.2)

### Alternativa A: Modelo de Capacidade Harmônica Mínima (Recomendada)

O envelope de magnitude máxima viável $[\text{Env}_{\min}, \text{Env}_{\max}]$ para uma ação plausível de esforço/trabalho é derivado dos gargalos físicos reais do feudo:

$$\text{Capacity}_{\text{physical}} = \min \left( \text{LaborAvailable}, \left\lfloor \frac{\text{Treasury}_{\text{SD}}}{\text{UnitCost}_{\text{est}}} \right\rfloor, \text{SettlementTierCap} \right)$$

Onde:
- $\text{SettlementTierCap} = \text{TierBase} \times 25$ (Tier 1 = 25, Tier 2 = 50, Tier 3 = 100, Tier 4 = 200).
- $\text{Env}_{\min} = \max(1, \lfloor 0.5 \times \text{Capacity}_{\text{physical}} \rfloor)$
- $\text{Env}_{\max} = \text{Capacity}_{\text{physical}}$

### Alternativa B: Modelo de Modulador Contextual Contínuo

Deriva a magnitude a partir de um índice de tração do feudo ($I_{\text{feudo}} \in [0.1, 1.0]$):

$$I_{\text{feudo}} = 0.40 \cdot \left(\frac{\text{Tier}}{4}\right) + 0.30 \cdot \min\left(1, \frac{\text{Labor}}{1000}\right) + 0.20 \cdot \min\left(1, \frac{\text{Treasury}}{2500}\right) + 0.10 \cdot \left(\frac{\text{CommanderTier}}{5}\right)$$

$$\text{MagnitudeBase} = \text{EscalaSolicitada} \times I_{\text{feudo}}$$
$$\text{Envelope} = [0.75 \times \text{MagnitudeBase}, 1.25 \times \text{MagnitudeBase}]$$

---

## 7. Proposta Matemática para Resolução de Sucesso sem DCs Fixos

Em vez de comparar $1\text{d}20 \ge \text{DC Fixa}$, o limiar de sucesso $T_{\text{sucesso}}$ é derivado do atrito contextual:

$$T_{\text{sucesso}} = \text{BaseAtrito} - \text{BônusLiderança} - \text{AfinidadeAlvo} + \text{PenalidadeClima}$$

Onde:
- $\text{BaseAtrito} = 10$ (Incerteza neutra em 1d20).
- $\text{BônusLiderança} = \text{commanderTier} \in [1, 5]$.
- $\text{AfinidadeAlvo} = \text{Relationship.opinion} \in [-3, +3]$.
- $\text{PenalidadeClima} = 3 \text{ se } \text{season} == \text{'Deepfrost' } (\text{inverno rigoroso}), 0 \text{ caso contrário}$.
- **Resultado do Dado ($R \sim 1\text{d}20$)**:
  - $R \ge T_{\text{sucesso}} + 5 \implies \textbf{SUCCESS}$ (Sucesso Pleno com rendimento ótimo).
  - $T_{\text{sucesso}} \le R < T_{\text{sucesso}} + 5 \implies \textbf{PARTIAL\_SUCCESS}$ (Sucesso com atrito ou custo parcial).
  - $R < T_{\text{sucesso}} \implies \textbf{FAILURE}$ (Falha sem mutações indevidas de estado).

---

## 8. Estratégia de Impossibilidade Estrutural

Uma ação é estritamente `IMPOSSIBLE` quando:
1. **Violação Física / Cenário**: Padrões de ressuscitação, voo sem asas, teletransporte, aniquilação instantânea do mundo ou geração mágica de ouro do nada.
2. **Inviabilidade Material Absoluta**: Ação que exige recursos materiais onde o feudo possui $0$ de saldo ou alocação impossível (ex: demandar $500$ pedreiros com $0$ trabalhadores civis).

---

## 9. Estratégia de RNG

Todo sorteio na camada de resolução genérica deve consumir obrigatoriamente a interface injetada `RandomService`:
- Assinatura: `resolveGenericPlausibleAction(request, state, rng: RandomService): GenericResolutionResult`
- Proibição absoluta de `Math.random()`.
- Garantia de que a mesma tupla `(Request, State, Seed)` produzirá rigorosamente o mesmo `ExecutionReport`.

---

## 10. Estratégia Determinística de Command ID

Eliminação de `Date.now()` nos adaptadores de LLM:
- **Problema**: `cmd_gemini_${Date.now()}` e `cmd_fallback_${Date.now()}` introduzem strings não-determinísticas nos payloads de comando.
- **Solução Determinística**:
  $$\text{commandId} = \text{cmd\_seq\_} + \text{turn} + \text{\_} + \text{actorId} + \text{\_} + \text{actionIndex}$$
  Ou via contador sequencial atômico associado ao ciclo narrativo da campanha.

---

## 11. Estratégia de Simulação para Validação de Envelope

A futura suíte `tests/GenericResolutionSimulation.test.ts` deverá executar simulações de Monte Carlo (10.000 iterações):
1. **Mesmo Contexto + Mesma Seed**: Comprovação de $100\%$ de reproducibilidade (desvio padrão $= 0$).
2. **Variação Contextual Controlada**:
   - Comparação da distribuição de magnitudes e taxas de sucesso entre Aldeia (Tier 1), Castelo (Tier 3) e Cidade Murada (Tier 4).
   - Comprovação de que o inverno ('Deepfrost') reduz a taxa de sucesso proporcionalmente ao atrito esperado sem travar o motor.
3. **Métricas Computadas**:
   - Média, Mediana, P5, P95, Mínimo, Máximo.
   - Taxa de Falha, Taxa de Sucesso Parcial e Taxa de Sucesso Pleno.

---

## 12. Riscos e O que NÃO Deve Ser Implementado

- **Risco de "Segundo Codex"**: Criar centenas de handlers específicos para ações individuais.
  - *Mitigação*: Agrupar ações genéricas em $3$ arquétipos amplos baseados em atrito físico:
    1. *Esforço de Mão de Obra / Infraestrutura* (consome labor/materiais).
    2. *Negociação / Interação Social* (consome prata/afinidade).
    3. *Reconhecimento / Manobra de Campo* (consome tempo/atrito geográfico).
- **O que NÃO deve ser implementado**:
  - Não criar novas tabelas mágicas de DC por tipo de árvore, tipo de rocha ou profissão obscura.
  - Não permitir que a LLM defina os valores do envelope ou rolagem de dados.
  - Não alterar `CampaignState` antes do `ExecutionReport` ser emitido e validado.

---

## 13. Recomendação Final do Tech Lead

### Classificação do Gate 1:

**READY FOR IMPLEMENTATION**

O codebase possui dados de domínio ricos, consolidados e acessíveis em `CampaignState` (`holdings`, `weeklyLedger`, `relationships`, `character`, `visibility`), permitindo derivar envelopes e dificuldades contextuais de forma 100% determinística e matematicamente justificada, sem a necessidade de criar tabelas arbitrárias ou "segundos codexes".
