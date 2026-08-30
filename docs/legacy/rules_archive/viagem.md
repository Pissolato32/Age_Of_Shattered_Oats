# VIAGEM, NAVEGAÇÃO E CLIMA — Parts 7–13

**Source:** Age of Shattered Oaths Rulebook V.6.7.3
**Extracted from:** BOOK I: FOUNDATIONS (Parts 7–13)

---

## PART 7: DIRECTIONAL WORLD NAVIGATION (EXPANDED)

### 7.1 Navigation Rule
> All locations in the world must be described using directional travel and days of travel. No grid coordinates. No map positions. Only direction and time.

### 7.2 Location Format
**Format:** `DIRECTION + TRAVEL TIME + LANDMARK`

**Examples:**
- "Two days north of the river."
- "Three days east of the capital."
- "Half a day west of the monastery."
- "A week's ride south along the old road."
- "Three days' march through the forest, then another day to the pass."

### 7.3 Direction Types
**Valid directions:**
- North / South / East / West
- Upstream / Downstream (along rivers)
- Inland / Coastward
- Toward [Landmark]
- Via [Route]

> No diagonal directions (northeast, etc.) unless following a specific road or river that runs that way.

### 7.4 Landmark Rule
> Every location must be described relative to a known landmark.

**Landmarks include:** Rivers | Mountains | Forests | Roads | Settlements | Bridges | Passes | Ruins | Any named feature

> If a landmark is not known to the player, it cannot be used for navigation.

### 7.5 Prohibited Location Systems
The system must never use:
- Grid locations | Map coordinates | Numbered regions | Tile positions
- Zone identifiers | Sector codes | Hex coordinates | Any abstract positioning system

### 7.6 Map Immersion Rule
> If a map exists in the world, it is an in-world object.

It may be: Incomplete | Inaccurate | Out of date | Misleading | Drawn from hearsay
The player never sees an omniscient map. They see what their character has access to.

### 7.7 System Restriction
> The system must never track the player's position using coordinates internally. All tracking must use the same directional language presented to the player.

### 7.8 System Priority
> This navigation system overrides any other system that would use abstract positioning.

---

## PART 8: TRAVEL MEASUREMENT (EXPANDED)

### 8.1 Travel Measurement Rule
> All travel distances must be measured only in DAYS of travel. No other units.

### 8.2 Prohibited Distance Units
The system must never use: Kilometers (km) | Meters (m) | Miles | Yards | Leagues | Any real-world distance unit

### 8.3 Travel Description Format
All travel descriptions must use natural language:
- "A day's ride"
- "Three days' march"
- "A week's journey"
- "Half a day's walk"
- "From dawn to dusk"

### 8.4 Map Interpretation Rule
> If a player has a map that shows distances in real units, those units are converted to days based on typical travel speeds for that terrain.

**Example:** A map shows 50 miles to the next town. The system determines: "That's about 4-5 days' travel through these hills."

### 8.5 System Restriction
> The system may not track distances in real units internally. All internal tracking must use days.

### 8.6 Immersion Rule
> Players should never think in miles or kilometers. They should think in days, in landmarks, in the feel of the journey.

### 8.7 System Priority
> This measurement system overrides any other system that would use real-world distance units.

---

## PART 9: TRAVEL TIME CALCULATION (Per Patch 7.4)

### 9.1 Base Travel Time
Base travel time is measured in **days per 100 miles** of equivalent distance. This is an internal calculation only — players never see the miles.

### 9.2 Land Travel
Travel times vary by terrain, road quality, and weather. All times assume a party on foot with pack animals. **Mounted parties travel 25% faster on roads**, but same speed in rough terrain (horses slow down).

### 9.3 Terrain Travel Times (Per 100 miles equivalent)

| Terrain | Base Travel Time |
|---|---|
| Royal Road | 4 days |
| Maintained Road | 5 days |
| Common Road | 6 days |
| Poor Road | 8 days |
| Plains (trackless) | 7 days |
| Hills | 9 days |
| Forest (light) | 8 days |
| Forest (deep) | 12 days |
| Mountains (pass) | 10 days |
| Mountains (trackless) | 15 days |
| Swamp/Marsh | 14 days |
| Snowlands (winter) | 20 days |
| Snowlands (summer) | 12 days |

### 9.4 Road Speed Effects

| Road Condition | Speed Modifier |
|---|---|
| Ruined | +50% travel time |
| Poor | +25% travel time |
| Common | Base (0%) |
| Maintained | −20% travel time |
| Royal Road | −40% travel time |

### 9.5 River Travel
River travel times depend on direction and vessel.

| Vessel Type | Speed |
|---|---|
| Raft | 15 miles/day equivalent |
| Small Boat (rowed) | 25 miles/day equivalent |
| River Barge | 20 miles/day equivalent |
| Canoe | 30 miles/day equivalent |

### 9.6 River Ship Speed Effects

| Direction | Speed Modifier |
|---|---|
| Downstream | −40% travel time |
| Upstream | +40% travel time |
| Poling (shallow) | +10% travel time |
| Towing (bank) | +20% travel time |

### 9.7 Rounding Rule
> All fractional travel time rounds up to the nearest half-day.

**Example:** 1 day − 25% = 0.75 days → Rounded = 1 day

### 9.8 Final Travel Time Formula
```
Final Travel Time = Base Travel Time ± Road/River Modifier ± Weather Modifier
```

### 9.9 Narrative Presentation
> The system never presents these calculations. It only presents the result.

**Example:** "After five days of hard marching through the hills, you see the towers of Stonebridge on the horizon."

---

## PART 10: PERSISTENT WORLD LOCATION TRACKING (EXPANDED)

### 10.1 Core Rule
> The player character always has a true physical position in the world. It is:
- Tracked silently
- Updated after every movement
- Used to calculate travel time, encounters, supply use, and reactions
- Shown only as a location line on the character sheet

### 10.2 Character Sheet Addition
**Current Location format:** `Region — Sub-region — Landmark — [X] days from [Nearest Town], [Y] days from [Nearest Castle], [Z] weeks from [Regional Capital]`

**Example:**
"Iron Coast — Blackroad Hills — 3 days south of Carrion Ford — 5 days from Stonebridge, 2 weeks from Velrinport, 5 weeks from the Iron Seat"

### 10.3 Travel Time System (Silent)
All travel times are calculated silently based on:
- Starting location | Destination | Route chosen | Terrain | Weather | Party composition | Season

The player never sees the calculation — only the result.

### 10.4 Distance Consequences
Distance affects:
- How long messages take to arrive
- How long armies take to march
- How much supply is consumed
- Whether reinforcements can arrive in time
- What rumors reach the player
- What the player can respond to

### 10.5 Location Affects Combat
Combat resolution considers:
- Terrain type | Weather | Time of day | Season | Local features (rivers, hills, forests, walls)
- These are applied silently — the player experiences them narratively.

### 10.6 Supply & Hunting Link
Location determines:
- What can be foraged | What can be hunted | What can be purchased
- What trade goods are available | What local resources exist

### 10.7 Intelligence Range
Location determines:
- What rumors reach the player
- How long intelligence takes to arrive
- What can be scouted
- What can be observed

### 10.8 World Memory
> The system remembers where the player has been. Future descriptions may reference past visits.

**Example:** "You return to Stonebridge. The innkeeper recognizes you and offers you the same room."

### 10.9 Design Philosophy
> This system exists to make the world feel real. Distance matters. Location matters. The player cannot be everywhere at once. Choices about where to be are as important as choices about what to do.

---

## PART 11: PERSISTENT TIME DISPLAY SYSTEM

### 11.1 Goal
> Every narrative output should ground the player in time. Not as a game mechanic, but as a sensory detail.

### 11.2 Time Header Trigger
At the start of every narrative output, the system displays a narrative time header:

> A soft morning light filters through the clouds. The chill of autumn lingers in the air.
> **DATE:** Day 12 of Ashfall, Year 342
> **LOCATION:** Southern Edge of the River Forests

### 11.3 Time Advances After Actions

| Action | Time Passed |
|---|---|
| Minor conversation | 10–20 minutes |
| Major conversation | 30–60 minutes |
| Skirmish | 2–4 hours |
| Battle | 4–10 hours |
| March (per day) | 1 day |
| Camp (rest) | 1 night |
| Wait (specified) | As specified |

### 11.4 Time of Day Categories

| Hours | Time Label |
|---|---|
| 04:00–06:00 | Pre-Dawn |
| 06:00–08:00 | Dawn |
| 08:00–12:00 | Morning |
| 12:00–15:00 | Midday |
| 15:00–18:00 | Afternoon |
| 18:00–20:00 | Evening |
| 20:00–23:00 | Night |
| 23:00–04:00 | Deep Night |

### 11.5 Month System

| Month | Season |
|---|---|
| Frostwane | Winter |
| Deepfrost | Winter |
| Thawrise | Spring |
| Greening | Spring |
| Highsun | Summer |
| Highsun | Summer |
| Harvestfall | Autumn |
| Harvestfall | Autumn |
| Ashfall | Autumn |
| Ashfall | Autumn |
| Longdark | Winter |
| Longdark | Winter |

### 11.6 Day Progression
- Each day contains **24 hours**.
- When midnight passes: **Day +1**
- If day reaches the end of the month: **Month +1, Day resets to 1**

### 11.7 Scene Trigger Rule
A new scene begins when:
- Significant time passes
- Location changes significantly
- Major event occurs
- Player initiates new action

Each new scene gets a time header.

### 11.8 Player Ledger Integration
The player's ledger always shows:
- Current date
- Current season
- Current location
- This is the only persistent time display.

---

## PART 12: WEATHER & SEASONS (Per Patch 7.5)

### 12.1 Core Rule
> Weather and seasons are persistent world states. They are not flavor. They modify travel, food, combat, loyalty, and death.

Weather is **not uniform** across the continent — what is a mild winter in the Central Plains is a death sentence in the Northern Snowlands.

### 12.2 Climatic Zones Map

```
NORTHERN SNOWLANDS [PERMAFROST & DEEP SNOW]
         |
WESTERN RIVERS ←→ NOMAD STEPPE ←→ EASTERN FORESTS
 [NORTHERN SNOW]   [NORTHERN SNOW]   [NORTHERN SNOW]
 [SOUTHERN NO SNOW] [SOUTHERN NO SNOW] [SOUTHERN NO SNOW]
         |               |               |
         └───────┬───────┴───────┬───────┘
                 |               |
          CENTRAL PLAINS    CENTRAL PLAINS
          [WESTERN NO SNOW] [EASTERN NO SNOW]
                 |               |
                 └───────┬───────┘
                         |
                  SOUTHERN MOUNTAINS [NO SNOW—ONLY WIND]
```

### 12.3 Regional Snow Lines

| Region | Snow Line | Winter Snow Coverage | Notes |
|---|---|---|---|
| **Northern Snowlands** | Entire region | 100% — 3–6 feet deep | Permafrost year-round in far north |
| **Nomad Steppe** | Northern half | Northern 50% | South of the line = year-round grazing |
| **Western Rivers** | North of the Great Falls | Northern 40% | Southern 60% sees rain, not snow |
| **Eastern Forests** | North of the Old Great Road | Northern 50% | Southern half is temperate rainforest |
| **Central Plains** | No snow line | 0% normally | Snow once per generation (1d6×10 years) |
| **Southern Mountains** | No snow ever | 0% | Altitude + latitude = no snow, only wind |

### 12.4 Monthly Temperature & Precipitation Table

| Region | Spring (Thawtide) | Summer (Sunreach) | Autumn (Reapingfall) | Winter (Deepfrost) |
|---|---|---|---|---|
| **Northern Snowlands** | Thawing, muddy | Mild, bugs, green | Freezing, first snow | Deep snow, whiteouts, −40°F |
| **Nomad Steppe (North)** | Wet, grass returns | Warm, grazing | Cooling, dry | Snow, herds move south |
| **Nomad Steppe (South)** | Wet, grass | Hot, dry | Mild, dry | Cool, dry, no snow |
| **Western Rivers (North)** | Wet, flooding | Warm, humid | Cool, rain | Snow, frozen rivers |
| **Western Rivers (South)** | Wet, flooding | Hot, humid | Mild, clear | Rain, occasional frost |
| **Eastern Forests (North)** | Muddy, thawing | Warm, humid | Cool, foggy | Snow, frozen streams |
| **Eastern Forests (South)** | Rainy, green | Hot, humid | Mild, clear | Rain, fog, no snow |
| **Central Plains** | Green, windy | Hot, dry | Mild, harvest | Cold, windy, rare snow |
| **Southern Mountains** | Windy, cold | Cool, clear | Windy, freezing | Freezing winds, rivers ice over |

### 12.5 Revised Season Effects by Region

| Region | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|
| **Northern Snowlands** | Mud (+50% travel), rivers flood | Mosquito swarms (−1 morale), good hunting | Early snow, hunting peaks | Deep snow (+200% travel), foraging impossible, starvation risk |
| **Nomad Steppe (North)** | Green, herds return | Warm, grazing | Cooling, herds prepare | Snow (+75% travel), herds move south |
| **Nomad Steppe (South)** | Green, grazing | Hot, dry | Mild, grazing | Cool, dry, grazing continues |
| **Western Rivers (North)** | Floods (+100% river travel), roads mud | Warm, good trade | Cooling, first frost | Snow (+50% travel), rivers freeze (+100% land travel) |
| **Western Rivers (South)** | Floods (+50% river travel) | Hot, trade peaks | Mild, harvest | Rain, occasional ice |
| **Eastern Forests (North)** | Mud (+50% travel), floods | Warm, hunting good | Cooling, fog | Snow (+75% travel), hunting difficult |
| **Eastern Forests (South)** | Rain, green | Hot, humid | Mild, clear | Rain, fog, travel normal |
| **Central Plains** | Green, planting | Hot, dry, fire risk | Harvest, trade peaks | Cold, windy, snow 1-in-30 years |
| **Southern Mountains** | Windy, cold, passes clear | Cool, clear, best travel | Windy, freezing, passes closing | Freezing winds, rivers ice, travel +100%, no snow |

### 12.6 Revised Daily Weather Tables

#### Northern Snowlands (Winter)

| 1d6 | Weather | Effect |
|---|---|---|
| 1 | Clear, bitter cold | Travel +25%, frostbite risk |
| 2–3 | Light snow | Travel +50%, visibility reduced |
| 4 | Heavy snow | Travel +100%, foraging impossible |
| 5 | Blizzard | Travel +200%, cannot travel, 1d6 casualties if caught |
| 6 | Whiteout | Travel impossible, 2d6 casualties if caught outside |

#### Northern Snowlands (Summer)

| 1d6 | Weather | Effect |
|---|---|---|
| 1–2 | Clear, cool | Normal travel |
| 3–4 | Overcast | Normal |
| 5 | Rain | Mud (+25% travel) |
| 6 | Fog | +1 to ambush, −1 to navigation |

#### Nomad Steppe (North — Winter)

| 1d6 | Weather | Effect |
|---|---|---|
| 1 | Clear, cold | Travel normal |
| 2–3 | Light snow | Travel +25% |
| 4 | Heavy snow | Travel +75%, grazing impossible |
| 5 | Blizzard | Travel +150%, 1d6 casualties |
| 6 | Whiteout | Travel impossible, herds at risk |

#### Nomad Steppe (South — Winter)

| 1d6 | Weather | Effect |
|---|---|---|
| 1–3 | Clear, cool | Travel normal, good grazing |
| 4 | Overcast | Normal |
| 5 | Light rain | Travel +25% |
| 6 | Cold rain | Travel +25%, −1 morale |

#### Nomad Steppe (Summer)

| 1d6 | Weather | Effect |
|---|---|---|
| 1–3 | Clear, hot | Travel normal, grazing good |
| 4 | Overcast | Normal |
| 5 | Dry wind | −1 to ranged, +1 to fire spread |
| 6 | Thunderstorm | Travel +25%, lightning risk |

#### Western Rivers (North — Winter)

| 1d6 | Weather | Effect |
|---|---|---|
| 1–2 | Clear, cold | Travel normal |
| 3–4 | Light snow | Travel +25% |
| 5 | Heavy snow | Travel +50%, foraging −1 |
| 6 | Frozen fog | +2 to ambush, travel +25% |

#### Western Rivers (South — Winter)

| 1d6 | Weather | Effect |
|---|---|---|
| 1–3 | Rain | Travel +25% (mud) |
| 4–5 | Cold rain | Travel +25%, −1 morale |
| 6 | Freezing rain | Travel +50%, injury risk |

#### Eastern Forests (North — Winter)

| 1d6 | Weather | Effect |
|---|---|---|
| 1 | Clear, cold | Travel normal |
| 2–3 | Light snow | Travel +25%, +1 to tracking |
| 4 | Heavy snow | Travel +75%, foraging −2 |
| 5 | Snow with fog | Travel +50%, +2 to ambush |
| 6 | Freezing fog | Travel +25%, +2 to ambush, −1 morale |

#### Eastern Forests (South — Winter)

| 1d6 | Weather | Effect |
|---|---|---|
| 1–3 | Rain | Travel +25%, +1 to ambush |
| 4–5 | Fog | Travel +25%, +2 to ambush |
| 6 | Heavy rain | Travel +50%, rivers flood |

#### Central Plains (Winter)

| 1d6 | Weather | Effect |
|---|---|---|
| 1–3 | Cold, clear | Travel normal |
| 4 | Overcast, windy | Travel normal, −1 ranged attacks |
| 5 | Freezing rain (rare) | Travel +50%, injury risk |
| 6 | EXTREME WINTER EVENT | 1-in-30 years: Snow! Use Northern Snowlands light snow table |

#### Southern Mountains (Winter)

| 1d6 | Weather | Effect |
|---|---|---|
| 1 | Clear, freezing wind | Travel +50%, frostbite risk (wind chill) |
| 2 | Overcast, wind | Travel +50% |
| 3 | Gale force wind | Travel +100%, ranged fire impossible |
| 4 | Freezing gale | Travel +150%, 1d6 casualties if caught |
| 5 | Wind with ice crystals | Travel +100%, +2 to ambush, 1d3 casualties |
| 6 | The Mountain's Breath | Travel impossible, 2d6 casualties, rivers freeze solid |

#### Southern Mountains (Summer)

| 1d6 | Weather | Effect |
|---|---|---|
| 1–3 | Clear, cool | Travel normal, perfect weather |
| 4 | Overcast | Normal |
| 5 | Windy | Travel +25%, −1 ranged |
| 6 | Thunderstorm | Travel +25%, lightning risk, flash floods |

### 12.7 Revised Weather in Combat

| Weather | Combat Effect |
|---|---|
| **Light Rain** | −1d6 for bows, crossbows unaffected |
| **Heavy Rain** | −2d6 for bows, crossbows −1d6, melee −1 Initiative |
| **Fog** | −2 to ranged attacks (all), +1 to ambush, +1 to defense |
| **Light Snow** | −1d6 for bows, −1 Initiative all units |
| **Heavy Snow** | −2d6 for bows, −2 Initiative, +1 to ambush |
| **Blizzard/Whiteout** | Combat impossible (units must shelter) |
| **Freezing Wind (Mountains)** | −2 Initiative, fatigue builds faster, fire arrows useless |
| **Gale Force Wind** | Ranged fire impossible, −2 Initiative, disengage harder |
| **Extreme Cold (North)** | Fatigue in 1 hour instead of 4, casualties if unsheltered |
| **Dust Storm (Steppe)** | Travel impossible, −3 to ranged, units may get lost |
| **Thunderstorm** | Lightning strikes (1 in 6 chance per unit of casualties), rivers flood |

### 12.8 Revised Common Tongue Season Names

| Season | Common Name | Regional Variations |
|---|---|---|
| **Spring** | Thawtide — "When the ground remembers how to breathe." | North: "Mudbirth" — Steppe: "Green Rising" — South: "Greening" |
| **Summer** | Sunreach — "The season of long days and burning work." | North: "Mosquito Moon" — Steppe: "Burning Grass" — Mountains: "Clear Sky" |
| **Autumn** | Reapingfall — "When the land gives up its blood." | North: "First Frost" — Steppe: "Herd Gathering" — Forests: "Red Leaf" |
| **Winter** | Deepfrost — "When even crows go quiet." | North: "White Death" — Steppe (North): "Snow Wind" — Steppe (South): "Quiet Time" — Mountains: "The Breath" |

### 12.9 Revised Dark Season Names

| Season | Dark Name | Region Used |
|---|---|---|
| Spring | Mudbirth — "When graves open." | Northern Snowlands |
| Spring | Blood Thaw — "What the melt reveals." | Eastern Forests (North) |
| Summer | Firetime — "When men kill easy." | Central Plains (drought years) |
| Summer | Burning — "When the grass runs." | Nomad Steppe |
| Autumn | Redfall — "When the fields drink." | Western Rivers |
| Autumn | Herd's End — "When the killing starts." | Nomad Steppe (North) |
| Winter | Hungerwake — "When children learn silence." | Northern Snowlands |
| Winter | The Breath — "What the mountain exhales." | Southern Mountains |
| Winter | White Sleep — "When the steppe forgets." | Nomad Steppe (North) |

### 12.10 Extreme Weather Events by Region

| Region | Event | Frequency | Effect |
|---|---|---|---|
| **Northern Snowlands** | The Long Night | 1-in-10 years | Sun doesn't rise for 3 days, temperatures drop to −60°F |
| **Nomad Steppe (North)** | White Hurricane | 1-in-5 years | 3-day blizzard, entire herds can perish |
| **Nomad Steppe (South)** | Dust Plague | 1-in-8 years | 1-week dust storm, grazing ruined for season |
| **Western Rivers** | Great Flood | 1-in-7 years | Rivers rise 30 feet, entire valleys underwater |
| **Eastern Forests** | Fire Autumn | 1-in-12 years | Drought + wind = forest fires, whole region at risk |
| **Central Plains** | The Dry | 1-in-15 years | No rain for 2 years, famine follows |
| **Southern Mountains** | The Still Wind | 1-in-20 years | Wind stops. The silence kills. (−40°F with no warning) |
| **Any Region** | The False Thaw | Rare | Midwinter warm spell, then flash freeze — travel becomes ice rink (+200% time, constant injury risk) |

### 12.11 Climate Effects on Travel (Master Table)

| Region | Summer Speed | Winter Speed (No Snow Zone) | Winter Speed (Snow Zone) | Notes |
|---|---|---|---|---|
| **Northern Snowlands** | 1.0× | — | 2.0× – 4.0× | Winter travel is survival, not speed |
| **Nomad Steppe (North)** | 1.0× | — | 1.5× – 2.5× | Herds migrate south |
| **Nomad Steppe (South)** | 1.0× | 1.0× | — | Year-round grazing possible |
| **Western Rivers (North)** | 1.0× | — | 1.25× – 2.0× | Rivers freeze = faster land routes |
| **Western Rivers (South)** | 1.0× | 1.0× – 1.25× (rain) | — | Mud is the enemy |
| **Eastern Forests (North)** | 1.0× | — | 1.5× – 2.0× | Snow hides traps, reveals tracks |
| **Eastern Forests (South)** | 1.0× | 1.0× – 1.25× (rain) | — | Fog is constant |
| **Central Plains** | 1.0× | 1.0× (cold, clear) | ONCE PER GENERATION | Enjoy the sun |
| **Southern Mountains** | 1.0× – 1.25× (wind) | 1.5× – 2.5× (wind) | — | Wind is the killer, not cold |

### 12.12 Clothing & Survival Gear Requirements

| Region (Winter) | Required Gear | Effect if Unprepared |
|---|---|---|
| **Northern Snowlands** | Furs, multiple layers, shelter | Death in hours |
| **Nomad Steppe (North)** | Wool, felt, firewood | Frostbite, 1d6 casualties/week |
| **Western Rivers (North)** | Wool cloaks, dry boots | Illness, −1 morale/week |
| **Eastern Forests (North)** | Leather, wool, fire | Hypothermia risk |
| **Southern Mountains** | Windproof cloak, shelter | Wind exposure = 1d3 casualties/day |
| **Any Region (Extreme event)** | As above + luck | Roll 1d6 daily: 1–2 = 1d6 casualties |

### 12.13 The Warm Year — Cosmic Rare Event (Per Patch 7.21)
> Core Principle: Once or twice in a lifetime, the world changes. Winter does not come. The snows hold back. The rivers do not freeze. The passes remain open.

No one knows why. The priests have theories. The scholars have guesses. The common folk say the gods are hungry for war.

### 12.14 The Silent Roll
At the beginning of each year, the system makes a hidden roll — at the transition from Autumn to Winter (Day 1 of Deepfrost).

**The Roll: 1d100**

| d100 Roll | Result |
|---|---|
| **1** | **WARM YEAR** — No snow anywhere. Winter is mild across the entire continent. |
| **2–100** | Normal winter |

> Odds: 1% chance. Once every 100 years on average.
> The system lies. The gods lie. Probability lies. Some generations never see a Warm Year. Some see two. The average is once a century, but the roll is pure. No modifiers. No pity. No memory.

### 12.15 Effects of a Warm Year

| Effect | Description |
|---|---|
| **No Snow Anywhere** | Northern Snowlands: bare ground. Nomad Steppe (North): grazing continues. All snow lines: zero. |
| **Mild Temperatures** | Cold, but not deadly. Frostbite risk eliminated. |
| **Rivers Don't Freeze** | Western Rivers (North): no ice bridges. River travel continues all winter. |
| **Mountain Passes Open** | Southern Mountains: passes remain clear. No "closed for winter" season. |
| **Foraging Available** | All regions: foraging at Autumn rates, not Winter rates. |
| **Armies March** | No winter campaign restrictions. War can continue year-round. |
| **Crops?** | No — too cold to grow, but stored food lasts longer (less spoilage from freezing/thawing). |

**Regional Specifics:**

| Region | Normal Winter | Warm Year Winter |
|---|---|---|
| **Northern Snowlands** | Deep snow, travel +200%, foraging 0 | No snow, travel +0%, foraging 1 FSU |
| **Nomad Steppe (North)** | Snow, herds move south | No snow, herds stay, grazing continues |
| **Western Rivers (North)** | Snow, rivers freeze | No snow, rivers flow, boat travel possible |
| **Eastern Forests (North)** | Snow, hunting difficult | No snow, hunting normal |
| **Central Plains** | Rare snow (1-in-30) | No change (already rare) |
| **Southern Mountains** | Freezing winds, passes closed | Winds remain, but passes open |

### 12.16 Historical Warm Years
The system may generate rumors, legends, and historical records of past Warm Years.

- **Common Folk Say:** "Grandfather remembers the Warm Year..."
- **Scholars Note:** "The Warm Year of 287. Three campaigns launched in Deepfrost..."
- **Priests Whisper:** "The gods do not control the weather. They influence it..."

### 12.17 Strategic Implications

| Strategy | Normal Winter | Warm Year Winter |
|---|---|---|
| Campaign planning | Must end before Deepfrost | Can continue year-round |
| Fortress defense | "They can't attack in winter" | They can. They will. |
| Supply lines | Frozen rivers block supply | Rivers flow, supplies move |
| Enemy expectations | Enemy assumes safety | Enemy is caught off guard |
| Your own plans | You also assumed safety | Did you prepare to march? |

### 12.18 The Gods of War
The system does not explain why Warm Years happen. It offers possibilities through NPCs, through rumors, through the player's own interpretation.

- **The Crownbound Church says:** "The King was chosen by divine will. The weather obeys the rightful king..."
- **The Ashen Covenant says:** "The king fell because the realm was corrupt. The Warm Year is the world purging itself..."
- **The Silent Faith says:** "Power must not be centralized. The Warm Year is the world resisting control..."
- **The tribes say:** "The spirits are restless. They want stories. They want blood..."
- **The nomads say:** "The grass knows. When the grass does not freeze, it means the world is waiting..."

---

## PART 13: SESSION BOUNDARY PROTOCOL (Per Patch 6.3)

### 13.1 Core Principle
> A good story can be paused. A good game can be resumed. This protocol ensures that when you return to your campaign, you pick up exactly where you left off.

### 13.2 Ending a Session — The Pause Procedure
When you finish playing, take 5 minutes to complete:

**STEP 1 — Record the Moment**
In your Master Ledger, Section 14, write:
- Current date (Day, Month, Year)
- Current location
- Last thing that happened
- What you were about to do

**STEP 2 — Summarize Active Missions**
List any units that are:
- Away on missions (with expected return date)
- Under construction (with completion date)
- Waiting for something (scouts, messengers, births)

**STEP 3 — Note Pending Decisions**
- What choices were you considering?
- Who owes you an answer?
- What are you waiting to learn?

**STEP 4 — Write One Sentence**
> "When we return, I will..."

### 13.3 Starting a New Session — The Resume Procedure
When you sit down to play again:

1. **Read Your Last Sentence** — This is your anchor. This is what you wanted.
2. **Review Active Missions** — What's in progress? What's expected?
3. **Check the Calendar** — What date is it? What season?
4. **Read Your Notes** — Scan your Who's Who. Scan pending decisions.
5. **Begin** — The system asks: "You are [location] on [date]. Your last thought was [sentence]. What do you do?"

### 13.4 Session Log Template
```
SESSION LOG — SECTION 14
LAST SESSION — PAUSED ON: _____ / _____ / _____
CURRENT LOCATION: ______________________________________
LAST THING THAT HAPPENED:
________________________________________________________
ACTIVE MISSIONS:
• Unit: ______________ (Returns: Day ___ of _________)
• Unit: ______________ (Returns: Day ___ of _________)
• Construction: _______ (Completes: Day ___ of ______)
• Waiting for: _________________ (Expected: ________)
PENDING DECISIONS:
• ____________________________________________________
• ____________________________________________________
WHEN WE RETURN, I WILL:
________________________________________________________
```

### 13.5 Time Confirmation Protocol (Revised per Patch 6.3)
> **Core Principle:** The player should never lose track of time. Time should never advance beyond ONE WEEK without the player knowing and explicitly agreeing to it.

**The Rule:**
> **MAXIMUM AUTOMATIC ADVANCE = 7 DAYS**
> The system may never advance time more than one full week without player confirmation.

> **WEEKLY BOUNDARIES ARE CHECKPOINTS**
> Every 7 days, the Weekly World Turn runs. After each turn, the system MUST pause and present the results, regardless of the player's current activity.

> **AMBIGUOUS TIME = CONFIRMATION REQUIRED**
> Whenever the player says things like "I wait," "Let time pass," or "I travel," the system MUST ask: "How long do you wait/travel for? (e.g., 1 week, 2 weeks, until a specific event, or 'the entire way')"

**Long Journeys & The "Entire Way" Protocol:**
- If a journey takes longer than one week, the system defaults to breaking the journey into **weekly segments**.
- At the end of each week: pause, present summary, ask: "You have been traveling for [X] weeks. [Y] weeks remain. Do you wish to continue? (Yes/No)"
- **The "Entire Way" Exception:** If the player explicitly states "I ride the entire way," the system MUST confirm: "Confirm that you wish to skip the entire [X]-week journey in one go... Confirm? (Yes/No)"
- If confirmed: calculate total travel time, advance date, run Weekly World Turn for each week in batch, present cumulative results upon arrival.

**Event-Driven Waiting:**
- If the player waits for a specific event ("I wait until the snow melts"), the system calculates the time, then asks: "That will take approximately [X] weeks. Do you wish to wait this entire period, or do you want to check in weekly?"

> **NO SKIPPING WITHOUT CONSENT**
> The system may NEVER assume the player wants to skip time. Every week beyond the current must be explicitly approved.

### 13.6 Long Journey Protocol
When a player undertakes a journey longer than 2 weeks:

| Option | Trigger | Behavior |
|---|---|---|
| **A — Weekly Check-Ins (Default)** | Automatic | System pauses at end of each week, presents progress, asks "Continue? (Yes/No/Adjust course)" |
| **B — Compressed Journey** | Player: "I ride the entire way, tell me when I arrive" | System confirms duration, advances time in batch, presents arrival summary |
| **C — Montage Mode** | Player: "Montage the journey" | Condensed narrative of trip. Used only for routes the player has traveled before in safe conditions. |

### 13.7 Weekly World Turn Structure
Each week, the following occurs **in order**:

1. **Weather** — Determine weekly weather patterns
2. **Production** — Holdings generate resources
3. **Trade** — Caravans move, trade resolves
4. **Consumption** — Armies and populations consume food
5. **Movement** — Armies and agents move
6. **Events** — Random and scheduled events occur
7. **Rumors** — Information spreads
8. **Reports** — Summaries generated for player
9. **Pause** — System presents results and waits for player confirmation

---

**END OF BOOK I — FOUNDATIONS (Parts 7–13)**
