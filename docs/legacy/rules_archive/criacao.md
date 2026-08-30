# Book II: Character Creation — Complete Reference

**Source:** V.4.7 Age Of Shattered Oaths — Pages 48-77  
**Extraction:** `/tmp/book2_character.txt` (line 6481–11019 of full PDF text)  
**Total Sections:** PART 14 (14.0-14.14, 14.35-14.38) -- Ruler Flow + Quick Start

---

# PART 14: CHARACTER CREATION — Pages 48-68

## 14.0 Choose Your Archetype
- **Race Restriction:** Humans only.

| Archetype | Type | Description |
|-----------|------|-------------|
| Noble Ruler | Landed | You hold land by blood or conquest. Castles, villages, peasants who owe you grain and service. |
| Landed Knight | Landed | You have a sword, a horse, a name, and a small holding. Not a lord, but you have land. |
| LANDLESS | Landless | You wander with sword and followers. Coin, survival, or a cause drives you. |
| ARTIFICER | Landless | You shape metal and fire. The forge is your domain. |

**Branching:**
- If Ruler Archetype (Noble Ruler / Landed Knight) → Run **RULER FLOW**
- If Landless Archetype → Run **LANDLESS FLOW** (Per Patch 8.55 — Unified Landless Profession Selection)
- If Artificer Archetype → Run **ARTIFICER FLOW**

---

# BRANCH 2: LANDLESS FLOW

## 14.15 Step 0 — Choose Your Profession

See `profissoes.md` §14.15 for the full list of 19 Landless Professions.

**Flow:**
1. Choose profession [1-19] from `profissoes.md` §14.15
2. Follow the profession-specific flow in `profissoes.md` §14.16-14.34
3. Each profession defines: starting warband, equipment, reputation, treasury, food, supplies
4. Record character sheet per profession template

**Soldiers:** 2d6 + 10 (per profession type)
**Treasury:** 80-200 SD (per profession)
**Reputation:** As chosen per profession

---

# BRANCH 3: ARTIFICER FLOW

## 14.20 ARTIFICER FLOW (Per Patch 7.15)

The Artificer is a landless crafter who shapes metal, wood, and fire. Unlike other landless professions, the Artificer has a dedicated workshop progression.

### Step 1 — Choose Artificer Specialty

| Specialty | Focus | Starting Tool |
|-----------|-------|---------------|
| Weaponsmith | Blades, axes, polearms | Hammer, anvil, forge (portable) |
| Armorer | Plate, chain, shields | Hammer, anvil, rivets, leather |
| Siege Engineer | Engines, fortifications | Saw, auger, measuring tools |
| General Smith | Tools, horseshoes, repairs | Full kit, versatile |

### Step 2 — Starting Workshop

| Workshop Type | Quality | Capacity | Cost |
|---------------|:-------:|:--------:|:----:|
| Portable Forge | Basic | 1 project/week | 30 SD |
| Village Smithy | Standard | 2 projects/week | 100 SD |
| Town Workshop | Fine | 3 projects/week | 250 SD |

### Step 3 — Starting Resources

| Resource | Value |
|----------|-------|
| Silverdew (SD) | 100 SD |
| Food (FSU) | 4 FSU |
| Raw Materials | 10 timber, 15 iron |
| Tools | Hammer, anvil, tongs, bellows (basic) |
| Reputation | "Unknown" or as chosen |

### Step 4 — Starting Projects

| Project | Materials | Time | Result |
|---------|:---------:|:----:|--------|
| Repair weapons | 1 iron | 1 day | 5 weapons restored |
| Craft tools | 2 iron | 2 days | 10 tools |
| Simple blade | 3 iron | 3 days | Common-quality sword |
| Horseshoes (set) | 1 iron | 1 day | 4 horses shod |

### Step 5 — Workshop Progression

| Stage | Cost | Requirements | Benefits |
|-------|:----:|-------------|----------|
| Portable Forge | 30 SD | None | Basic projects |
| Village Smithy | 100 SD | 10 timber, 5 iron | Standard projects, 1 apprentice |
| Town Workshop | 300 SD | 30 timber, 15 iron | Fine projects, 2 apprentices |
| Master Forge | 800 SD | 50 timber, 30 iron, reputation | Masterwork projects, 3 apprentices |

### Step 6 — Artificer Special Skills

| Skill | Effect | Learn DC |
|-------|--------|:--------:|
| Weapon Mastery | +1 quality on weapons | 5 |
| Armor Mastery | +1 AC on armor crafted | 5 |
| Material Efficiency | -1 iron cost per project | 6 |
| Quick Forge | Half time on standard projects | 6 |
| Masterwork | Chance to create High-Grade item (1d6: 6) | 7 |

---

Now let me add the missing branches to criacao.md. I'll add them after the Ruler Flow and before the Quick Start section.</think>

<｜DSML｜tool_calls>
<｜DSML｜invoke name="edit">
<｜DSML｜parameter name="filePath" string="true">/mnt/c/Projetos/RPG_DE_MESA/REGRAS/criacao.md

## 14.1 Step 1 — Name & House
**Fields:** Character name, House name, Age, Physical appearance (brief), Gender  
**Valid Input Format:** `"Name: [name], House: [house], Age: [number], Appearance: [description], Gender: [male/female/other]"`

## 14.2 Step 2 — Choose Starting Region

| Region | Characteristics |
|--------|----------------|
| Central Plains | Farmland, open terrain, noble estates |
| River Forests | Thick forests, rivers, excellent ambush terrain |
| Southern Mountains | Rocky terrain, passes, highland keeps |
| Northern Snowlands | Frozen plains, tundra forests, long winters |

No penalty region — each has different opportunities.

## 14.3 Step 2.5 — Choose Your Cultural Tradition (Per Patch 8.01)

### CENTRAL PLAINS
| Tradition | Description |
|-----------|-------------|
| Heartland Nobility | Traditional lords, honor-bound, agricultural |
| Plains Riders | Horse-riding herders, follow the herds, mobile |
| Riverbank Settlers | Mixed farming and fishing, pragmatic |

### WESTERN RIVERS
| Tradition | Description |
|-----------|-------------|
| River Lords | Control the waterways, tolls, and trade |
| Marsh Dwellers | Live in the delta, hidden, self-sufficient |
| Boat People | Live on the water, nomadic rivermen |

### EASTERN FORESTS
| Tradition | Description |
|-----------|-------------|
| Hill Fort Dwellers | Settled, defensive, ancient lineages |
| Deep Forest Folk | Semi-nomadic, hunters, spirit-guided |
| River Forest People | Canoe culture, fishing, trading |

### SOUTHERN MOUNTAINS
| Tradition | Description |
|-----------|-------------|
| High Clan | Mountain fortresses, clan law, ancestral oaths |
| Valley Farmers | Sheltered valleys, peaceful, self-contained |
| Pass Guardians | Control the routes, tolls, wary of outsiders |

### NORTHERN SNOWLANDS
| Tradition | Description |
|-----------|-------------|
| Fjord Dwellers | Coastal, fishing, longship raids |
| Taiga Hunters | Follow the game, hardy, communal |
| Hold Folk | Fortified settlements, survival-focused |

## 14.4 Step 3 — Define Your Holding's Position
**Fields:** Direction inside region (north/south/east/west/center), Distance from something meaningful  
**Example:** `"North, six days from the border"` or `"East, two days from the river"`

## 14.5 Step 4 — Holding Type

| Type | Description |
|------|-------------|
| Castle | Military seat |
| Fortified Town | Trade and militia power |
| Bastion | Border war seat |
| Walled City | Wealth and politics |

## 14.6 Step 5 — Starting Equipment by Holding

| Holding | Equipment |
|---------|-----------|
| Castle | Heavy personal armor, martial weapon (sword/mace/axe), shield, warhorse or pack horse |
| Fortified Town | Medium armor, sidearm (sword/spear), light shield, riding horse |
| Bastion | Reinforced armor, polearm or axe, no warhorse, travel gear |
| Walled City | Decorated armor, sword, fine cloak, riding horse |

## 14.7 Step 6 — House Heraldry
**Banner Field Colors:** Red, Black, Blue, Green, White, Custom (describe)  
**House Symbols:** Lion, Stag, Sword, Raven, Crown, Custom (describe)  
**Optional:** House motto (short phrase)  
**Example:** `"Red field with sword. Motto: 'Steel Before Oath'"`

## 14.8 Step 7 — Starting Money (Per Patch 7.1)

| Holding Type | Silverdew (SD) | Food (FSU) | Materials (SU) | Equipment Quality |
|-------------|---------------|-----------|---------------|-------------------|
| Castle | 400 SD | 8 FSU | 20 timber, 10 iron | Standard (Common) |
| Fortified Town | 600 SD | 12 FSU | 15 timber, 5 iron, 5 stone | Standard (Common) |
| Bastion | 300 SD | 10 FSU | 30 timber, 15 iron, 10 stone | Standard, reinforced |
| Walled City | 800 SD | 20 FSU | 25 timber, 10 iron, 15 stone | Fine (may include High-Grade) |

## 14.9 Step 7A — Backstory Resource Modifiers (Per Patch 7.1)
**Ruler Backstory Modifiers (Roll 1d6):**

| Roll | Backstory Element | Resource Modifier |
|------|------------------|-------------------|
| 1 | Born to wealth | +200 SD starting treasury |
| 2 | Gained holding through conquest | +50 SD loot, but -2 FSU (land damaged) |
| 3 | Master warrior who taught you | Personal weapon is High-Grade quality |
| 4 | Fears losing family | +1d3 family members as retainers (NPCs) |
| 5 | Soldiers follow out of loyalty | +10 starting soldiers (no equipment cost) |
| 6 | Inherited from revered parent | +100 SD, +1 heirloom (roll on Rare Items table) |

## 14.10 Step 8 — Optional Backstory (Immersion Reward)
Optional fields: Where you were born, How you gained the holding, Who taught you to fight, What you fear losing, Why soldiers follow you.  
No mechanical bonuses.

## 14.11 Step 9 — Flavor Origin (Immersion Reward)
Optional: one true detail about your land. No stat bonus.

## 14.12 Step 9B — Flavor Origin Resource Modifiers (Per Patch 7.1)

| Flavor Detail Example | Game Effect |
|----------------------|-------------|
| "My lands flood every spring." | +1 FSU per year (fertile soil), but flood risk |
| "My forests are full of elk." | +1 FSU from hunting, +1 fur per season |
| "My hold guards an old bridge." | +5 SD/month toll income |
| "The wind never stops here." | -1 travel time for ships, +1 to weather rolls |
| "Our walls are built from black stone." | +1 AC to fortifications |
| "We move at night." | +1 to ambush rolls |
| "The cave has a hidden spring." | Unlimited fresh water during siege |
| "The locals leave food for us." | +1 FSU per week from tributes |

## 14.13 Step 10 — Choose Starting Force

| Tier | Soldiers | Special |
|------|---------|---------|
| Light Levy | 40 | Faster mobilization, scouting bonus |
| Standard Levy | 60 | Balanced |
| Heavy Levy | 80 | Battle advantage, slower mobilization |

## 14.14 Ruler Flow Complete — Character Sheet
Record: Name, House, Archetype: Ruler, Region, Cultural Tradition, Holding (Type), Position, Equipment, Banner, Motto, Treasury (SD), Food (FSU), Materials (SU), Force (___ soldiers [Tier] Levy), Backstory notes, Flavor detail.

---

## PART 14.35 — QUICK START PRE-GENERATED CHARACTERS (Per Patch 8.02)

### PATH A — THE BORDER LORD (Ruler)
| Field | Value |
|-------|-------|
| Name | Lord Alric of Grey Keep |
| House | Stormcrown |
| Age | 34 |
| Appearance | Tall, broad-shouldered, grey-streaked hair, scarred hands |
| Gender | Male |
| Region | Central Plains |
| Culture | Heartland Nobility |
| Holding Type | Bastion (Grey Keep) |
| Position | Three days east of River Caedor, where the hills meet the plains |
| Equipment | Heavy armor (plate), sword, shield, warhorse |
| Banner | Silver wolf on deep blue field |
| Motto | "We Hold the March" |
| Treasury | 300 SD |
| Starting Force | 60 soldiers (Standard Levy) |
| Food | 8 FSU |
| Supplies | 20 timber, 10 iron |
| Backstory | "My father held this pass against three invasions. I will not be the one who loses it." |
| Flavor Detail | "The walls of Grey Keep are built from stone that weeps in winter." |

### PATH B — THE HEIR'S SWORD (Landless — Exiled Noble)
| Field | Value |
|-------|-------|
| Name | Kaelen |
| Title | "The Seeker" |
| Age | 27 |
| Appearance | Lean, dark-haired, mountain-bred, watchful eyes |
| Gender | Male |
| Region | Southern Mountains |
| Culture | High Clan |
| Warband Type | Exiled Retinue |
| Warband Size | 40 loyal soldiers |
| Base Type | Ruined Watchtower |
| Position | Two days south of the old mountain road, overlooking the hidden valleys |
| Equipment | Sword (fine), leather armor, no mount |
| Reputation | "The Exiled" (known to be searching for something) |
| Banner | Simple sigil — a broken crown on grey |
| Treasury | 150 SD |
| Food | 4 FSU |
| Supplies | 10 timber, 5 iron |
| Motivation | "My father served the old king. Before he died, he whispered of a daughter who survived." |
| Flavor Detail | "The watchtower has a clear view of the pass — and a hidden spring inside." |

### PATH C — THE MERCENARY CAPTAIN (Landless — Mercenary)
| Field | Value |
|-------|-------|
| Name | Sera Vance |
| Title | "Captain of the Free Company" |
| Age | 31 |
| Appearance | Wiry, sun-browned, quick smile, scarred knuckles |
| Gender | Female |
| Region | River Forests |
| Culture | River Forest People |
| Warband Type | Mercenary Company |
| Warband Size | 50 soldiers |
| Base Type | Traveling Warband (no fixed base) |
| Equipment | Bow, short sword, leather armor, riding horse |
| Reputation | "Reliable" (keeps contracts, doesn't cheat) |
| Banner | Green field with silver arrows |
| Treasury | 200 SD |
| Food | 3 FSU |
| Supplies | 5 timber, 3 iron |
| Motivation | "One thousand silver and a hundred swords. Then I'm done. Then I buy land." |
| Flavor Detail | "We move at night. We know every path in these woods." |

### PATH D — THE STEPPE RIDER (Nomad)
| Field | Value |
|-------|-------|
| Name | Temur of the Utemar |
| Title | "Khan's Son" |
| Age | 24 |
| Appearance | Sun-darkened, braided hair, bow-calloused fingers |
| Gender | Male |
| Region | Central Plains (Northern) |
| Culture | Plains Riders |
| Clan | Utemar (Horse People) |
| Clan Size | Medium (600 people, 100 warriors) |
| Personal Warband | 40 horse archers |
| Seasonal Location | Summer Gathering north of Hollowford |
| Tactic | Cloud of Arrows |
| Reputation | The Generous |
| Totem | Running Horse |
| Treasury | 100 SD |
| Food | 8 FSU (from herds) |
| Horses | 200 clan horses, 40 warhorses |
| Motivation | Protect the People |
| Flavor Detail | "The grass is our sea. The horse is our wave." |

### PATH E — THE FOREST PEOPLE (Nomad)
| Field | Value |
|-------|-------|
| Name | Winona of the Elkhan |
| Title | "Sachem's Daughter" |
| Age | 22 |
| Appearance | Long dark hair, quillwork on her arms, quiet presence |
| Gender | Female |
| Region | Eastern Forests |
| Culture | Deep Forest Folk |
| Band | Elkhan (Deer People) |
| Band Size | Medium (300 people, 80 warriors) |
| Personal Warband | 40 forest warriors |
| Seasonal Location | Summer Camp in high forest clearings |
| Tactic | Ambush Masters |
| Reputation | The Wise |
| Totem | White Deer |
| Treasury | 80 SD |
| Food | 6 FSU |
| Canoes | 2 trade canoes, 1 war canoe |
| Furs | 20 beaver pelts in storage |
| Motivation | Honor the Ancestors |
| Flavor Detail | "The trees are my walls. The river is my road." |

---

## PART 14.36 — UNIVERSAL STARTING RESOURCES (Per Patch 7.1)

| Resource | Ruler Start | Landless Start |
|----------|-------------|----------------|
| Silverdew (SD) | As per Holding Type + Backstory | As per Warband Type + Backstory |
| Food (FSU) | As per Holding Type + Flavor | As per Warband Type + Flavor |
| Raw Materials (SU) | As per Holding Type | As per Warband Type |
| Soldiers | As per Levy choice (40/60/80) | As per Warband Type (2d6 + 10) |
| Reputation | "Unknown" or as chosen | As per Reputation choice |
| Quality Modifiers | Possible from Backstory | Possible from Backstory |

---

## PART 14.37 — CHARACTER CREATION QUESTION LOCK

1. The system will ask ONE question at a time
2. Only the current step's question will be shown
3. Only valid options for that step will be listed
4. Do not provide answers for future steps
5. Do not add extra details beyond what is asked
6. Each step requires explicit confirmation before proceeding
7. If you provide multiple answers at once, ONLY THE CURRENT STEP will be processed. The rest will be ignored, and you will be asked again for the correct input.

---

## PART 14.38 — PERSONAL ARMOR STYLE (Per Patch 7.14)

| Style Element | Examples | What It Says |
|--------------|----------|-------------|
| Helmet Design | Open-faced, full helm, nasal guard, winged, crowned, animal-shaped | Approachability, protection, showmanship |
| Cape/Cloak | Fur-lined, embroidered, plain, battle-torn, house colors | Wealth, practicality, history |
| Armor Finish | Polished mirror, battle-scarred, painted, gilded, rusted | Pride, experience, wealth, humility |
| Chest Decoration | House sigil, religious symbol, personal motto, ancestral runes | Allegiance, faith, individuality |
| Pauldron Shape | Pointed, rounded, layered, spiked, asymmetrical | Aggression, tradition, uniqueness |
| Weapon Details | Grip wrap, pommel shape, blade engravings, tassels, color of leather | Personal taste, status |
| Shield Art | Full heraldic display, minimalist, battle-damaged, religious icon | House pride, practicality, faith |

**Mechanical Effect:** None. Purely flavor. NPCs will notice and remember.

---
