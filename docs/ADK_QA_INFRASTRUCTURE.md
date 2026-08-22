# 🛡️ Diretrizes da Infraestrutura de QA e Observabilidade (Google ADK)

> **Documento de Governança e Isolamento de Runtime**  
> **Status:** Experimental / Ferramenta de Laboratório e QA  
> **Última Revisão:** 2026-08-22

---

## 🏛️ 1. Axiomas Fundamentais de Arquitetura

```text
ADK = QA / Evaluation / Tracing
ADK ≠ Runtime do Jogo
ADK ≠ Gameplay Agent
ADK ≠ Autoridade sobre a Engine
```

1. **Separação Estrita de Runtime:**
   * Nenhum módulo ou ferramenta do ADK (`AdkTraceCollector`, `LiveEvalRunner`) pode ser importado ou invocado por:
     * `src/engine.ts`
     * `src/lib/narrativeExecution.ts`
     * `src/lib/narrativeCycle.ts`
     * `src/lib/geminiNarrativeLLM.ts`
     * Qualquer rota de API ou fluxo de gameplay da campanha.
2. **Independência Total do CI (`npm test`):**
   * A suíte padrão de testes (`npm test`, `npm run build`, `npm start`) executa **100% offline**, com **custo zero de tokens**, utilizando apenas mocks determinísticos.
3. **Avaliação Live Sob Demanda (`npm run eval:live`):**
   * O comando `npm run eval:live` é estritamente opt-in, executando baterias de avaliação de fidelidade semântica e gerando a tríade de artefatos em `artifacts/eval/` (`traces/`, `results/`, `reports/`).
4. **Minimização de Custos por Jogador:**
   * O sistema em produção preserva o objetivo de custo mínimo operacional por sessão de jogo, mantendo a Engine determinística como única autoridade mecânica.
