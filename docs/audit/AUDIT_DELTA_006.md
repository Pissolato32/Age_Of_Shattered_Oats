# AUDIT REPORT: DELTA M25.1 — MATERIAL MUTATION INVARIANT CROSS-CHECK & REMEDIATION SPEC

**Data**: 2026-08-30  
**Status da Auditoria**: `AUDIT_RECORD`  
**Classificação da Divergência**: `CONTRACT_VIOLATION`  
**Severidade**: Média / Alta (Integridade de Pipeline Defensivo)  
**Módulos Envolvidos**:
- `docs/playtest/CAUSAL_INVARIANTS.md` (Contrato Formal de Invariante)
- `src/lib/ruleResolver.ts` (`applyResolutionToState`)
- `src/lib/gameplayPipeline.ts` (`executePlayerTurn`)

---

## 1. Contexto e Divergência Confirmada

### Contrato Formal ([CAUSAL_INVARIANTS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/playtest/CAUSAL_INVARIANTS.md))
> **2. Invariante de Mutação Material:**
> $$\text{mutated} = \text{true} \iff \sum |\Delta \text{recursos}| > 0$$
> *Um estado só pode ser marcado como `mutated: true` se houver alteração material real em saldos, inventários, tropas, obras ou controle territorial.*

### Comportamento da Implementação ([src/lib/ruleResolver.ts:L764-809](file:///c:/Projetos/Age_Of_Shattered_Oats/src/lib/ruleResolver.ts#L764-L809))
```ts
export function applyResolutionToState(
  state: CampaignState, 
  resolution: RuleResolutionResult
): { updatedState: CampaignState; mutated: boolean } {
  if (resolution.decision !== 'ALLOWED' || !resolution.mechanicalAllowed || resolution.effects.length === 0) {
    return { updatedState: state, mutated: false };
  }
  // ... loop aplicando deltas ...
  return { updatedState: newState, mutated: true }; // ← Retorno incondicional
}
```

### Caminho de Quebra e Interação com o Pipeline
1. **Cenário de Efeito Nulo (`delta: 0`)**: Se uma resolução produzir `effects = [{ resource: 'weeklyLedger.silverdew', delta: 0 }]`, `effects.length > 0`, mas nenhuma alteração material ocorre. A função retorna incondicionalmente `mutated: true`.
2. **Cenário de Delta Não-Numérico**: Se todos os efeitos tiverem deltas inválidos (`typeof effect.delta !== 'number'`), o loop pula todos os efeitos, `newState` é idêntico a `state`, mas a função retorna `mutated: true`.
3. **Interação Crítica com [src/lib/gameplayPipeline.ts](file:///c:/Projetos/Age_Of_Shattered_Oats/src/lib/gameplayPipeline.ts)**:
   ```ts
   const integrityOk = mutated ? true : verifyStateIntegrity(currentState, updatedState);
   ```
   Quando `mutated` é marcado falsamente como `true`, o pipeline **bypassa a verificação defensiva de integridade (`verifyStateIntegrity`)** exatamente na condição em que o sistema supunha mutação mas nenhuma alteração ocorreu.

---

## 2. Follow-Up Técnico Dedicado

> [!IMPORTANT]
> **Isolamento de Escopo**: Nenhuma alteração de código ou teste foi realizada no PR de baseline documental. A correção será executada exclusivamente no PR dedicado:
> `fix: enforce material mutation invariant`

### Especificação dos 4 Cenários de Teste de Regressão Obrigatórios

1. **Cenário 1 (`delta: 0` explícito)**:
   - Entrada: Resolução com `decision: 'ALLOWED'`, `effects: [{ resource: 'weeklyLedger.silverdew', delta: 0 }]`.
   - Resultado Esperado: `mutated === false`, `updatedState` idêntico a `state`.
2. **Cenário 2 (Efeitos sem delta numérico válido)**:
   - Entrada: Resolução com `effects: [{ resource: 'weeklyLedger.silverdew', delta: NaN }]` ou propriedades não numéricas.
   - Resultado Esperado: `mutated === false`, `updatedState` preservado.
3. **Cenário 3 (Mutação Material Real $\sum |\Delta| > 0$)**:
   - Entrada: Resolução com deltas reais em tesouro, tropas ou mantimentos.
   - Resultado Esperado: `mutated === true`, `hashMechanicalState(state) !== hashMechanicalState(updatedState)`.
4. **Cenário 4 (Integridade do Pipeline Defensivo)**:
   - Validação end-to-end em `gameplayPipeline.ts` garantindo que ações neutras/consultivas ou com deltas nulos passam pela verificação defensiva de integridade sem falsos positivos.
