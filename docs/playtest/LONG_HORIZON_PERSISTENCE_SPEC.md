# Especificação de Playtest: Long-Horizon Persistence & Memory Integrity (52 Semanas)

> **Milestone M18.4 — Fase 2: Continuidade Temporal e Persistência Epistêmica**  
> Objetivo: Garantir que a memória, fatos, entidades, relacionamentos, histórico e consequências da campanha residam estritamente no **`CampaignState` determinístico e no `worldLedger`**, sobrevivendo a "apagões" de contexto e rotação de processos da LLM.

---

## 🏛️ Os 4 Pilares de Persistência

```text
                        CAMPAIGN PERSISTENCE
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
   A. MECÂNICA              B. FACTUAL             C. ENTIDADES / HISTÓRICO
(Treasury, Labor,        (Fatos Revelados,        (Relações, Facções,
 Garrison, Food)         Rotas, Segredos)          Decisões Anteriores)
```

1. **A. Persistência Mecânica:** Tesouro, estoques de madeira/pedra/ferro, celeiro (FSU), guarnição e população nunca sofrem "reset" ou deriva implícita; todas as mutações semanais são cumulativas.
2. **B. Persistência Factual:** Uma vez que um fato ou segredo foi formalmente registrado no `worldLedger` (ex: `discoveredInformation: ['bridge_garrison', 'supply_route:north_road', 'allegiance:Ironhand']`), a IA não pode esquecê-lo nem tratá-lo como hipótese ou novidade.
3. **C. Persistência de Entidades e Relacionamentos:** Status político, hostilidade ou pactos com NPCs (ex: Barão Valerius, Casa Ironhand) persistem e moldam as respostas diplomáticas mesmo após dezenas de semanas de silêncio.
4. **D. Continuidade Narrativa e Epistêmica:** O sistema distingue categoricamente **fatos confirmados**, **hipóteses do soberano** e **contradições deliberadas**, sem aceitar que suposições substituam a verdade mecânica sem novas evidências da Engine.

---

## 📅 Cronograma Estruturado das 52 Semanas

| Bloco de Turnos | Fase Operacional | Foco de Playtest | Checkpoint Obrigatório |
|---|---|---|---|
| **T01 – T05** | Estabelecimento | Inspeção, compra de madeira, reparos e recrutamento. | **CP-01 (Semana 5):** Saldo de recursos e histórico base. |
| **T06 – T10** | Exploração & Descoberta | Espionagem na Velha Ponte, descoberta da força de Barão Valerius e rotas de suprimento de Ironhand. | **CP-02 (Semana 10):** Registro de fatos no `worldLedger`. |
| **T11 – T20** | **Silêncio de 10 Semanas** | Ações de gestão interna (BUILD, TRADE, CRAFT, SOCIAL) sem citar Valerius ou a ponte. | **CP-03 (Semana 20):** **Context Blackout (Reboot do processo).** |
| **T21** | **Recuperação sob Apagão** | Pergunta indireta: *"Roric, o que sabemos sobre a força na ponte?"* | **CP-04 (Semana 21):** Validação de memória sem histórico textual. |
| **T22 – T30** | Diplomacia & Conflito | Tentativa de contato diplomático formal (rejeição / trégua). | **CP-05 (Semana 30):** Persistência de histórico de decisões passadas. |
| **T31** | **Referência Indireta** | Pergunta sem nomes: *"Aquela força da estrada norte ainda ameaça o feudo?"* | **CP-06 (Semana 31):** Resolução de referências contextuais. |
| **T32 – T40** | Estresse de Contradição | O jogador propõe: *"Talvez Blackwood esteja por trás da ponte."* | **CP-07 (Semana 40):** Teste epistêmico: Fato (Ironhand) vs Hipótese (Blackwood). |
| **T41 – T50** | Consequências de Longo Prazo | Desdobramento das obras, colheita de verão/outono e impacto militar. | **CP-08 (Semana 50):** Economia multi-estação e estado das fortificações. |
| **T51 – T52** | Auditoria Final | Fechamento do ano 342, balanço geral de 52 semanas e transição para o Ano 343. | **CP-09 (Semana 52):** **Emissão do AUDIT-DELTA-002.** |

---

## 🧪 Critérios Formais de Avaliação por Checkpoint

A cada checkpoint (a cada 5–10 semanas), a auditoria gera o relatório estruturado:

```text
PERSISTENCE CHECK:
- Mechanical state: PASS/FAIL (silverdew, food, timber, labor, garrison)
- Historical facts: PASS/FAIL (fatos revelados vs não-revelados)
- Entities & NPCs: PASS/FAIL (Barão Valerius, Casa Ironhand, Velha Ponte)
- Relationships: PASS/FAIL (grafo de lealdade/hostilidade)
- Secrets / Fog of War: PASS/FAIL (memória negativa: o que não foi descoberto permanece oculto)
- Previous decisions: PASS/FAIL (rejeições diplomáticas e ordens anteriores)
- Long-term consequences: PASS/FAIL (impactos multi-estação e pós-apagão)
- Narrative grounding: PASS/FAIL (0 alucinações de dados fora do report/ledger)
```

---

## 📌 Nota Metodológica de Cobertura

> **Escopo da Matriz de Paridade (25/25):**  
> A matriz de paridade aprovada em `tests/OnlineOfflineParity.test.ts` valida a **paridade estrita entre `MockNarrativeLLM` e o modo offline de `GeminiNarrativeLLM` (Single Source of Truth de fallback)**. A paridade entre o modelo **Gemini Live (Online)** e o **Fallback Offline** é um comportamento estocástico atenuado por `temperature: 0` que será acompanhado empiricamente durante o playtest em tempo de execução.
