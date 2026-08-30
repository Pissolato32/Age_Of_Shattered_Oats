# Matriz de Cobertura de Domínios e Resolução Semântica por Papéis (M18.4)

Este documento mapeia a relação canônica entre **Agente**, **Verbo de Ação**, **Objeto/Recurso** e o **Domínio Mecânico Resultante**.

---

## 🏛️ 1. Hierarquia Canônica de Decisão (Semantic Arbiter)

```text
1. Silêncio Político Deliberado (PART 122.9) → DIPLOMACY (CAUTIOUS)
2. Violação Impossível / Clarificação Vazia → UNKNOWN (Segurança)
3. Negação Rígida + Observação → ESPIONAGE (CAUTIOUS)
4. Consultas Puras / Custo / Regras → INFORMATION
5. Ação Verbal Explícita (Prevalece sobre Recursos e Agentes):
   - Ação Comercial (comprar, adquirir, vender, negociar preço) → TRADE
   - Ação Construtiva (reparar, reforçar, edificar, consertar) → BUILD
   - Ação de Espionagem (espiar, vigiar, rastrear, no encalço) → ESPIONAGE
   - Ação Diplomática (trégua, tratado, emissário, comitiva, paz) → DIPLOMACY
   - Ação Militar (guarnecer, piquet, bloquear, cercar, atacar) → MILITARY
   - Ação de Recrutamento (recrutar, alistar) → RECRUIT
   - Ação de Viagem (viajar, marchar para destino) → TRAVEL
6. Conflitos Contextuais e Cláusulas Compostas
7. Agent Affordance Desempate (Apenas quando não houver verbo de ação explícito)
8. Fallback Seguro → UNKNOWN
```

---

## 🔬 2. Matriz de Variação de Verbos sobre o Mesmo Objeto

Demonstração prática de que o substantivo **não** determina o domínio de forma isolada:

| Objeto / Recurso | Frase de Entrada | Verbo Governante | Domínio Resultante | Justificativa Canônica |
| :--- | :--- | :--- | :---: | :--- |
| **Madeira** | `"Compre madeira seca no entreposto"` | `Comprar` | `TRADE` | Verbo de comércio transitivo |
| **Madeira** | `"Venda madeira dos nossos depósitos"` | `Vender` | `TRADE` | Verbo de comércio transitivo |
| **Madeira** | `"Use madeira para fortificar o pátio"` | `Fortificar` | `BUILD` | Obra e engenharia estrutural |
| **Madeira** | `"Inspecione a madeira estocada"` | `Inspecionar` | `INFORMATION` | Consulta / diagnóstico sem mutação |
| **Madeira** | `"Quanto custa a madeira na região?"` | `Quanto custa` | `INFORMATION` | Interrogação pura de custo |
| **Cavalos** | `"Compre 10 cavalos para os mensageiros"` | `Comprar` | `TRADE` | Aquisição comercial de montarias |
| **Cavalos** | `"Roric, use os cavalos para patrulhar a fronteira"` | `Patrulhar / Vigiar` | `ESPIONAGE` | Reconhecimento de batedor |
| **Cavalos** | `"Mobilize cavaleiros para atacar o acampamento"` | `Atacar / Mobilizar` | `MILITARY` | Desdobramento tático armado |
| **Cavalos** | `"Qual a condição dos cavalos nas estrebarias?"` | `Qual a condição` | `INFORMATION` | Inquérito informativo de estado |

---

## ⚔️ 3. Conflitos Deliberados (Agente vs Ação)

Demonstração de que a **Ação Explícita** prevalece sobre a **Affordance do Agente**:

| Entrada do Jogador | Agente | Prior Semântico | Ação Verbal Explícita | Domínio Efetivo |
| :--- | :---: | :---: | :--- | :---: |
| `"Roric, compre madeira para construir uma torre"` | Roric | `ESPIONAGE` | `Comprar` | `TRADE` |
| `"Aldren, use madeira para reparar a torre"` | Aldren | `BUILD` | `Reparar` | `BUILD` |
| `"Gerold, negocie com o Barão"` | Gerold | `TRADE` | `Negociar (político)` | `DIPLOMACY` |
| `"Roric, não ataque a ponte; apenas observe os movimentos"` | Roric | `ESPIONAGE` | `Observar (após negação)` | `ESPIONAGE` |
| `"Aldren, apenas inspecione as defesas sem iniciar obras"` | Aldren | `BUILD` | `Inspecionar (sem obras)` | `INFORMATION` |
