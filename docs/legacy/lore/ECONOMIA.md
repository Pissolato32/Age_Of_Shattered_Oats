# 💰 ECONOMIA — G.2 WEEKLY LEDGER

## Estado Atual (Autoritativo)

- **SD:** 8073 SD | **Comida (FSU):** 12 FSU
- **Materiais:** [Timber: 0, Iron: 0, Stone: 0]
- **Materiais Básicos:** Timber: 10 | Iron: 40 | Stone: 45 | Grain: 30 | Leather: 15 | Salt: 8 | Tar: 5 | Rope: 8
- **Manufaturados & Suprimentos:** Nails: 25 | Charcoal: 25 | Lenha: 60 | Peles: 12 | Ferramentas: 75 | Herbs: 5 | Medicine: 2
- **Última atualização:** Highsun 7, Ano 345

> **Aviso:** O saldo de 7.450 SD reflete o estado após as transações registradas no histórico abaixo. A reconciliação analítica (seção seguinte) projeta ~16.154 SD para Ashfall 9 — o gap de ~8.704 SD é explicado pelas transações pós-Ashfall 9 listadas no histórico + despesas de manutenção não capturadas entre Greening 23 e Highsun 7 (~6 semanas de operação). Recomenda-se usar `npm run eco:transact` para todo gasto/ganho futuro.

---

## 📊 RECONCILIAÇÃO ANALÍTICA — Longdark 30 → Ashfall 9 (~26 semanas)

### RECONCILIAÇÃO SD — Longdark 30 a Ashfall 9 (26 semanas)

**SALDO INICIAL (Longdark 30, inverno):** 10.073 SD / 12 FSU

**RECEITA (26 semanas — primavera/verão/outono)**

| Fonte | SD |
|-------|:---:|
| Holding base (Tier 4): 375 SD/sem × 26 | 9.750 |
| Pedágio Torre Leste: 30 SD/sem × 26 | 780 |
| Comércio local: 12 SD/sem × 26 | 312 |
| Resource Patches: 10 SD/sem × 26 | 260 |
| Taxas: 12 SD/sem × 26 | 312 |
| Caça e pesca (excedente): 8 SD/sem × 26 | 208 |
| Fenrir vault (barras de prata) | 840 |
| **TOTAL RECEITA** | **12.462** |

**DESPESAS BASE (26 semanas)**

| Item | SD |
|------|:---:|
| Salários guarnição: 34 SD/sem × 26 | 884 |
| Guarnição Fortaleza Fenrir: 4 SD/sem × 26 | 104 |
| Manutenção Valenfort: 18 SD/sem × 26 | 468 |
| Conselheiros + especialistas: 8 SD/sem × 26 | 208 |
| Orin (Mestre de Obras): 4 SD/sem × 26 | 104 |
| Hospital (Alard + suprimentos): 4 SD/sem × 26 | 104 |
| Rede Roric (média): 15 SD/sem × 26 | 390 |
| Compras comida regulares: 10 SD/sem × 26 | 260 |
| **TOTAL DESPESAS BASE** | **-2.392** |

**OBRAS E EVENTOS ÚNICOS**

| Evento | SD |
|--------|:---:|
| Obras defesa (ballistas 80 + muralha 90 + portão 40 + hospital 120) | -330 |
| Pedreira (Harvestfall 26) | -80 |
| Pecuária (30 ovelhas + 10 cabras) | -240 |
| **TOTAL EVENTOS** | **-650** |

**SALDO PARCIAL**
- Líquido: 12.462 - 2.392 - 650 = +9.420 SD
- Ajuste (gap inverno→primavera): -339 SD
- Compras inverno (Ashfall 25-30): -3.000 SD
- **SALDO PROJETADO (Ashfall 9):** 10.073 + 9.420 - 339 - 3.000 = **16.154 SD**

### RECONCILIAÇÃO FSU

| Item | FSU |
|------|:---:|
| Início (Longdark 30) | 12 |
| Produção (caça/pesca/salga ~8 FSU/sem × 26) | +208 |
| Consumo base (~7 FSU/sem × 26) | -182 |
| Consumo excedente (eventos) | -10 |
| Caçada cabras (DF12) | +6 |
| Confisco Heward | +6 |
| Compras (Barrow, Bronzeford, Gray) | +22 |
| Colheita de outono (Harvestfall) | +15 |
| **TOTAL PROJETADO (Ashfall 9)** | **29 FSU** |

---

## 🔗 PONTE: Ashfall 9 → Saldo Atual

O saldo projetado de **16.154 SD / 29 FSU** (Ashfall 9) foi alterado pelas transações abaixo para o saldo atual de **10.073 SD / 12 FSU**:

| Data | Descrição | Δ SD | Δ FSU | Δ Mat. |
|------|-----------|:----:|:-----:|:------:|
| Longdark 15 | Absorção rede Orm + Mercado Fase 1 | -2.500 | — | — |
| Thawrise 1 | Prêmio Aldren | -100 | — | — |
| Thawrise 3 | Expansão Tier 5 Fase 2 | -3.000 | — | — |
| Thawrise 8 | Escola + Prefeitura | -1.000 | — | — |
| Greening 7 | Receita 4 semanas | +1.400 | +4 | — |
| Greening 16 | Receita 1 semana | +350 | +1 | — |
| Greening 16 | Novo Distrito (Vane/Orin) | -400 | — | T:-20, S:-20 |
| Greening 23 | Receita 1 semana (Lei do Asilo) | +350 | -4 | — |
| Greening 23 | Currais de Pecuária | -40 | — | T:-10 |
| Ashfall 30 | Suprimentos aliados Harvel | — | +10 | — |
| Ashfall 30 | Teste tsx | -50 | — | — |
| Highsun 7 | Consolidação contábil | -1.301 | -28 | — |
| **Subtotal conhecido** | | **-6.291** | **-17** | T:-30, S:-20 |
| **Saldo atual** | | **10.073** | **12** | Conforme topo (Estado Autoritativo) |

> **Nota:** Os valores foram consolidados em Highsun 7 para refletir o saldo autoritativo declarado no topo deste ledger. Transações futuras devem usar `npm run eco:transact -- --holding valenfort --resource [SD|FSU|timber|iron|stone] --amount [+/-X] --reason "[descrição]"`.

---

## Receita

| Fonte | SD/sem |
|-------|:------:|
| Holding base (Tier 4) | +375 |
| Pedágio Torre Leste | +19 |
| Comércio local | +12 |
| Resource Patches | +10 |
| Taxas | +12 |
| Caça/pesca (excedente) | +8 |
| **Total** | **~475** |

## Despesa

| Item | SD/sem |
|------|:------:|
| Salários guarnição | -34 |
| Guarnição Fortaleza Fenrir | -4 |
| Manutenção Valenfort | -18 |
| Conselheiros + especialistas | -8 |
| Orin (Mestre de Obras) | -4 |
| Hospital (Alard) | -4 |
| Rede Roric | -15 |
| Compras comida | -10 |
| **Total** | **-97** |

## Fluxo

- **Saldo semanal líquido:** ~+350 SD/sem (outono, sem eventos únicos)
- **Produção FSU:** ~8 FSU/sem, consumo ~7 FSU/sem → +1 FSU/sem líquido
- **Saldo SD atual:** 10.073 SD (ver reconciliação completa acima)

---

## 📋 PROTOCOLO SEMANAL — VIGENTE

### Valores semanais base (outono)

| Income | SD | Despesas | SD |
|--------|:--:|----------|:--:|
| Holding base (Tier 4) | +375 | Salários guarnição | -34 |
| Pedágio Torre Leste | +19 | Guarnição Fortaleza Fenrir | -4 |
| Comércio local | +12 | Manutenção Valenfort | -18 |
| Resource Patches | +10 | Conselheiros + especialistas | -8 |
| Taxas | +12 | Orin (Mestre de Obras) | -4 |
| Caça/pesca (excedente) | +8 | Hospital (Alard) | -4 |
| **Total income** | **~475** | Rede Roric | -15 |
| | | Compras comida | -10 |
| | | **Total despesas** | **-97** |

> **Saldo semanal líquido:** ~+378 SD/sem (outono, sem eventos únicos)
> **FSU:** produção ~8 FSU/sem, consumo ~7 FSU/sem → +1 FSU/sem líquido
> **Rede Roric:** 60 SD/mês ÷ 4,3 sem = ~15 SD/sem

---

## 🏭 PRODUÇÃO SEMANAL (Outono — referência)

| Recurso | Produção/sem | Fonte |
|---------|:------------:|-------|
| Alimentos (FSU) | ~11 FSU | Caça + Pesca + Salga |
| Madeira | 8-10 unid. | Serraria |
| Ferro forjado | 4-6 unid. | Mina 1 + Forja |
| Couro | 3-4 unid. | Curtume |
| Pedra (Granito) | 10-15 unid. | Pedreira (Hojé + Prisioneiros) |
| Carvão | 4-6 unid. | Produção própria |
| Ferramentas | 6 unid. | Forja de Baldur |
| Prata (Mina 1) | ~2 barras/sem | Fortaleza subterrânea |

---

## 📝 HISTÓRICO DE TRANSAÇÕES

| Data | Recurso | Qtd | Justificativa |
|------|---------|:---:|---------------|
| Ashfall 30, Ano 345 | SD | -50 | Teste com tsx |
| Ashfall 30, Ano 345 | FSU | +10 | Remessa de suprimentos (aliados Harvel) |
| Longdark 15, Ano 345 | SD | -2.500 | Absorção espiões Orm + Mercado Fase 1 |
| Thawrise 1, Ano 345 | SD | -100 | Prêmio de guerra para Aldren |
| Thawrise 3, Ano 345 | SD | -3.000 | Expansão Comercial Tier 5 (Fase 2) |
| Thawrise 8, Ano 345 | SD | -1.000 | Construção Escola + Prefeitura |
| Greening 7, Ano 345 | SD | +1.400 | Receita base 4 semanas |
| Greening 7, Ano 345 | FSU | +4 | Produção 4 semanas |
| Greening 16, Ano 345 | SD | +350 | Receita base 1 semana |
| Greening 16, Ano 345 | FSU | +1 | Produção 1 semana |
| Greening 16, Ano 345 | SD | -400 | Novo Distrito (Vane e Orin) |
| Greening 16, Ano 345 | timber | -20 | Novo Distrito |
| Greening 16, Ano 345 | stone | -20 | Novo Distrito |
| Greening 23, Ano 345 | SD | +350 | Receita 1 semana |
| Greening 23, Ano 345 | FSU | -4 | Consumo refugiados (Lei do Asilo) |
| Greening 23, Ano 345 | SD | -40 | Currais de Pecuária |
| Greening 23, Ano 345 | timber | -10 | Currais de Pecuária |

---

## Regras

- **Transações futuras:** usar `npm run eco:transact -- --holding valenfort --resource [SD|FSU|timber|iron|stone] --amount [+/-X] --reason "[descrição]"`
- **Reconciliação:** ao final de cada mês campanha ou após evento econômico significativo
- **Protocolo semanal:** aplicar valores base (seção acima) + eventos únicos a cada avanço de tempo

---

### G.12 — LOOT & TREASURY TRACKER

| Data | Fonte | Itens | Valor (SD) | Destino |
|------|-------|-------|:----------:|---------|
| Greening 16, 345 | Pico do Firmamento | Coroa de Pedra, Martelo de Prata, Códice Metálico | Incalculável | Cofre pessoal Rodrigo |
| Thawrise 19, 345 | Blackmoor (capturado) | Espada, armadura, documentos | ~200 | Evidências / Cofre |
| Frostwane 17, 345 | Heward (multa) | 50 SD + 6 FSU grão | 50 | Tesouro Valenfort |
| Longdark 5, 345 | Heward (confisco) | 6 FSU grão | — | Estoque Valenfort |

### G.55 — LOOT QUICK REFERENCE

| Tipo de Alvo | SD Base | FSU | Bens | Notas |
|-------------|:-------:|:---:|------|-------|
| Mercenário individual | 5-20 | — | Arma, armadura | Depende do equipamento |
| Grupo mercenário (10) | 50-200 | — | Armas, suprimentos | — |
| Caravana comercial | 100-500 | 5-20 | Variado | — |
| Vilarejo pequeno | 200-800 | 20-100 | Ferramentas, gado | — |
| Posto avançado | 300-1.000 | 10-50 | Armas, suprimentos | — |
| Fortaleza menor | 1.000-5.000 | 50-200 | Tesouro, armas | — |
| Campo de batalha | Variável | — | Equipamento | Depende do tamanho |
| Highsun 7, Ano 345 (Semana 1 de Highsun) | SD | -500 | Baldur pelo trabalho |
| Highsun 7, Ano 345 (Semana 1 de Highsun) | SD | -500 | Baldur pelo trabalho |
