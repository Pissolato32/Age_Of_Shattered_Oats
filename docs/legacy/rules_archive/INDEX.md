# REGRAS — Índice Mestre de Referência

**Diretriz:** Consulte este índice PRIMEIRO. **NUNCA invente regras.** Toda resposta deve referenciar uma regra documentada.

---

## 1. MAPA DE PARTES POR ARQUIVO

| Partes | Arquivo | Conteúdo |
|--------|---------|----------|
| 1–6 | `certeza.md` | Regras de Certeza, Filosofia, Modo Novelo, Sistema Oculto, Mundo Vivo |
| 7–13 | `viagem.md` | Navegação, Viagem, Clima, Sessão |
| 14 | `criacao.md` + `profissoes.md` | Criação de Personagem: Ruler Flow (criacao) + 19 Landless Profissões (profissoes) |
| 15–16 | `nomes.md` | Nomes Espírito + Nômade, Tabelas de Geração |
| 17–31 | `cultural_systems.md` | Cornetas, Rituais, Família, Oito Coroas, A Curva, Trono Vazio |
| 32–41 | `mil_unidades.md` | Unidades, Armas, Armaduras, Montarias, Tier, Recrutamento |
| 42–53, 62–64 | `mil_combate.md` | Combate, Duelos, Emboscadas, Perseguição, Comandante AI |
| 54–61, 65 | `mil_sitio.md` | Sítio, Engenharia, Saque, AAR, Marechal, Doutrinas |
| 66–71, 76 | `economia.md` | Economia Viva, SD, Rendas, População, Custo de Soldado, Salários |
| 72–75, 77–81 | `comercio.md` | Caravanas, Mercado, Suprimentos, Tributos, Mercado Negro |
| 82–84, 89–91 | `pol_diplomacia.md` | Opinião, Alianças, Casamentos, Romance, Bailes |
| 85–88 | `pol_heranca.md` | Herança, Herdeiros, Gravidez, Guarda |
| 92–98 | `pol_intriga.md` | Espionagem, Assassinato, Conselho, Schemer |
| 99–103 | `mundo.md` | Geografia, Rios, Tribos, Nômades, Culinária, Gírias |
| 104–121 | `eventos.md` | Eventos, Religião, Festivais, Ferimentos, Eventos Especiais |
| 122 | `SYSTEM/NARRATIVE_PROTOCOL.md` | Session Flow, Narrative Cadence, Dialogue, Handoff |
| A.1–A.138 | `appendix_a.md` | Tabelas Unificadas (combate, economia, política, etc.) |
| B.1–B.7 | `appendix_b.md` | Caravanas (tiers, custo, risco, carga) |
| C.2 | `glossario.md` | Glossário de Termos (~350 verbetes A-Z) |

---

## 2. ROTEADOR SEMÂNTICO (SEMANTIC MODULE ROUTER)

Agrupado por arquivo. Use **Keywords** para busca semântica e **Intents** para mapear ações ao módulo correto.

### `certeza.md` (Parts 1-6)
**Escopo:** Filosofia do sistema — Certeza, Modo Novelo Interativo, Resolução Oculta, Mundo Vivo, design AI-Safe
**Aliases:** rules of certainty, foundation, philosophy, game master rules, gm conduct, system design, certainty checks
**Negative:** combat, travel, economy, diplomacy, units, events (have dedicated modules)
**Keywords:** certainty, philosophy, interactive novel, hidden resolution, living world, event weight, revelation, POV, imperfect information, failed action, system lock, tutorial, closed system, source of truth
**Intents:** *"How does the system work?"*, *"Roll a random event"*, *"What happens on failure?"*, *"Why can't I see dice?"*, *"Reveal the mechanic"*, *"Rules of Certainty"*
**Seções-chave:** §1 System Locks, §2 Philosophy, §3 AI-Safe, §4 Interactive Novel, §5 Hidden Resolution, §6 Living World
**Relacionados:** `SYSTEM/NARRATIVE_PROTOCOL.md`, `eventos.md` §104

### `viagem.md` (Parts 7-13)
**Escopo:** Movimento, navegação direcional, clima, calendário, avanço de tempo, limites de sessão
**Aliases:** travel, movement, navigation, journey, weather, climate, season, calendar, time skip, camping, session boundary
**Negative:** teleport, instant travel (not supported)
**Keywords:** travel, navigate, direction, weather, climate, season, time, calendar, session, advance, long journey, terrain, landmark, camping, exhaustion, voyage, route
**Intents:** *"I travel to [location]"*, *"What's the weather?"*, *"Advance time by X"*, *"How long to reach [place]?"*, *"Set up camp"*, *"Fast forward"*
**Seções-chave:** §7 Navigation, §8 Travel Measurement, §9 Travel Time, §10 Camping, §11 Calendar, §12 Weather (13 tables), §13 Session Boundary
**Relacionados:** `mundo.md` §99 (regions), `economia.md` (FSU consumption)

### `criacao.md` (Part 14)
**Escopo:** Criação de personagem Ruler (Noble Ruler, Landed Knight) — holdings, recursos, equipamento
**Aliases:** character creation, new character, ruler, noble, knight, start, new game, path objectives, quick start
**Negative:** landless professions (see profissoes.md), mid-game state changes
**Keywords:** create, character, ruler, noble, knight, archetype, holding, starting resources, equipment, warband, path objective, quick start, pre-gen
**Intents:** *"Create a new ruler"*, *"Starting resources?"*, *"Show quick-start characters"*, *"Path objectives?"*, *"New campaign"*
**Seções-chave:** §14.0 Archetypes, §14.5 Holdings, §14.35 Path Objectives, §14.36 Starting Resources
**Relacionados:** `profissoes.md`, `mil_unidades.md` §40, `nomes.md`

### `profissoes.md` (Part 14.15-14.34)
**Escopo:** 19 profissões Landless — fluxo de criação, warband inicial, equipamento, reputação
**Aliases:** landless, profession, class, mercenary, bandit, merchant, spy, assassin, hunter, fisher, farmer, medicus, squire, artisan, artificer, exile, messenger, scout, engineer, healer, vagabond, wanderer
**Negative:** noble ruler, landed knight (see criacao.md)
**Keywords:** landless, profession, mercenary, bandit, merchant, spy, assassin, hunter, fisher, farmer, medicus, squire, artisan, artificer, exile, messenger, scout, engineer, healer, warband, path
**Intents:** *"Play as landless"*, *"What professions exist?"*, *"Show Mercenary path"*, *"Create a Spy"*, *"Start as a wanderer"*
**Seções-chave:** §14.15 Choose Profession, §14.16-34 Individual Profession Flows (Warrior/Crafting/Living/Information/Service paths)
**Relacionados:** `criacao.md`, `mil_unidades.md` §40, `mil_combate.md`

### `nomes.md` (Parts 15-16)
**Escopo:** Sistemas de nomenclatura Espírito e Nômade, tabelas de geração (1d100)
**Aliases:** name generator, naming, spirit names, nomad names, epithets, titles, household names, character names
**Negative:** geography, culture systems (use mundo.md / cultural_systems.md for context)
**Keywords:** name, spirit, nomad, epithet, color, household, generation, table, naming, culture, identity, title
**Intents:** *"Generate a Spirit name"*, *"Generate a Nomad name"*, *"Naming conventions for [culture]?"*, *"What's a good name for..."*
**Seções-chave:** §15 Spirit Naming (Sky/Earth/Forest/Animal/Ceremony), §16 Nomad Naming
**Relacionados:** `cultural_systems.md`, `mundo.md` §99

### `cultural_systems.md` (Parts 17-31)
**Escopo:** Cornetas de Guerra, rituais, clãs familiares, Oito Coroas, vassalagem (The Bending), Trono Vazio
**Aliases:** crown, coronation, war horn, ritual, smudging, sharing circle, family, clan, tribe culture, eight traditions, vassalage, bending, empty throne, interregnum
**Negative:** opinion/diplomacy (see pol_diplomacia.md), inheritance mechanics (see pol_heranca.md)
**Keywords:** crown, horn, ritual, smudging, sharing circle, family, clan, tradition, vassal, bending, empty throne, coronation, interregnum, succession, tribe, ceremony
**Intents:** *"How does Crown of Blood work?"*, *"What are War Horns?"*, *"Perform a ritual"*, *"Vassalage rules?"*, *"Interregnum mechanics"*, *"Coronation ceremony"*
**Seções-chave:** §17 War Horns, §18 Smudging & Sharing, §19 Family Systems, §20-29 Eight Crowns, §30 The Bending, §31 Empty Throne
**Relacionados:** `pol_heranca.md` (succession), `pol_diplomacia.md` (opinion), `eventos.md` §109

### `mil_unidades.md` (Parts 32-41)
**Escopo:** Unidades, comandantes, armas, armaduras, montarias, breeding/criação, tiers, recrutamento
**Aliases:** recruit, soldier, army, unit, commander, weapon, armor, mount, cavalry, breeding, training times, pasture size, foal, stallion, mare, banner, levy, militia, mercenary, garrison, troop, drill, military equipment
**Negative:** combat resolution (see mil_combate.md), siege (see mil_sitio.md)
**Keywords:** unit, commander, recruit, soldier, levy, militia, mercenary, weapon, armor, mount, breeding, stallion, mare, foal, pasture, banner, tier, equipment, retinue, army, troop, garrison, AC, morale, drill
**Intents:** *"Recruit soldiers"*, *"What units are available?"*, *"Equip my troops"*, *"Name a commander"*, *"Upgrade unit tier"*, *"Check garrison stats"*, *"Start horse breeding"*, *"Progress horse breeding"*, *"Verify pasture acres"*
**Seções-chave:** §32 Unit Stats, §33 Commander Attributes, §34 Weapons, §35 Armor, §36 Mounts, §36.5 Mount Breeding, §37 Unit Tier, §38 Banner, §39 Supply, §40-41 Recruitment
**Relacionados:** `mil_combate.md`, `economia.md` §71, `mil_sitio.md`

### `mil_combate.md` (Parts 42-53, 62-64)
**Escopo:** Sistema de combate, duelos, emboscadas, IA de comandante, moral, captura, perseguição
**Aliases:** combat, battle, fight, duel, ambush, attack, war, skirmish, clash, engage, retreat, withdraw, pursuit, capture, commander AI, morale, intervention, battle speech
**Negative:** unit stats/recruitment (see mil_unidades.md), siege warfare (see mil_sitio.md)
**Keywords:** combat, battle, duel, fight, attack, ambush, pursuit, retreat, withdraw, commander AI, temperament, priority, fear, morale, capture, kill, wound, intervention, speech, engagement
**Intents:** *"Attack [enemy]"*, *"Challenge to a duel"*, *"Set up an ambush"*, *"Retreat"*, *"Commander enters battle"*, *"Pursue fleeing enemy"*, *"Check morale"*
**Seções-chave:** §42 Commander AI, §43-47 Combat Phases, §48-49 Engagement, §50-52 Duel/Pursuit, §53 Ambush, §62-64 Morale & Loyalty
**Relacionados:** `mil_unidades.md`, `mil_sitio.md`

### `mil_sitio.md` (Parts 54-61, 65)
**Escopo:** Cerco, fortificações, engenharia, saque, marechal, doutrinas
**Aliases:** siege, fortification, wall, castle, breach, assault, siege engine, ram, tower, sapper, engineer, loot, pillage, sack, marshal, doctrine, after-action, night raid, sabotage
**Negative:** field combat (see mil_combate.md), unit recruitment (see mil_unidades.md)
**Keywords:** siege, fortify, fortification, wall, breach, assault, siege engine, ram, tower, sapper, engineer, loot, pillage, sack, marshal, doctrine, after-action, destroy, rebuild, sabotage, night raid
**Intents:** *"Lay siege to [holding]"*, *"Build siege engines"*, *"Loot the settlement"*, *"Appoint a marshal"*, *"Conduct a night raid"*, *"After-action report"*
**Seções-chave:** §54 Siege, §55-56 Engineering, §57 Loot, §58 Sabotage, §59 AAR, §60-61 Destruction/Rebuild, §65 Marshal & Doctrines
**Relacionados:** `mil_combate.md`, `mil_unidades.md`, `economia.md`

### `economia.md` (Parts 66-71, 76)
**Escopo:** Tesouro (SD, FSU), receitas, despesas, construção, mão de obra, população, salários
**Aliases:** economy, treasury, gold, silverdew, money, income, revenue, expense, cost, price, salary, wage, labor, worker, population, construction, build, tax, resource, patch, production, storage, rent, budget, finance
**Negative:** trade/prices (see comercio.md), unit costs only (see mil_unidades.md §40-41)
**Keywords:** economy, silverdew, SD, FSU, food, treasury, income, expense, revenue, cost, price, salary, wage, labor, worker, population, construction, build, tax, resource, patch, production, storage, holding, rent
**Intents:** *"How much money do I have?"*, *"Monthly income?"*, *"I want to build [structure]"*, *"What are my expenses?"*, *"Pay salaries"*, *"Check treasury"*, *"Calculate income"*
**Seções-chave:** §66 Four Pillars, §67 Silverdew, §68 Holding Income (9 tiers), §69 Labor & Population, §70 Weekly Cycle, §71 Soldier Cost, §76 Salaries
**Relacionados:** `comercio.md`, `mil_unidades.md`, `CAMPANHA/ECONOMIA.md`

### `comercio.md` (Parts 72-75, 77-81)
**Escopo:** Comércio, caravanas, mercado, caça/pesca/forrageio, tributos, mercado negro
**Aliases:** trade, commerce, caravan, market, buy, sell, merchant, goods, supply, FSU, food, hunt, fish, forage, gather, tribute, black market, smuggling, storage
**Negative:** treasury/income (see economia.md), caravan tiers (see appendix_b.md)
**Keywords:** trade, caravan, market, buy, sell, price, demand, supply, food, FSU, hunt, fish, forage, gather, tribute, vassal, privilege, storage, black market, smuggling, merchant, commodity
**Intents:** *"Trade with [region]"*, *"Send a caravan"*, *"Hunt for food"*, *"Buy/sell goods"*, *"Collect tribute"*, *"Check prices"*, *"Black market"*
**Seções-chave:** §72 Caravan System, §73 Market, §74 Goods & Quality, §75 Hunting/Foraging, §77 Tribute, §78 Privileges, §79 Supply, §80 Storage, §81 Black Market
**Relacionados:** `economia.md`, `pol_diplomacia.md`, `appendix_b.md`

### `pol_diplomacia.md` (Parts 82-84, 89-91)
**Escopo:** Opinião entre casas, alianças, vassalagem, casamento, romance, bailes
**Aliases:** diplomacy, opinion, relation, alliance, vassal, liege, marriage, wedding, romance, ball, social, noble, house, court, promise, treaty, pact, secret alliance, dowry, engagement, reputation
**Negative:** espionage/intrigue (see pol_intriga.md), inheritance (see pol_heranca.md), combat (see mil_combate.md)
**Keywords:** diplomacy, opinion, alliance, vassal, liege, marriage, romance, ball, social, promise, treaty, relation, house, noble, dowry, engagement, court, pact, secret, reputation, wedding
**Intents:** *"Negotiate with [House]"*, *"Propose marriage alliance"*, *"Check opinion"*, *"Declare vassal"*, *"Host a ball"*, *"Pursue romance"*, *"Make a promise"*
**Seções-chave:** §82 Opinion & Alliances, §83 Marriage Tracker, §84 Lineage & Dowry, §89 Marriage, §90 Romance, §91 Social Events
**Relacionados:** `pol_intriga.md`, `pol_heranca.md`, `eventos.md` §109

### `pol_heranca.md` (Parts 85-88)
**Escopo:** Herança, sucessão, gravidez, herdeiros, guarda e tutela
**Aliases:** inheritance, succession, heir, claim, title, birth, pregnancy, child, guardian, ward, regency, bloodline, lineage, succession crisis, will, testament
**Negative:** marriage (see pol_diplomacia.md), crowns/coronation (see cultural_systems.md)
**Keywords:** inherit, succession, heir, claim, title, inheritance, pregnancy, birth, child, guardian, ward, regency, succession crisis, lineage, bloodline, will, testament, inheritance
**Intents:** *"Who inherits my title?"*, *"My ruler died"*, *"I want an heir"*, *"Check succession order"*, *"Pregnancy occurs"*, *"Name a guardian"*, *"Succession crisis"*
**Seções-chave:** §85 Claims & Inheritance, §86 Pregnancy, §87 Guardianship, §88 Heirs & Lineage
**Relacionados:** `pol_diplomacia.md` (marriage), `cultural_systems.md` (crowns), `eventos.md` §110

### `pol_intriga.md` (Parts 92-98)
**Escopo:** Espionagem, assassinato, conselho do lorde, conspirador (Schemer), maldição do parricida
**Aliases:** spy, espionage, intrigue, council, lord's council, schemer, conspiracy, plot, assassination, kill, blackmail, secrets, informant, agent, network, backroom deals
**Negative:** open diplomacy (see pol_diplomacia.md), battles (see mil_combate.md), public events
**Keywords:** spy, espionage, infiltrate, eavesdrop, blackmail, scheme, assassin, kill, council, lord, schemer, intrigue, plot, conspiracy, secret, informant, agent, network
**Intents:** *"Send a spy"*, *"Assassinate [target]"*, *"Council meeting"*, *"Investigate a plot"*, *"Blackmail [noble]"*, *"Check council stability"*, *"Schemer detection"*
**Seções-chave:** §92 Espionage, §93 Spy Network, §94 Schemer, §95 Assassination, §96 Kinslayer, §97 Lord's Council, §98 Conspiracy
**Relacionados:** `pol_diplomacia.md`, `CAMPANHA/MISSOES.md`, `CAMPANHA/CONSELHO.md`

### `mundo.md` (Parts 99-103)
**Escopo:** Geografia das 5 regiões, rios, tribos, nômades, culinária regional (App. E), gírias (App. F)
**Aliases:** world, geography, map, region, river, forest, plains, mountains, steppe, snowland, tribe, nomad, culture, cuisine, food, slang, language, introduction, landmark, terrain
**Negative:** travel times (see viagem.md), cultural systems/crowns (see cultural_systems.md)
**Keywords:** geography, region, river, forest, plains, mountains, steppe, snowlands, tribe, nomad, clan, culture, introduction, cuisine, food, slang, language, navigation, landmark, terrain, scale
**Intents:** *"What's in [region]?"*, *"Describe the geography"*, *"I encounter a tribe"*, *"Meet a nomad"*, *"Local cuisine?"*, *"How to greet [culture]?"*, *"Tell me about the world"*
**Seções-chave:** §99 Five Regions, §100 Rivers (Velrin/Caedor/Thrax), §101 Introductions, §102 Tribes, §103 Nomads, App. E Cuisine, App. F Slang
**Relacionados:** `viagem.md`, `cultural_systems.md`, `nomes.md`

### `eventos.md` (Parts 104-121)
**Escopo:** Eventos aleatórios, religião, festivais, ferimentos, prisão/fuga, herdeiro oculto, rumores
**Aliases:** event, random event, encounter, religion, faith, festival, wound, injury, medicine, heal, prison, jail, escape, rescue, hidden heir, pretender, rumor, reputation, nickname, surrender, cult, migration, special event
**Negative:** living world system (see certeza.md §6), opinion changes (see pol_diplomacia.md)
**Keywords:** event, random, encounter, religion, faith, festival, ceremony, wound, injury, medicine, heal, prison, escape, rescue, hidden heir, pretender, rumor, reputation, nickname, surrender, cult, migration
**Intents:** *"Random event occurs"*, *"Hold a festival"*, *"Character is wounded"*, *"I'm imprisoned"*, *"Convert faith"*, *"Spread a rumor"*, *"Negotiate surrender"*, *"Hidden heir appears"*
**Seções-chave:** §104 Campaign Intro, §105 Prison/Escape, §106 Wounds & Medicine, §107 Religion, §108 Cults, §109 Festivals, §110 Hidden Heir, §111-121 Special Events
**Relacionados:** `SYSTEM/NARRATIVE_PROTOCOL.md`, `certeza.md` §6, `pol_diplomacia.md` (reputation)

### `SYSTEM/NARRATIVE_PROTOCOL.md` (Part 122)
**Escopo:** Fluxo de sessão, cadência narrativa, diálogo, handoff, conduta do GM — *Gameplay Flow*
**Aliases:** session flow, narrative cadence, gm conduct, scene flow, dialogue, turn structure, scene ending, interruption, checkpoint narration, question protocol, multi-turn actions
**Negative:** game mechanics (see certeza.md), rule lookup (see INDEX.md), state management (see CAMPANHA/)
**Keywords:** session, narrative, flow, turn, scene, dialogue, interruption, handoff, POV, checkpoint, multi-turn, setback, failure, ambiguous, silence, context, question, GM cycle, scene state
**Intents:** *"How should the session flow?"*, *"End my turn"*, *"Multi-turn action?"*, *"NPC dialogue rules"*, *"Conduct a setback"*, *"Handle ambiguous orders"*, *"Scene interruption?"*, *"How to ask the player"*
**Seções-chave:** §122.1 Six-Step Cycle, §122.2 Scene States, §122.3 Interruption Rule, §122.4 Contextual Question, §122.5 Interrupt Hierarchy, §122.6 Checkpoint Narration, §122.7 Suspended Scenes, §122.8 Investigation, §122.9 Silence, §122.10 Ambiguous Actions, §122.11 Multi-Turn, §122.12 Setback
**Relacionados:** `AGENTS.md` §6, `certeza.md` §4, `viagem.md` §13

### `appendix_a.md` (Appendix A, pp. 513-650)
**Escopo:** 138 tabelas unificadas (A.1-A.138) — consulta rápida de todas as mecânicas do sistema (incluindo navios)
**Aliases:** tables, reference, quick reference, DC, roll table, modifier table, combat table, economy table, generation table, lookup, ship types, fleet stats, wind travel speed, river sailing
**Negative:** specific rules (use the corresponding REGRAS/ file for explanations)
**Keywords:** table, reference, quick lookup, DC, roll, modifier, combat table, economy table, travel table, event table, name table, AC, damage, morale, price, distance, weather, population, NPC generation, ship, sloop, galley, wind travel speed, river sailing
**Intents:** *"Quick reference combat DCs"*, *"Look up a table"*, *"Check AC values"*, *"Generate NPC names"*, *"Morale check DC"*, *"Find a specific DC"*, *"Build a ship"*, *"Roll wind travel"*, *"Verify ship stats"*
**Seções-chave:** A.1-A.30 Combat, A.31-A.55 Economy, A.53 Ship Types, A.56-A.70 Trade, A.71-A.85 Diplomacy, A.86-A.95 Inheritance, A.96-A.110 Events, A.111-A.120 Names, A.121-A.130 Weather, A.131-A.138 Population
**Relacionados:** All REGRAS files (tables reference)

### `appendix_b.md` (Appendix B, p. 651)
**Escopo:** Tiers de caravana comercial B.1-B.7 — capacidade, risco, custo, tripulação
**Aliases:** caravan tiers, cargo, trade route, merchant convoy, escort, freight
**Negative:** trade economy (see comercio.md for market mechanics)
**Keywords:** caravan, trade, cargo, capacity, risk, cost, crew, escort, tier, travel, range, specialist, merchant, convoy
**Intents:** *"What caravans can I hire?"*, *"Cargo capacity?"*, *"Caravan cost?"*, *"Risk for tier X?"*, *"Hire a caravan"*
**Seções-chave:** B.1-B.7: Overview, Cargo Capacity, Risk, Travel Range, Crew Breakdown
**Relacionados:** `comercio.md` §72, `economia.md`, `mil_unidades.md` (escorts)

### `glossario.md` (Appendix C.2, pp. 399-410)
**Escopo:** Glossário completo de ~350 termos do sistema (A-Z)
**Aliases:** glossary, dictionary, terms, definitions, vocabulary, acronyms, what is, meaning, explain
**Negative:** rules/mechanics explanations (use specific REGRAS/ files for depth)
**Keywords:** glossary, term, definition, dictionary, reference, vocabulary, acronym, concept, meaning, keyword lookup
**Intents:** *"Define [term]"*, *"What does [acronym] mean?"*, *"Explain [concept]"*, *"Glossary lookup"*, *"What is [term]?"*
**Seções-chave:** A-Z entries (~350 terms covering mechanics, professions, equipment, culture, geography, politics)
**Relacionados:** All REGRAS files

### PDF Elements (Front Matter + Quick References)
**Escopo:** Book 0 (front matter), Launcher, Cancel Protocol, Path Objectives, Quick References (Appendix H), Design Philosophy (Appendix D)
**Aliases:** launcher, cancel, shutdown, path objectives, quick reference cards, cheat sheet, design philosophy, game design
**Negative:** specific rules (use the dedicated REGRAS/ file)
**Keywords:** front matter, launcher, cancel, shutdown, path objective, border lord, heir's sword, mercenary, artificer, conqueror, quick reference, combat reference, economy reference, politics reference, travel reference, design philosophy
**Intents:** *"Start/end a session"*, *"Path objectives?"*, *"Show quick reference cards"*, *"Game design philosophy"*, *"Launcher protocol"*
**Seções-chave:** Book 0 (PDF pp. 1-16), Path Objectives `criacao.md` §14.35, Quick Ref H.1-H.3 (PDF pp. 831-840), Appendix D (`certeza.md` §2)
**Relacionados:** `certeza.md` §2, `criacao.md` §14.35, `AGENTS.md`

---

## 3. FLUXO DE RESOLUÇÃO DE REGRAS

Quando uma ação do jogador exigir resolução mecânica:

1. **Identificar** a regra relevante (use este índice)
2. **Abrir** o arquivo REGRAS/ correto
3. **Localizar** o § específico
4. **Aplicar** a regra exatamente como escrita
5. **Resolver** com dados ocultos (narrativa, não números)
6. **Registrar** mudanças no arquivo CAMPANHA/ apropriado
7. **Apresentar** resultado como história
8. **NUNCA** mostrar números a menos que o jogador peça (§5.4 Revelation Rule)

> Se a regra não existir em nenhum arquivo REGRAS/, a ação **falha** — não invente.

---

## 4. ARQUIVOS DO PROJETO

```
RPG_DE_MESA/
├── AGENTS.md                         ← Instruções mestras da IA (ENTRY POINT)
├── V.4.7 Age Of Shattered Oaths.pdf  ← Livro de regras (PDF âncora)
├── validar.py                        ← Validador de esquemas CAMPANHA/
├── SYSTEM/                           ← Instruções de conduta da IA
│   ├── BOOTSTRAP.md                  ← ← LEIA PRIMEIRO
│   ├── QUICK_REF.md                  ← Tabelas de referência rápida
│   └── NARRATIVE_PROTOCOL.md         ← Fluxo de sessão e cadência
├── REGRAS/                           ← Regras extraídas por assunto
│   ├── INDEX.md                      ← ← VOCÊ ESTÁ AQUI
│   ├── certeza.md                    ← Regras de Certeza, Filosofia, Modo Novelo
│   ├── viagem.md                     ← Navegação, Viagem, Clima, Sessão
│   ├── criacao.md                    ← Criação de Personagem (Ruler)
│   ├── profissoes.md                ← 19 Landless Professions
│   ├── nomes.md                      ← Nomes Espírito + Nômade + Tabelas
│   ├── cultural_systems.md           ← Coroas, Rituais, Tradições
│   ├── mil_unidades.md               ← Unidades, Armas, Armaduras, Recrutamento
│   ├── mil_combate.md                ← Combate, Duelos, Emboscadas
│   ├── mil_sitio.md                  ← Sítio, Saque, Engenharia, Marechal
│   ├── economia.md                   ← Rendas, SD, Custos, População
│   ├── comercio.md                   ← Caravanas, Mercado, Suprimentos
│   ├── pol_diplomacia.md             ← Opinião, Alianças, Casamentos, Romance
│   ├── pol_heranca.md                ← Herança, Herdeiros, Gravidez
│   ├── pol_intriga.md                ← Espionagem, Conselho, Assassinato
│   ├── mundo.md                      ← Geografia, Rios, Tribos, Nômades, Culinária, Gírias
│   ├── eventos.md                    ← Eventos, Religião, Festivais
│   ├── appendix_a.md                 ← Unified Tables A.1-A.138
│   ├── appendix_b.md                 ← Trade Caravan Tiers B.1-B.7
│   └── glossario.md                  ← C.2 Glossary of Terms (~350 verbetes)
└── CAMPANHA/                         ← Estado da campanha (única fonte de verdade)
    ├── PERSONAGENS/
    │   ├── rodrigo.md               ← G.1 Player Character
    │   ├── elara.md                 ← G.5 Noble House
    │   ├── seren.md                 ← G.5 Noble House
    │   ├── aldren.md                ← Part 33 Commander
    │   ├── gerold.md                ← Part 33 Commander
    │   ├── roric.md                 ← Part 33 Commander
    │   ├── garrick.md               ← Part 33 Commander
    │   ├── blackmoor.md             ← G.5 Noble House
    │   ├── harvel.md                ← G.5 Noble House
    │   ├── aldric.md                ← G.5 Noble House
    │   ├── baldur.md                ← Part 7.18 Smith
    │   ├── roderick.md              ← Part 33 Commander
    │   ├── mira.md                  ← Part 33 Commander
    │   ├── tobin.md                 ← Part 40 Recruit
    │   ├── finn.md                  ← NPC — aprendiz ferreiro
    │   ├── marten.md                ← NPC — potencial aprendiz
    │   ├── martim.md                ← NPC — comerciante/informante
    │   ├── orin.md                  ← NPC — mestre de obras
    │   ├── tobias.md                ← NPC — taverneiro (capital)
    │   ├── sir_vance.md             ← NPC — emissário Blackmoor (morto)
    │   ├── elyra.md                 ← G.5 Noble House (Hidden Heir)
    │   ├── dorian_voss.md           ← NPC — antagonista (foragido)
    │   ├── edmundo_vance.md         ← G.5 Noble House (chanceler)
    │   ├── kaelen_thorn.md          ← NPC — investigadora real
    │   ├── isolda_vance.md          ← NPC — juíza regional
    │   ├── aldus.md                 ← NPC — senhor de Bronzeford
    │   └── isadora.md               ← NPC — rainha-mãe
    ├── TEMPLATE_PERSONAGEM.md        ← Templates Codex (5 tipos)
    ├── APPENDIX_G.md                 ← Inventário de ledgers G.1-G.69
    ├── ESTADO_ATUAL.md               ← G.6 Session Log
    ├── CONSELHO.md                   ← G.62-66 Council
    ├── TERRITORIOS.md                ← G.3 + G.4 Holdings
    ├── ECONOMIA.md                   ← G.2 Weekly Ledger
    ├── DIPLOMACIA.md                 ← G.5 + G.23 + G.24
    ├── MISSOES.md                    ← G.14 Spy Network
    ├── GENEALOGIA.md                 ← G.20 Branch Family Tracker
    ├── MERCENARIOS.md                ← G.31/G.32 Mercenary Market
    ├── LIVRO_NEGRO.md                ← Inteligência secreta (GM eyes only)
    └── LINHA_DO_TEMPO.md             ← Append-only chronicle
```

---

## 5. PDF TABLE OF CONTENTS — MASTER MAP

**Source:** Age of Shattered Oaths Rulebook V.6.7.3 (783 pages)

### Book 0: Introduction (pp. 1-8)

| § | Páginas | Título | Status no Projeto |
|---|---------|--------|-------------------|
| 0.1 | 1-2 | What is Age of Shattered Oaths? | PDF-only (flavor) |
| 0.2 | 2-3 | What You Need to Play | PDF-only (flavor) |
| 0.3 | 3-4 | How to Use This Book | PDF-only (flavor) |
| 0.4 | 4-5 | The World of Shattered Oaths | PDF-only (flavor) |
| 0.5 | 5-6 | The Shattering | PDF-only (flavor) |
| 0.6 | 6-7 | The Oath | PDF-only (flavor) |
| 0.7 | 7-8 | A Note on Dice | `certeza.md` §2.1 |

### Book I: Characters (pp. 9-87)

| § | Páginas | Título | Arquivo |
|---|---------|--------|---------|
| 1-8 | 9-23 | Certeza, Filosofia, Modo Novelo | `certeza.md` |
| 9-13 | 24-47 | Viagem, Clima, Sessão | `viagem.md` |
| 14 | 48-68 | Criação de Personagem (Ruler) | `criacao.md` |
| 14.15-34 | 48-68 | 19 Landless Professions | `profissoes.md` |
| 15 | 69-72 | Nomes Espírito | `nomes.md` |
| 16 | 72-77 | Nomes Nômades | `nomes.md` |

### Book II: Culture (pp. 78-127)

| § | Páginas | Título | Arquivo |
|---|---------|--------|---------|
| 17 | 88-91 | War Horns | `cultural_systems.md` |
| 18 | 91-95 | Rituals & Traditions | `cultural_systems.md` |
| 19 | 95-99 | Family Clans | `cultural_systems.md` |
| 20-31 | 100-127 | Eight Crowns + Vassalage | `cultural_systems.md` |

### Book III: Military (pp. 128-238)

| § | Páginas | Título | Arquivo |
|---|---------|--------|---------|
| 32-41 | 128-238 | Units, Commanders, Weapons, Armor, Recruitment | `mil_unidades.md` |
| 42-53 | 128-238 | Combat, Duels, Ambush | `mil_combate.md` |
| 54-61 | 128-238 | Siege, Pillage, Engineering | `mil_sitio.md` |
| 62-64 | 128-238 | Commander AI, Loyalty | `mil_combate.md` |
| 65 | 128-238 | Marshal, Doctrines | `mil_sitio.md` |

### Book IV: Economy (pp. 239-309)

| § | Páginas | Título | Arquivo |
|---|---------|--------|---------|
| 66-71 | 239-309 | Treasury, Income, Construction, Labor, Population | `economia.md` |
| 72-75 | 239-309 | Caravans, Market, Hunting | `comercio.md` |
| 76 | 239-309 | Salaries | `economia.md` |
| 77-81 | 239-309 | Tributes, Privileges, Supplies, Storage, Black Market | `comercio.md` |

### Book V: Politics (pp. 310-555)

| § | Páginas | Título | Arquivo |
|---|---------|--------|---------|
| 82-84 | 310-555 | Opinion, Alliances, Vassalage | `pol_diplomacia.md` |
| 85-88 | 310-555 | Inheritance, Pregnancy, Heirs | `pol_heranca.md` |
| 89-91 | 310-555 | Marriage, Romance, Social Events | `pol_diplomacia.md` |
| 92-98 | 310-555 | Espionage, Council, Assassination | `pol_intriga.md` |
| 99-103 | 310-555 | Geography, Rivers, Tribes, Nomads | `mundo.md` |
| 104-121 | 310-555 | Events, Religion, Festivals | `eventos.md` |
| 122 | — | Session Flow, Narrative Cadence, Dialogue, Handoff | `SYSTEM/NARRATIVE_PROTOCOL.md` |

### Book VI: Appendices (pp. 556-783)

| § | Páginas | Título | Arquivo |
|---|---------|--------|---------|
| A.1-A.138 | 513-650 | Unified Tables | `appendix_a.md` |
| B.1-B.7 | 651 | Trade Caravan Tiers | `appendix_b.md` |
| C.1-C.4 | 652-726 | Codex Templates | `CAMPANHA/TEMPLATE_PERSONAGEM.md` |
| C.2 | 399-410 | Glossary of Terms | `glossario.md` |
| D.1-D.11 | 727-812 | Appendix D: Design Philosophy + Oath | `certeza.md` §2 |
| E.1-E.3 | 813-820 | The World of Shattered Oaths | PDF-only (flavor) |
| F.1-F.4 | 821-830 | Example of Play | PDF-only (flavor) |
| G.1-G.69 | 727-812 | Ledger Templates | `CAMPANHA/APPENDIX_G.md` |
| H.1-H.3 | 831-840 | Quick Reference | PDF-only (flavor) |

---

## 6. TABELA DE ROTEAMENTO RÁPIDO — Ação → Arquivo

| Ação do jogador | Arquivo CAMPANHA/ | Regra REGRAS/ |
|-----------------|-------------------|---------------|
| "Quanto tenho?" / "Meu tesouro" | `ECONOMIA.md` | `economia.md` §67 |
| "Quero contratar soldados" | `TERRITORIOS.md` + `ECONOMIA.md` | `mil_unidades.md` §40-41, `economia.md` §71 |
| "Mando um espião" / "Quero informação" | `MISSOES.md` | `pol_intriga.md` §92 |
| "Negocio com [Casa]" | `DIPLOMACIA.md` | `pol_diplomacia.md` §82 |
| "Quero construir [algo]" | `TERRITORIOS.md` | `economia.md` §68, `mil_sitio.md` §54 |
| "Caçar/pescar/forragear" | `ECONOMIA.md` | `comercio.md` §75 |
| "Encontro caravana" | `ECONOMIA.md` | `comercio.md` §72 |
| "Quero falar com [conselheiro]" | `CONSELHO.md` | `pol_intriga.md` §97 |
| "Avanço o tempo" | `ESTADO_ATUAL.md` + `LINHA_DO_TEMPO.md` | `viagem.md` §13 |
| "Quero viajar para [lugar]" | `ESTADO_ATUAL.md` | `viagem.md` §7-9 |
| "Declaro guerra" / "Ataco" | `TERRITORIOS.md` + `MISSOES.md` | `mil_combate.md` §48-53 |
| "Sítio" / "Cerco" | `TERRITORIOS.md` | `mil_sitio.md` §54-55 |
| "Quero me casar / romance" | `PERSONAGENS/[nome].md` + `DIPLOMACIA.md` | `pol_diplomacia.md` §89-90 |
| "Meu herdeiro" / "sucessão" | `PERSONAGENS/[nome].md` | `pol_heranca.md` §85-87 |
| "O que está acontecendo em [região]?" | `ESTADO_ATUAL.md` | `mundo.md` §99, `certeza.md` §6 |
| "Quero saber o clima" | — (rolagem oculta) | `viagem.md` §12 |
| "Quem está no meu conselho?" | `CONSELHO.md` | `pol_intriga.md` §97 |
| "Fujo / me escondo" | — | `eventos.md` §105 |
| "Quero criar personagem novo" | `PERSONAGENS/[nome].md` | `criacao.md` §14 (Ruler) / `profissoes.md` §14.15 (Landless) |

---

## 7. MAPA REVERSO — Regra → Arquivo CAMPANHA/

**Uso:** Após resolver uma mecânica em §X, consulte abaixo qual(is) arquivo(s) CAMPANHA/ reescrever. Se múltiplos são listados, TODOS devem ser reescritos se o estado mudar.

**Legenda para PERSONAGENS/**: `P/[nome].md` — sempre substituir `[nome]` pelo nome do personagem afetado. `P/novo.md` = criar novo arquivo.

### 7.1 `viagem.md` (§7-13)

| § | Mecânica | Arquivo(s) CAMPANHA/ |
|---|----------|----------------------|
| §7-9 | Viagem (movimento, tempo, ritmo) | `ESTADO_ATUAL.md` (posição, tempo decorrido), `LINHA_DO_TEMPO.md` (se viagem relevante), `P/[nome].md` (exaustão) |
| §10 | Acampamento, descanso, vigilância | `ECONOMIA.md` (suprimentos consumidos), `ESTADO_ATUAL.md` (local do acampamento) |
| §11-12 | Clima (rolagem oculta) | `ESTADO_ATUAL.md` (efeito climático se relevante) |
| §13 | Avanço de tempo (qualquer duração) | `ESTADO_ATUAL.md` (nova data), `LINHA_DO_TEMPO.md` (se evento relevante) |

### 7.2 `cultural_systems.md` (§17-31)

| § | Mecânica | Arquivo(s) CAMPANHA/ |
|---|----------|----------------------|
| §17 | Cornetas de Guerra (forjar, quebrar, capturar) | `TERRITORIOS.md` (equipamento), `DIPLOMACIA.md` (significado simbólico) |
| §18 | Rituais e Tradições Culturais | `DIPLOMACIA.md` (relações), `P/[nome].md` (status ritual se aplicável) |
| §19 | Clãs Familiares (sistema tribal) | `DIPLOMACIA.md` (relações de clã), `ECONOMIA.md` (renda familiar), `CONSELHO.md` (se membro no conselho) |
| §19.4 | Conselho Familiar Tribal | `CONSELHO.md`, `DIPLOMACIA.md` |
| §20 | Festivais Culturais | `ECONOMIA.md` (custo/renda), `DIPLOMACIA.md` (opinião), `ESTADO_ATUAL.md` |
| §21-29 | Oito Coroas (sistemas de sucessão) | `DIPLOMACIA.md` (legitimidade, herdeiro reconhecido), `P/[nome].md` (título/herdeiro), `LINHA_DO_TEMPO.md` (coroação) |
| §30 | A Curva (vassalagem, juramento de fidelidade) | `DIPLOMACIA.md` (novo vassalo/suserano), `P/[nome].md` (juramento) |
| §31 | Trono Vazio / Interregno | `DIPLOMACIA.md` (crise sucessória), `TERRITORIOS.md` (reivindicação), `LINHA_DO_TEMPO.md` |

### 7.3 `mil_unidades.md` (§32-41)

| § | Mecânica | Arquivo(s) CAMPANHA/ |
|---|----------|----------------------|
| §32 | Unidades (tipos, stats por tier) | `TERRITORIOS.md` (guarnição alterada) |
| §33 | Comandantes (nomeação, tier, stats) | `P/[nome].md` (novo comandante ou atualizado), `CONSELHO.md` (se nomeado para o conselho) |
| §34 | Armas (árvore de equipamento) | `P/[nome].md` (equipamento do personagem), `TERRITORIOS.md` (estoque do feudo) |
| §35 | Armaduras (árvore de equipamento) | `P/[nome].md` (equipamento), `TERRITORIOS.md` (estoque) |
| §36 | Montarias (cavalos, éguas, guerra) | `P/[nome].md` (montaria do personagem), `TERRITORIOS.md` (cavalaria, estoque) |
| §37 | Tier de Unidade (progressão) | `TERRITORIOS.md` (tier da guarnição) |
| §38 | Bandeira (Banner Tier, bônus) | `TERRITORIOS.md` (bônus da bandeira), `DIPLOMACIA.md` (reputação) |
| §39 | Suprimentos Militares (FSU) | `ECONOMIA.md` (FSU consumida), `TERRITORIOS.md` (armazém) |
| §40-41 | Recrutamento (voluntários, levante, custo) | `TERRITORIOS.md` (guarnição aumentada), `ECONOMIA.md` (custo SD recrutamento + manutenção) |

### 7.4 `mil_combate.md` (§42-53, 62-64)

| § | Mecânica | Arquivo(s) CAMPANHA/ |
|---|----------|----------------------|
| §42-43 | Combate (fases, resolução, baixas) | `TERRITORIOS.md` (baixas na guarnição), `ECONOMIA.md` (perdas materiais), `LINHA_DO_TEMPO.md` (batalha) |
| §44 | Baixas Detalhadas (oficiais, comandantes) | `TERRITORIOS.md`, `P/[nome].md` (se comandante ferido/morto) |
| §45 | Saque em Combate | `ECONOMIA.md` (SD, FSU, materiais saqueados), `TERRITORIOS.md` (dano ao território) |
| §46 | Intervenção no Campo de Batalha | `P/[nome].md` (glória, ferimentos) |
| §47 | Moral (testes, quebra, rota) | `TERRITORIOS.md` (moral da tropa), `CONSELHO.md` (se comandante falha moral) |
| §48-49 | Emboscada | `P/[nome].md` (ferimentos), `TERRITORIOS.md` (baixas), `LINHA_DO_TEMPO.md` |
| §50 | Perseguição | `ESTADO_ATUAL.md` (nova posição), `P/[nome].md` (exaustão) |
| §51-52 | Duelo | `P/[nome].md` (ferimentos, glória, status), `LINHA_DO_TEMPO.md` (se duelo famoso) |
| §53 | Captura / Baixas | `P/[nome].md` (prisioneiro/morto), `DIPLOMACIA.md` (resgate) |
| §62 | Comandante AI — Comportamento | `CONSELHO.md` (se Temperamento muda) |
| §63 | Comandante AI — Prioridade/Medo | `CONSELHO.md` (se Prioridade ou Fear mudam) |
| §64 | Lealdade do Comandante | `CONSELHO.md` (lealdade alterada) |

### 7.5 `mil_sitio.md` (§54-61, 65)

| § | Mecânica | Arquivo(s) CAMPANHA/ |
|---|----------|----------------------|
| §54-55 | Sítio (início, fases, cerco) | `TERRITORIOS.md` (fortificações, cerco iniciado), `ESTADO_ATUAL.md` (progresso ticker) |
| §56-57 | Engenharia (torres, aríetes, escadas) | `TERRITORIOS.md` (equipamento de cerco), `ECONOMIA.md` (custo de construção) |
| §58 | Minas / Cerco Subterrâneo | `TERRITORIOS.md`, `ESTADO_ATUAL.md` |
| §59 | After-Action Report (AAR) | `LINHA_DO_TEMPO.md` (relato), `TERRITORIOS.md` (resultado), `ECONOMIA.md` (saldo) |
| §60 | Saque de Sítio | `ECONOMIA.md` (SD, FSU, materiais), `TERRITORIOS.md` (destruição), `LINHA_DO_TEMPO.md` |
| §61 | Destruição e Reconstrução | `TERRITORIOS.md` (nível de destruição), `ECONOMIA.md` (custo de reparo) |
| §65 | Marechal / Doutrinas | `TERRITORIOS.md` (doutrina ativa), `CONSELHO.md` (se marechal nomeado/destituído) |

### 7.6 `economia.md` (§66-71, 76)

| § | Mecânica | Arquivo(s) CAMPANHA/ |
|---|----------|----------------------|
| §66 | Tesouro (SD, FSU, Materiais) | `ECONOMIA.md` |
| §67 | Receitas e Despesas Mensais | `ECONOMIA.md` (saldo mensal) |
| §68 | Construção (custo, prazo, mão de obra) | `TERRITORIOS.md` (nova construção/prazo), `ECONOMIA.md` (custo deduzido) |
| §69 | Mão de Obra | `TERRITORIOS.md` (mão de obra disponível) |
| §70 | População | `TERRITORIOS.md` (população alterada) |
| §71 | Custo de Soldado (manutenção) | `ECONOMIA.md` (despesa mensal) |
| §76 | Salários (civis, conselheiros, funcionários) | `ECONOMIA.md`, `P/[nome].md` (se contratado com salário) |

### 7.7 `comercio.md` (§72-75, 77-81)

| § | Mecânica | Arquivo(s) CAMPANHA/ |
|---|----------|----------------------|
| §72 | Caravanas Comerciais | `ECONOMIA.md` (SD, FSU), `DIPLOMACIA.md` (relação com parceiro comercial) |
| §73 | Riscos de Caravana (ataque, perda) | `MISSOES.md` (se escoltada), `ECONOMIA.md` (perda) |
| §74 | Mercado (preços, oferta/demanda) | `ECONOMIA.md` (preços alterados) |
| §75 | Caça, Pesca, Forrageio | `ECONOMIA.md` (FSU coletada) |
| §77 | Tributos (suserano/vassalo) | `ECONOMIA.md`, `DIPLOMACIA.md` (relação) |
| §78 | Isenções e Privilégios Comerciais | `DIPLOMACIA.md`, `ECONOMIA.md` |
| §79 | Suprimentos (FSU, comida, rações) | `ECONOMIA.md`, `TERRITORIOS.md` (armazenamento) |
| §80 | Armazenamento e Logística | `TERRITORIOS.md` (capacidade de armazenamento) |
| §81 | Mercado Negro | `ECONOMIA.md`, `DIPLOMACIA.md` (relações ilícitas) |

### 7.8 `pol_diplomacia.md` (§82-84, 89-91)

| § | Mecânica | Arquivo(s) CAMPANHA/ |
|---|----------|----------------------|
| §82 | Opinião e Relações entre Casas | `DIPLOMACIA.md` |
| §82.4 | Alianças Secretas | `DIPLOMACIA.md`, `MISSOES.md` (se operação secreta envolvida) |
| §82.5 | Acordos nos Bastidores | `DIPLOMACIA.md` |
| §83 | Promessas (feitas, quebradas, cumpridas) | `DIPLOMACIA.md` |
| §84 | Vassalagem | `DIPLOMACIA.md`, `P/[nome].md` (se personagem vassalo de alguém) |
| §89 | Casamento (arranjo, dote, aliança) | `P/[nome].md` (cônjuge), `DIPLOMACIA.md` (aliança), `LINHA_DO_TEMPO.md` |
| §90 | Romance (score, progresso, eventos) | `P/[nome].md` (score de romance) |
| §91 | Bailes e Eventos Sociais | `DIPLOMACIA.md` (novas relações), `P/[nome].md` (reputação social) |

### 7.9 `pol_heranca.md` (§85-88)

| § | Mecânica | Arquivo(s) CAMPANHA/ |
|---|----------|----------------------|
| §85 | Herança e Sucessão (morte do lord, partilha) | `P/[nome].md` (título, herdeiro), `DIPLOMACIA.md` (legitimidade), `TERRITORIOS.md` (terras), `LINHA_DO_TEMPO.md` |
| §86 | Gravidez (detecção, duração, parto) | `P/[nome].md` (mãe: gravidez; filho: `P/novo.md`), `LINHA_DO_TEMPO.md` |
| §87 | Guarda e Tutela | `P/[nome].md` (guardião/tutelado), `DIPLOMACIA.md` |
| §88 | Herdeiros e Linhagem | `P/[nome].md` (herdeiros), `DIPLOMACIA.md` (reivindicações) |

### 7.10 `pol_intriga.md` (§92-98)

| § | Mecânica | Arquivo(s) CAMPANHA/ |
|---|----------|----------------------|
| §92 | Rede de Espiões (estabelecer, expandir) | `MISSOES.md` (rede, agentes, custo) |
| §93 | Operação de Espionagem (missão) | `MISSOES.md` (missão ativa), `DIPLOMACIA.md` (se descoberto) |
| §94 | O Conspirador (Schemer — detecção de tramas) | `MISSOES.md` (investigação), `CONSELHO.md` (suspeitos), `DIPLOMACIA.md` (acusações) |
| §95 | Assassinato | `MISSOES.md` (operação), `P/[nome].md` (morte/sobrevivência), `DIPLOMACIA.md` (suspeita), `LINHA_DO_TEMPO.md` |
| §96 | A Maldição do Parricida (Kinslayer) | `P/[nome].md` (trait: Kinslayer), `DIPLOMACIA.md` (-3 Opinião), `LINHA_DO_TEMPO.md` |
| §97 | Conselho do Lorde | `CONSELHO.md` (disposição, lealdade, assentos) |
| §98 | Schemer (Conspirador) | `MISSOES.md`, `CONSELHO.md`, `DIPLOMACIA.md` |

### 7.11 `mundo.md` (§99-103)

| § | Mecânica | Arquivo(s) CAMPANHA/ |
|---|----------|----------------------|
| §99.7-12 | Terreno e Modificadores Ambientais | `ESTADO_ATUAL.md` (modificador ativo), `TERRITORIOS.md` (se novo terreno), `ECONOMIA.md` (se afeta produção) |
| §99.16 | Navegação e Perder-se | `ESTADO_ATUAL.md` (atraso, rota alterada), `P/[nome].md` (exaustão) |
| §100 | Rios e Hidrovias | `ESTADO_ATUAL.md` (rota fluvial), `TERRITORIOS.md` (se nova rota comercial) |
| §101 | Introduções (encontro com culturas) | `DIPLOMACIA.md` (primeira impressão), `ESTADO_ATUAL.md` |
| §102 | Tribos (introdução, relação) | `DIPLOMACIA.md` (relação tribal), `MISSOES.md` (se em contato/negociação) |
| §102.4-7 | Lugares Ocultos (geração 4×1d6) | `TERRITORIOS.md` (descoberta geográfica), `MISSOES.md` (exploração pendente) |
| §102.12 | Escalada Tribal (3 estágios: briga → guerra) | `DIPLOMACIA.md` (opinião -3, -6, guerra declarada), `MISSOES.md` (se em campanha) |
| §103 | Nômades (Chamado da Grama, Laço com Montaria, Confiança) | `P/[nome].md` (laço com montaria, confiança), `DIPLOMACIA.md` (relações nômades) |

### 7.12 `eventos.md` (§104-121)

| § | Mecânica | Arquivo(s) CAMPANHA/ |
|---|----------|----------------------|
| §104 | Eventos Gerais (tabela de eventos) | `ESTADO_ATUAL.md` (evento atual), `LINHA_DO_TEMPO.md` (se relevante) |
| §105 | Prisão, Fuga, Rendição, Briga de Sangue, Troca de Prisioneiros | `P/[nome].md` (status: preso/solto/ferido), `MISSOES.md` (plano de fuga), `DIPLOMACIA.md` (Blood Feud -3, troca), `TERRITORIOS.md` (rendição), `ECONOMIA.md` (resgate) |
| §106.2-4 | Ferimentos e Cirurgia | `P/[nome].md` (ferimentos, nível de cura), `ECONOMIA.md` (custo de cirurgia) |
| §106.5 | Ervanário (coleta de ingredientes) | `ECONOMIA.md` (ingredientes coletados), `P/[nome].md` (poções em posse) |
| §106.6 | Lesões Permanentes (tabela 2d6) | `P/[nome].md` (stat permanentemente alterada — Força, Agilidade, Visão, etc.) |
| §106.7 | Doenças e Infecções | `P/[nome].md` (status doente), `TERRITORIOS.md` (se epidemia no feudo), `ECONOMIA.md` (custo de tratamento) |
| §106.8 | Poções e Crafting Alquímico | `ECONOMIA.md` (materiais consumidos), `P/[nome].md` (itens criados) |
| §107 | Religião (Fé, Bênção, Excomunhão, Conversão, Guerra Santa) | `DIPLOMACIA.md` (relação com clero/fé), `P/[nome].md` (status religioso), `ESTADO_ATUAL.md` (evento religioso) |
| §108 | Seitas Secretas (fundar, crescer, purgar) | `MISSOES.md` (investigação), `TERRITORIOS.md` (presença da seita), `ECONOMIA.md` (custos/renda), `DIPLOMACIA.md` |
| §109 | Festivais e Celebrações | `ECONOMIA.md` (custo/renda do festival), `DIPLOMACIA.md` (opinião), `ESTADO_ATUAL.md`, `LINHA_DO_TEMPO.md` |
| §110 | Herdeiro Oculto | `P/novo.md` (novo personagem criado), `MISSOES.md` (busca pelo herdeiro), `TERRITORIOS.md` (reivindicação), `ECONOMIA.md` (custos) |
| §111 | Falso Pretendente | `MISSOES.md` (investigação da alegação), `DIPLOMACIA.md` (apoio político), `TERRITORIOS.md` (reivindicação), `LINHA_DO_TEMPO.md` |
| §112 | Viajante Cego (raro: 1/1000 por ano) | `LINHA_DO_TEMPO.md`, `TERRITORIOS.md` (mapas/rotas), `ECONOMIA.md` (comércio afetado) |
| §113 | Ano Quente (raro) | `ESTADO_ATUAL.md` (clima alterado), `TERRITORIOS.md` (colheita), `ECONOMIA.md` (produção) |
| §114 | Migração do Urso da Neve (raro) | `TERRITORIOS.md` (recurso natural), `ECONOMIA.md` (comércio de peles), `LINHA_DO_TEMPO.md` |
| §115 | Eldric, o Dragão Negro (raro) | `P/[nome].md` (encontro), `TERRITORIOS.md` (destruição), `ECONOMIA.md`, `LINHA_DO_TEMPO.md` |
| §116 | Os Cinquenta (força especial) | `MISSOES.md` (missão atribuída), `TERRITORIOS.md`, `DIPLOMACIA.md` (reputação) |
| §117 | Infiltração de Pequena Força | `MISSOES.md` (operação), `TERRITORIOS.md` (brecha explorada) |
| §118 | Rumores (geração, propagação, precisão) | `ESTADO_ATUAL.md` (qualidade da informação disponível ao jogador) |
| §119-120 | Reputação e Apelidos | `P/[nome].md` (reputação alterada, novo apelido), `DIPLOMACIA.md` (fama entre casas), `ECONOMIA.md` (se afeta comércio/contratação) |
| §121 | Rendição Negociada | `TERRITORIOS.md` (controle transferido), `DIPLOMACIA.md` (termos da rendição), `ECONOMIA.md` (indenização/tributo) |

### 7.13 NENHUM estado muda — referência pura

| Arquivo REGRAS/ | § | Motivo |
|-----------------|---|--------|
| `certeza.md` | 1-6 | Fundamentos, Modo Novelo, Filosofia, Sistema Oculto — nenhum estado mutável |
| `criacao.md` | 14 | Criação inicial de personagem (personagem ainda não existe no mundo) |
| `profissoes.md` | 14.15-34 | Apenas escolha de profissão durante criação |
| `nomes.md` | 15-16 | Tabelas de geração de nomes — consulta pura sem efeito colateral |
