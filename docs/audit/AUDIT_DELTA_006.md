# AUDIT REPORT: DELTA M25.1 — MATERIAL MUTATION INVARIANT CROSS-CHECK & RESOLUTION

**Data**: 2026-08-30  
**Status da Auditoria**: `AUDIT_RECORD`  
**Classificação da Divergência**: `CONTRACT_VIOLATION` $\rightarrow$ **RESOLVED**  
**Severidade**: Média / Alta (Integridade de Pipeline Defensivo)  
**Módulos Envolvidos**:
- `docs/playtest/CAUSAL_INVARIANTS.md` (Contrato Formal de Invariante)
- `src/lib/ruleResolver.ts` (`applyResolutionToState`)
- `src/lib/gameplayPipeline.ts` (`executePlayerTurn` / `executeGameplayPipeline`)
- `tests/domain/MaterialMutationInvariant.test.ts` (Suíte Canônica de Regressão)

---

## 1. Contexto e Divergência Confirmada

### Contrato Formal ([CAUSAL_INVARIANTS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/playtest/CAUSAL_INVARIANTS.md))
> **2. Invariante de Mutação Material:**
> $$\text{mutated} = \text{true} \iff \sum |\Delta \text{recursos}| > 0$$
> *Um estado só pode ser marcado como `mutated: true` se houver alteração material real em saldos, inventários, tropas, obras ou controle territorial.*

### Causa Raiz Anterior ([src/lib/ruleResolver.ts:L764-809](file:///c:/Projetos/Age_Of_Shattered_Oats/src/lib/ruleResolver.ts#L764-L809))
A versão anterior de `applyResolutionToState` retornava incondicionalmente `mutated: true` caso `effects.length > 0`, gerando falso-positivo de mutação para `delta: 0` ou deltas não numéricos. Isso fazia com que o `gameplayPipeline.ts` ignorasse a verificação defensiva de integridade (`verifyStateIntegrity`).

---

## 2. Resolução Canônica Implementada

1. **Garantia da Invariante Causal**:
   Em `src/lib/ruleResolver.ts`:
   ```ts
   const mutated = hashMechanicalState(state) !== hashMechanicalState(newState);
   return { updatedState: mutated ? newState : state, mutated };
   ```
2. **Preservação Referencial em No-Ops**:
   Quando `mutated === false` (inclusive para deltas nulos ou efeitos vazios), a função retorna a mesma referência de memória do estado anterior (`updatedState: state`), eliminando clones desnecessários e mantendo a integridade estrita.
3. **Preservação de Determinismo e RNG**:
   Nenhuma chamada a `globalRNG` é consumida em operações com `quantity <= 0` ou `delta === 0`.

---

## 3. Validação por Testes de Regressão

A suíte canônica [`tests/domain/MaterialMutationInvariant.test.ts`](file:///c:/Projetos/Age_Of_Shattered_Oats/tests/domain/MaterialMutationInvariant.test.ts) foi implementada e aprovou 100% dos cenários:
- **Cenário 1 (`effects: []`)**: `mutated === false`, `updatedState === state`.
- **Cenário 2 (`delta: 0`)**: `mutated === false`, `updatedState === state`, `hashMechanicalState` idêntico.
- **Cenário 3 (Delta não numérico)**: `mutated === false`, `updatedState === state`.
- **Cenário 4 (Mutação Material Real $\sum |\Delta| > 0$)**: `mutated === true`, `updatedState !== state`, hash mecânico alterado.
- **Cenário 5 (Múltiplos Recursos)**: `silverdew`, `food`, `laborPool`, `materials` validados.
- **Cenário 6 (Integração com GameplayPipeline)**: `integrityVerified === true` validado tanto para ações no-op quanto para mutações ativas.
