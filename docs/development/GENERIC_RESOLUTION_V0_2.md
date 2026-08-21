# GENERIC RESOLUTION SYSTEM v0.2 SPECIFICATION & AUDIT (GATE 2)

**Versão**: 0.2.1
**Data**: 2026-08-21
**Status**: ACTIVE IMPLEMENTATION (POST-AUDIT)
**Princípio**: `ENGINE > CONTRACTS > NARRATIVE LAYER > LLM`

---

## 1. Visão Geral e Filosofia

O **Generic Resolution System v0.2** resolve ações categorizadas como `PLAUSIBLE_UNMODELED` de forma determinística, contextual e estritamente limitada pelo estado real do mundo (`CampaignState`).

Ele opera sob as seguintes garantias mecânicas inegociáveis:
1. **Capacidade Unificada**: Nenhuma ação de infraestrutura ou campo excede o menor dos limites entre:
   - Mão de obra disponível no feudo (`state.holdings.laborPool`);
   - Capacidade estrutural/mobilização civil máxima sem colapsar a economia ($\max(25, \min(400, \text{population} \times 0.05))$);
   - Apoio operacional financeiro da tesouraria ($\text{treasurySd} \times 10$).
2. **Envelope e Variância Determinística**: Comandos sem quantia explícita são sorteados dentro do envelope $[E_{\min}, E_{\max}]$ usando a seed injetada via `RandomService`.
3. **Atrito Contextual ($T$)**: Substitui completamente as antigas DCs fixas por cálculo dinâmico baseado em:
   - Clima/Estação (*Deepfrost* adiciona $+3$ de atrito);
   - Liderança militar (`commanderTier` subtrai até $-5$ de atrito);
   - Reputação do personagem (`reputation` subtrai atrito);
   - Afinidade do alvo (`nobleHouses.opinion` ou `tribalRelations.opinion` no intervalo $[-3, +3]$).
4. **Command ID Replay-Safe**: `commandId` é derivado de forma pura através do hash determinístico da entrada do jogador, eliminando qualquer estado global, memória de instância ou relógio de sistema (`Date.now()`).

---

## 2. Eliminação Integral de Heurísticas

| Parâmetro Anterior | Substituição Contextual v0.2 | Justificativa Arquitetural |
|---|---|---|
| `0.1 SD/homem` | Custo de atrito operacional $\lfloor \text{AssignedMen} / 10 \rfloor$ SD limitado pelo saldo do `weeklyLedger.silverdew`. | Custo real de ferramental/ração deduzido da tesouraria apenas em caso de início efetivo dos trabalhos. |
| `DC 5` / `DC 10` / `DC 12` | $T = \text{clamp}(2, 18, 10 + \Delta_{\text{clima}} - \text{Liderança} - \text{Reputação} - \text{Afinidade})$ | Dificuldade puramente contextual. |
| `TierCap` fixo isolado | $\text{deriveStructuralWorkCap}(state) = \max(25, \lfloor \text{population} \times 0.05 \rfloor)$ | Mobilização civil proporcional à população real do holding (Codex de Mão de Obra). |
| `20 SD` suborno fixo | Envelope $[\max(1, \min(10, \text{SD})), \min(\text{SD}, 50)]$ sorteado pelo RNG. | Oferta flexível dentro do limite de tesouraria do jogador. |
| `Date.now()` no adapter | `createDeterministicCommandId(actor, action, input)` via hash | 100% determinístico e idempotente em replay. |

---

## 3. Modelo Matemático Formal

### 3.1 Capacidade Físico-Financeira Unificada
$$\text{Capacity}_{\text{unified}} = \min\left(\text{LaborAvailable}, \text{StructuralWorkCap}, \max(10, \text{TreasurySD} \times 10)\right)$$

### 3.2 Envelope de Trabalho e Magnitude
$$E_{\min} = \max\left(1, \lfloor 0.5 \times \text{Capacity}_{\text{unified}} \rfloor\right), \quad E_{\max} = \text{Capacity}_{\text{unified}}$$

$$\text{Magnitude} = \begin{cases}
\min(\text{requestedMen}, E_{\max}) & \text{se solicitado explicitamente} \\
\text{rng.nextInt}(E_{\min}, E_{\max}) & \text{se não especificado (ENGINE\_DETERMINED)}
\end{cases}$$

### 3.3 Limiar de Atrito Contextual ($T$)
$$T = \text{clamp}(2, 18, 10 + \Delta_{\text{estação}} - \text{commanderTier} - \lfloor \text{reputation} / 10 \rfloor - \text{opinion}_{\text{alvo}})$$

### 3.4 Resolução $1\text{d}20$
Com $R = \text{rng.nextInt}(1, 20)$:
- $R \ge T + 5 \implies \textbf{SUCCESS}$ (Conclusão plena, dedução de labor e ferramentas).
- $T \le R < T + 5 \implies \textbf{PARTIAL\_SUCCESS}$ (Conclusão parcial sob atrito, dedução proporcional).
- $R < T \implies \textbf{FAILURE}$ (Trabalho frustrado por atrito, **zero dedução de tesouraria em subornos/trabalhos abortados**).

---

## 4. Resultados da Simulação Estatística (10 Cenários / 10.000+ Runs)

Suíte: `tests/GenericResolutionSimulation.test.ts`

| # | Cenário Auditado | Runs | Sucesso | Parcial | Falha | Mag Min | Mag Med | Mag Max |
|---|---|---|---|---|---|---|---|---|
| 1 | Capacidade Baixa (Labor 20, Bastion) | 1000 | 45.3% | 24.5% | 30.2% | 10 | 15 | 20 |
| 2 | Capacidade Média (Labor 100, Town) | 1000 | 45.3% | 24.5% | 30.2% | 50 | 75 | 100 |
| 3 | Capacidade Alta (Labor 400, City) | 1000 | 45.3% | 24.5% | 30.2% | 200 | 300 | 400 |
| 4 | Verão (*Sunreach*) | 1000 | 45.3% | 24.5% | 30.2% | 125 | 188 | 250 |
| 5 | Inverno (*Deepfrost*) | 1000 | 30.2% | 24.6% | 45.2% | 125 | 188 | 250 |
| 6 | Relação Hostil (-3) | 1000 | 34.6% | 25.7% | 39.7% | 10 | 30 | 50 |
| 7 | Relação Neutra (0) | 1000 | 50.1% | 25.1% | 24.8% | 10 | 30 | 50 |
| 8 | Relação Aliada (+3) | 1000 | 65.4% | 24.8% | 9.8% | 10 | 30 | 50 |
| 9 | Liderança Baixa (Tier 1) | 1000 | 35.3% | 24.9% | 39.8% | 125 | 188 | 250 |
| 10 | Liderança Alta (Tier 5) | 1000 | 54.8% | 25.1% | 20.1% | 125 | 188 | 250 |

---

## 5. Invariantes de Monotonicidade e Replay Comprovadas

1. **Monotonicidade de Liderança**: $\text{Prob}(T=5) \ge \text{Prob}(T=1)$ (Comprovada: $54.8\% > 35.3\%$).
2. **Monotonicidade de Clima**: $\text{Prob}(\text{Verão}) \ge \text{Prob}(\text{Inverno})$ (Comprovada: $45.3\% > 30.2\%$).
3. **Monotonicidade de Afinidade**: $\text{Prob}(+3) > \text{Prob}(0) > \text{Prob}(-3)$ (Comprovada: $65.4\% > 50.1\% > 34.6\%$).
4. **Replay Snapshot Determinist**: 10/10 snapshots idênticos validados pelo `ReplayValidator`.
