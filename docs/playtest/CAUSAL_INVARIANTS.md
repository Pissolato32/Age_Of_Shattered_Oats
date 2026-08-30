# Invariantes Causais do Sistema de Jogo

Este documento define os contratos matemáticos e semânticos que o motor de **Age of Shattered Oaths** deve satisfazer em cada turno de execução.

---

## 1. Invariante de Ação e Execução
$$\text{classifiedAction} \equiv \text{actionExecuted}$$
* A menos que uma regra canônica de esclarecimento (`requiresClarification: true`) ou impossibilidade física (`UNKNOWN`) seja acionada, o domínio mecânico executado deve coincidir estritamente com a intenção classificada.

## 2. Invariante de Mutação Material
$$\text{mutated} = \text{true} \iff \sum |\Delta \text{recursos}| > 0$$
* Um estado só pode ser marcado como `mutated: true` se houver alteração material real em saldos, inventários, tropas, obras ou controle territorial.

## 3. Invariante de Factual Grounding
$$\forall \text{ fato } F \in \text{Narrativa}, \quad F \in \text{NarrativeContext.knownFacts} \lor F \in \text{ExecutionReport.discoveredInformation}$$
* É terminantemente proibido à narrativa introduzir segredos, lealdades feudais secretas, nomes de conspiradores ou mortes que não constem do relatório determinístico do motor.

## 4. Invariante de Persistência Semanal
$$\text{FinalState} = \text{WeeklyTurn}(\text{ActionState})$$
$$\Delta \text{Silverdew}_{\text{Total}} = \Delta \text{Silverdew}_{\text{Ação}} + (\text{Renda} - \text{HoldingUpkeep} - \text{GarrisonCost} - \text{Taxas})$$
* O estado persistido em disco após cada turno deve conter a aplicação integral do balanço financeiro e da passagem de tempo do mundo.
