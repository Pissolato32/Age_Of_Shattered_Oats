# COMBATE E DUELOS — Parts 42-53, 62-64

> **Source:** Age of Shattered Oaths Rulebook, Pages 128-238+
> **File:** `V.4.7 Age Of Shattered Oaths.pdf`

---

## PART 42: COMMANDER AI & PERSONALITY (Per Patch 7.11)

### 42.1 Core Rule
Every commander has:
- **Temperament** (how they fight)
- **Priority** (what they value)
- **Fear** (what breaks them)

These determine: Action choice, Aid decisions, Retreat behavior, Loyalty shifts.

### 42.2 Temperament (Roll 1d6)

| Roll | Temperament | Behavior |
|------|-------------|----------|
| 1 | Aggressive | Prefers Charge or Keep Attacking |
| 2 | Disciplined | Follows orders, prefers Defend |
| 3 | Cunning | Prefers Traps and terrain |
| 4 | Loyal | Mirrors allied actions |
| 5 | Proud | Never retreats first |
| 6 | Wary | Prefers Defend and Rearguard |

### 42.3 Priority (Roll 1d6)

| Roll | Priority | Effect |
|------|----------|--------|
| 1 | Glory | +1 Loyalty when charging |
| 2 | Survival | -1 Morale DC for own unit |
| 3 | Wealth | +1 loot result |
| 4 | Victory | +1d6 when Requesting Aid |
| 5 | Orders | +1 Initiative if following plan |
| 6 | Banner | Banner tiers up 1 battle faster |

### 42.4 Fear (Roll 1d6)

| Roll | Fear | Trigger |
|------|------|---------|
| 1 | Fire | -1 Initiative vs fire/traps |
| 2 | Cavalry | -1d6 vs mounted units |
| 3 | Encirclement | Must test morale if flanked |
| 4 | Loss | Tests morale when ally dies |
| 5 | Dishonor | Must test morale if oath broken |
| 6 | Darkness | -1 Initiative at night |

### 42.5 Action Selection (AI)
Each round, determine: Outnumbered? At half strength? Terrain advantage? Ally retreating? Apply personality to determine action.

### 42.6 Aid Response Logic
**Roll Loyalty Check (1d6 vs DC 4)**

| Condition | Modifier |
|-----------|----------|
| Same Temperament | +1 |
| Ally helped before | +1 |
| Banner Tier 3+ | +1 |
| Fear triggered | -1 |

### 42.7 Personality Evolution

After each battle: **Roll 1d6**

| Roll | Change |
|------|--------|
| 1-2 | No change |
| 3-4 | Gain new Fear |
| 5 | Temperament shifts |
| 6 | Priority shifts |

### 42.8 Mercenary Loyalty Integration (Per Patch 7.11)
Use Satisfaction Score (from 40.15). Factors: Pay status, Contract terms, Loot share, Treatment by employer.

### 42.9 Battlefield Morale for Mercenaries

| Situation | Morale Modifier |
|-----------|-----------------|
| Pay is current | +0 |
| Pay is late | -2 |
| Pay is 1 month overdue | -4 (may refuse orders) |
| Satisfaction 7+ | +1 |
| Satisfaction 3-4 | -1 |
| Satisfaction 1-2 | -2 |
| Fighting alongside regulars who disrespect them | -1 |
| Fighting alongside regulars who treat them as equals | +1 |
| Enemy has offered them more (they know) | -3 |

---

## PART 43: COMMANDER MORTALITY & ROTATION (Page 160)

Commanders track:
- **Age** (years)
- **Wounds** (accumulated injuries)
- **Loyalty** (current)
- **Fatigue** (campaign exhaustion)

Older commanders gradually retire, die, or become advisors.

---

## PART 44: COMMANDER CAPTURE SYSTEM (Pages 161-163 + Per Patch 12.0)

### 44.1 Determine How the Battle Ended
For each enemy commander, identify final state: **Surrendered**, **Routed**, or **Destroyed**.

### 44.2 If the Enemy Surrenders
- All surviving commanders are captured
- The enemy lord is captured if present

### 44.3 If a Unit Routes
Outcome determined by **positioning, terrain, and collapse pattern** — no dice.

**Captured if:**
- Unit was surrounded
- Retreat path was cut
- On foot with no escort
- Friendly lines collapsed behind them

**Escape if:**
- Had a clear retreat path
- Withdrew early
- Mounted with escort
- Friendly forces covered retreat

### 44.4 If a Unit is Destroyed
**Roll 1d2:**

| Roll | Outcome |
|------|---------|
| 1 | KILLED IN THE FIGHT — Commander dies during final moments |
| 2 | CAPTURED AMONG THE DEAD — Commander survives but is overrun |

### 44.5 Big Battle Rule
When enemy line fully collapses: Assume maximum plausible capture — any commander who did not explicitly escape, any noble who did not retreat earlier, is captured.

### 44.6 The Knight's Value (Per Patch 12.0)
- A noble
- Worth 50-600 SD in ransom
- Connected to powerful families
- Potential source of intelligence
- Political hostage

**Default Battlefield Outcome for Knights:**
- 80% captured (if defeated)
- 15% ransomed on the spot
- 5% killed (accident, feud, cruelty)

---

## PART 45: COMMANDER & NOBLE VALUE SYSTEM (Pages 163-165 + Per Patch 12.0)

### 45.1 Commander Value by Tier

| Tier | Soldiers | Type | Ransom Value | Personal SD |
|------|----------|------|-------------|-------------|
| 1 | 1-19 | Low (militia, scouts) | 50 | 20-50 |
| 2 | 20-49 | Standard (infantry) | 100 | 60-100 |
| 3 | 50-100 | Elite (veterans) | 200 | 100-200 |
| 4 | 100-200 | High (noble commander) | 400 | 200-350 |
| 5 | 200-400 | Royal/Sacred | 600 | 300-500 |

### 45.2 Noble Classification

| Group | Base Ransom | Personal SD |
|-------|-------------|-------------|
| Main Family | 600 | 300-500 |
| Land Lord | 400 | 200-350 |
| Branch Family | 250 | 120-200 |

### 45.3 Combined Value Rule
If a captured character is both a commander AND a noble, use the **higher** of the two values.

### 45.4 Payment Check
Check: Does the House have enough SD? Is this person politically worth saving? Will refusing payment cause instability?
- If yes → ransom is paid
- If no → prisoner / exchange / execution

### 45.5 Failure to Pay
Options: Execute, Imprison, Exchange, Maim, Parade, Sell. Each creates rumors, fear, reputation shifts.

### 45.6 Knightly Value Table (Per Patch 12.0 — Revised)

| Type | Ransom Value | Personal SD | Political Value |
|------|-------------|-------------|-----------------|
| Landed Knight (Tier 1-2) | 100-200 SD | 20-50 SD | Minor house, local |
| Banneret (Tier 2-3) | 200-400 SD | 50-100 SD | Known regionally |
| Minor Lord (Tier 3-4) | 400-800 SD | 100-200 SD | Major house, regional |
| Great Lord (Tier 5-6) | 1,000-3,000 SD | 200-500 SD | One of the great houses |
| Royal Blood | 3,000-10,000 SD | 500-2,000 SD | Kingdom-changing |

### 45.7 Ransom Expectations

| Outcome | Reputation Effect | Future Relations |
|---------|-------------------|------------------|
| Full ransom immediately | +1 Reputation (honorable) | +1 Opinion with house |
| Negotiated lower | 0 Reputation | 0 Opinion change |
| Prisoner exchanged | +1 Reputation (pragmatic) | 0 Opinion change |
| Released without ransom | +3 Reputation (generous) | +3 Opinion, possible alliance |
| Executed | -3 Reputation (cruel) | Blood feud |
| Ransomed but cheated | -2 Reputation | -3 Opinion, future treachery |

### 45.8 Capture Resolution (2d6)

| 2d6 | Outcome | Detail |
|-----|---------|--------|
| 2-3 | Killed | Dead in battle. Family may demand blood price. |
| 4-5 | Wounded, captured | -1 to ransom value (needs healing) |
| 6-8 | Captured | Standard ransom value |
| 9-10 | Ransomed on field | Pays 50% value immediately, released |
| 11-12 | Escaped | Fled battlefield, may return later |

**Modifiers:**

| Condition | Modifier |
|-----------|----------|
| Knight fought personally | +1 |
| Knight's side lost badly | -1 |
| Victor is known as cruel | -2 |
| Victor is known as honorable | +1 |
| Blood feud between houses | -3 |
| Allied houses | +2 |

### 45.9 Mass Capture

| % of Enemy Knights | Fate |
|--------------------|------|
| 60% | Captured |
| 20% | Killed |
| 10% | Escaped |
| 10% | Ransomed on field |

### 45.10 Ransom Negotiation

**Roll:** 1d6 + Reputation + Relationship

| Modifier | Amount |
|----------|--------|
| Victor's Reputation | +1 per 10 points |
| Captive's Reputation | +1 per 10 points (they're worth more) |
| Opinion between houses | +1 if +2 or higher |
| Blood feud | -4 |
| Previous ransoms honored | +2 |
| Captive is heir | +2 to ransom value |
| Captive is only heir | +4 to ransom value |

**Result determines final ransom % of base value:**

| Roll | % of Base Value |
|------|-----------------|
| 1-3 | 150% |
| 4-6 | 125% |
| 7-9 | 100% |
| 10-11 | 75% |
| 12+ | 50% |

### 45.11 Prisoner Exchange

| Exchange Rate | Value |
|---------------|-------|
| 1 knight for 1 knight of equal rank | Standard |
| 1 great lord for 2 minor lords | Acceptable |
| 1 heir for 1 heir | Common |
| 10 common soldiers for 1 knight | Insulting (-2 Opinion) |

---

## PART 46: BATTLEFIELD INTERVENTION SYSTEM (Pages 165-167)

### 46.1 Core Rule
When the player encounters an ongoing battle, ask: Observe fully? Position forces? Join a side now?

### 46.2 Option 1 — Observe Fully
- Battle runs to completion
- No player input
- No loot (observer rule)
- Political knowledge gained
- Reputation formed
- Player may react after

### 46.3 Option 2 — Position Forces
Declare where units are placed. Valid positions:
- Enemy rear, Ally flank, High ground, Road, River crossing, Retreat path, Camp, Supply wagons, Block retreat, Intercept fleeing unit, Protect wounded, Raid camp

**Restrictions:** Must be physically reachable. GM can deny impossible placement.

Battle runs round-by-round; player may choose **ONE per round**:
- Continue waiting, Shift position, Join a side, Block retreat, Intercept fleeing unit, Protect wounded, Raid camp

### 46.4 Option 3 — Join a Side Now
Player picks: Ally / Enemy / "I attack both"
- Enter initiative order
- Treated as new commander
- Trigger morale effects, banner effects, reputation shifts

---

## PART 47: PRE-BATTLE SPEECH SYSTEM (Pages 167-170)

### 47.1 Purpose
Pause to allow: Player speech, Commander speech, War cries / morale events.

### 47.2 Battle Start Phase
1. Army Positions Determined
2. **PRE-BATTLE SPEECH PHASE**
3. Morale Effects Applied
4. Combat Resolution

### 47.3 Speech Trigger Conditions
- Player is physically present at the battle
- Player commands the army personally
- Player's banner is on the field

### 47.4 Speech Prompt
*"Your army forms ranks across the misty field. Men check straps. Horses stamp the ground. Banners ripple in the cold wind. All eyes turn to you. Your men wait for your words. What do you say?"*

### 47.5 Speech Morale Effects
**Roll:** 1d6 + Leadership

| Roll | Effect |
|------|--------|
| 1 | Men uneasy (-5% morale) |
| 2 | Little effect |
| 3 | Steady morale |
| 4 | Inspired (+10% morale) |
| 5 | Battle fervor (+15% morale) |
| 6+ | Legendary (+25% morale) |

### 47.6 The Six Blunders

| Roll | Blunder | Effect |
|------|---------|--------|
| 1 | "Did He Just Say That?" | Loyalty -1 after battle |
| 2 | The Wrong Enemy | Rumors spread, enemy reputation boost |
| 3 | Rich Man's War | Recruitment harder, peasant units lose loyalty |
| 4 | The Long One | Men parody speech, commander becomes famous (infamy) |
| 5 | Too Honest | Morale fragile, next retreat more likely |
| 6 | Legendary Blunder | Commander gains permanent flaw |

---

## PART 48: MASS COMBAT SYSTEM (Per Patch 11.0, 16.34, 16.35, 16.36)

### 48.1 Core Axioms
- If a rule is written, it must be obeyed
- If a rule is not written, it does not exist
- No improvisation is permitted
- All actions must resolve through defined procedures
- All outcomes must be mechanical before narrative

### 48.2 Actions (Chosen in Secret)
Each round, every commander must choose **one**:
- **Keep Attacking** (standard attack)
- **Defend** (defensive posture)
- **Charge** (aggressive assault)
- **Orderly Withdrawal** (controlled retreat)
- **Retreat** (flee the battlefield)
- **Request Aid** (call for help)
- **Activate Trap** (only if preset)

### 48.3 Initiative Phase
Each commander rolls: **1d6 + Initiative Bonus**. Sort highest to lowest.

### 48.4 Action Interaction Table

| Action vs Target Action | Dice Modifier |
|-------------------------|---------------|
| Attack vs Attack | +0 |
| Attack vs Defend | -1d6 |
| Attack vs Charge | +1d6 |
| Attack vs Withdrawal | +2d6 |
| Attack vs Retreat | +3d6 |
| Charge vs Defend | +1d6 to defender (defender fights back) |
| Charge vs Charge | +1d6 to both |
| Charge vs Withdrawal | +2d6 to charger |
| Charge vs Trap | -2d6 |
| Trap vs Charge | +3d6 |
| Trap vs Attack | +2d6 |
| Defend vs Attack | +1d6 to defender |
| Defend vs Defend | No attack (standoff) |
| Defend vs Withdrawal | +2d6 to defender if attacker pursues |
| Defend vs Retreat | +3d6 to defender if attacker pursues |

### 48.5 Attack Dice Pool

**Base Pool = Weapon Dice + (People ÷ 20)d6 + Tactics d6 + Terrain d6 + Mount bonus (Charge only)**

Apply interaction modifiers last.
**NO HARD CAP** — big units roll many dice.

### 48.6 Damage Resolution

Target unit Armor Class = X:
- Roll < AC → no effect
- Roll ≥ AC → kill 1
- Roll 6 → kill 2 (base rule)

Remove casualties immediately. If People Alive = 0 → unit defeated.

### 48.7 Critical Hit Rules (Per Patch 16.36)

| Situation | Effect |
|-----------|--------|
| Base Rule | Natural 6 = 2 kills |
| Target with Superb Quality Shield | Natural 6 = 1 kill |
| Mace vs Plate Armor (AC5) | Natural 6 = 3 kills |
| No shield / Flank / Rear attack | Natural 6 = 2 kills (shield irrelevant) |
| Ambush round | Double dice AND 6 = 2 kills |

### 48.8 Morale

**Morale Check:** When unit ≤ 25% starting size: **Roll 1d6**
- 1-3: Unit must choose: Withdraw / Surrender / Attempt Parlay
- 4-6: Unit holds formation

**Morale DC = 5 - Tier** (minimum DC 2)

**Half Strength Penalty (Per Patch 21.0):**
When unit falls to 50% or less, lose **HALF** of commander's morale bonus (rounded down):

| Commander Tier | Full Bonus | Half Bonus (≤50%) |
|----------------|-----------|-------------------|
| Tier 1 | +1 | +0 |
| Tier 2 | +2 | +1 |
| Tier 3 | +3 | +1 |
| Tier 4 | +4 | +2 |
| Tier 5 | +5 | +2 |

### 48.9 Request Aid
A unit may spend its action to call for help:
1. Choose 1 friendly unit not Engaged
2. That unit may immediately attack the enemy you are Engaged with
3. The aiding unit becomes Engaged with that enemy
4. You remain Engaged

### 48.10 Commander Reaction on Death

**Roll 1d6 when commander dies:**

| Roll | Result |
|------|--------|
| 1 | Unit Shatters — disbands immediately |
| 2-3 | Unit Wavers — loses 1 Tier, immediate Morale Check |
| 4-5 | Unit Holds — -1 Initiative for rest of battle |
| 6 | Unit Rallies — fights on normally, may promote from within |

### 48.11 Victory Conditions
Battle ends when:
- All enemy units are defeated
- OR all enemy units retreat

If all retreat: Begin **Chase System**.

---

## PART 49: ENGAGEMENT LOCK SYSTEM (Pages 184-186)

### 49.1 Engaging a Unit
When a unit successfully attacks or is attacked by another unit, those two units are now **Engaged**.

### 49.2 Effect of Engagement
While Engaged:
- Cannot change targets
- Cannot Charge a different unit
- Cannot Withdraw without penalty
- May only attack the unit it is Engaged with

### 49.3 Breaking Engagement
A unit may stop being Engaged only if:
- One unit is destroyed, routed, or withdraws
- OR Request Aid is used

### 49.4 Multiple Units on One Target
If two friendly units are Engaged with one enemy unit:
- Both may attack it normally
- Enemy still only attacks one unit per turn

### 49.5 Multi-Unit Engagement
A single unit may be engaged by up to **3 enemy units** simultaneously.

| Enemies Engaged | Penalty |
|-----------------|---------|
| 2 units | -1 Armor Class |
| 3 units | -2 Armor Class (maximum) |

### 49.6 Breakout Attempt
Instead of attacking, defender may attempt to disengage:

**Roll 1d6 + Commander Initiative vs DC 5 + number of engaged enemies**

| Result | Outcome |
|--------|---------|
| Success | Unit breaks engagement and may move 1 zone |
| Failure | Unit remains engaged and suffers +1 casualties this round |

---

## PART 50: PLAYER COMMAND AUTHORITY (Pages 186-188)

### 50.1 Player Control Limit
The player only gives orders to **their own unit**. The player may **NOT**:
- Direct allied units
- Choose allied targets
- Choose allied actions
- Override allied commanders

### 50.2 Allied Unit Behavior
Each allied unit:
- Chooses its own target
- Chooses its own action
- May use Request Aid
- May ignore the player

### 50.3 The Return Protocol
When ANY player-controlled unit completes its assigned task and the player is NOT present:
1. **Mission Complete:** Unit achieves objective
2. **Return Destination:**
   - IF LANDED: Player's PRIMARY CAPITAL HOLDING
   - IF LANDLESS: Player's CURRENT LOCATION
3. **Travel & Tracking:** Calculate travel time, consume supply, risk of interception/ambush/delay

**Exceptions:** Unit does NOT auto-return if: explicit orders to stay, pursuit orders, unit destroyed, unit defects.

---

## PART 51: COORDINATED WITHDRAWAL (Pages 188-189)

### 51.1 Trigger
If **all living allied commanders** choose Withdrawal in the **same round**: Coordinated Withdrawal activates.

### 51.2 Effect
All withdrawing units gain **+1 Armor Class** for:
- The next round of combat
- OR the first round of a chase scene

### 51.3 Options Created

| Option | Effect |
|--------|--------|
| Coordinated Retreat | Units attempt to leave the battlefield together |
| Defensive Line | Units gain +1 AC and fight one more round |
| Parley Attempt | If enemy is not overwhelmingly superior, may attempt negotiation |
| Surrender | Ends battle immediately |

---

## PART 52: CHASE SYSTEM (Pages 189-191)

### 52.1 When a Chase Begins
A Chase begins if:
- Any enemy unit Retreats
- AND at least one opposing commander chooses Keep Attacking or Charge

### 52.2 No Chase
If all enemy units Retreat and no one pursues: Battle ends immediately.

### 52.3 Chase Round Structure
Each round:
- **Retreating** side chooses: Flee (speed) / Rearguard (delay) / Scatter (evasion)
- **Pursuing** side chooses: Pursue / Encircle / Break Off
- Actions chosen secretly

### 52.4 Chase Roll
Each side rolls: **1d6 + Initiative Bonus + Banner Bonus**

| Condition | Modifier |
|-----------|----------|
| Mounted | +1 |
| Light armor | +1 |
| Heavy armor | -1 |
| Coordinated Withdrawal bonus active | +1 |
| Terrain favors escape | +1 |
| Terrain favors pursuit | +1 |

### 52.5 Result

| Result | Outcome |
|--------|---------|
| Retreating side > Pursuing side | Escape |
| Equal | Clash (1 attack roll only) |
| Pursuing side > Retreating side | Caught |

### 52.6 Retreat Action Effects

| Action | Effect |
|--------|--------|
| Flee | +1 to Chase roll, -1 AC this round |
| Rearguard | Enemy attack dice -1d6, Morale check required |
| Scatter | +2 to Chase roll, lose 1d6 people automatically |

---

## PART 53: AMBUSH SYSTEM (Pages 191-193 + Per Patch 16.36)

### 53.1 Core Principle
**If they don't see you, they don't get a turn.**

### 53.2 When an Ambush May Occur
- One force is concealed
- The other force is unaware
- Terrain allows hiding
- The ambushing side chooses to strike

### 53.3 Ambush Check
**1d6 + modifiers:**

| Condition | Modifier |
|-----------|----------|
| Forest | +2 |
| Hills | +1 |
| Night | +2 |
| Snow or fog | +1 |
| From high ground | +1 |
| Enemy is marching | +1 |
| Enemy is hungry/tired | +1 |
| Scouts | +1 |
| Fortified road/bridge | +1 |
| Alert posture | -1 |
| Recently warned | -1 |
| Local guides | +1 |

### 53.4 Result

| Roll | Outcome |
|------|---------|
| < DC | No ambush, normal battle |
| ≥ DC but < DC+3 | Partial Success — Ambusher chooses: strike OR withdraw |
| ≥ DC+3 | Full Success — Ambush Round triggers |

### 53.5 The Ambush Round
If Full Success: This becomes **Round 0** of the battle.
- Ambushing force issues full orders
- Ambushed force takes **NO ACTIONS**
- Ambushing force rolls **DOUBLE ATTACK DICE**
- No morale checks yet
- No retreats
- No request aid
- No late joins
- No reactions of any kind

**"This round is PURE SLAUGHTER."**
Then: Battle begins normally at Round 1.

### 53.6 Example — Ambush Round
300 archers normally: 3d6 + 15d6 = 18d6
Ambush double: 36d6

---

## PART 62: COMMANDER DUELS (Mega Patch 6.0)

### 62.1 Core Principle
Sometimes a commander seeks out the enemy standard. Sometimes the fate of the battle hangs on steel meeting steel.

### 62.2 When Duels Can Happen
ALL must be true:
- Both commanders alive and on the battlefield
- Both commanders' units are ENGAGED with each other
- At least one commander CHOOSES to seek out the other
- Player (if involved) declares the attempt
- NPC commander's personality allows it

### 62.3 Duel Trigger Check

**PLAYER-DRIVEN:** Declare "I seek out their commander." Replaces normal action.

**NPC-DRIVEN:** Roll 1d6 + Personality Modifiers. Base DC: 5.

**Temperament Modifiers:**

| Temperament | Modifier |
|-------------|----------|
| Aggressive | +2 |
| Proud | +2 |
| Loyal | +1 |
| Disciplined | -2 |
| Cunning | -1 |
| Wary | -2 |

**Priority Modifiers:**

| Priority | Modifier |
|----------|----------|
| Glory | +2 |
| Victory | +1 |
| Survival | -2 |

**Situation Modifiers:**

| Situation | Modifier |
|-----------|----------|
| Outnumbered | +1 |
| Winning battle | +1 |
| Losing battle | +2 |
| Commander wounded | -3 |

### 62.4 Duel Resolution — Attack Pool
Each commander builds an attack pool:
- Weapon Dice (from weapon tree)
- +1d6 per 5 personal bodyguards still alive
- +1d6 for mount bonus (if applicable)
- ± Interaction modifiers

**Maximum pool: 6d6** (a duel is personal, not mass combat)

### 62.5 Duel Interaction Table

| Attacker vs Defender | Modifier |
|---------------------|----------|
| Aggressive vs Aggressive | 0 |
| Aggressive vs Defensive | -1d6 |
| Aggressive vs Cunning | +1d6 |
| Defensive vs Aggressive | +1d6 |
| Defensive vs Defensive | -1d6 |
| Defensive vs Cunning | 0 |
| Cunning vs Aggressive | -1d6 |
| Cunning vs Defensive | +1d6 |
| Cunning vs Cunning | -2d6 |

Style is determined by commander's **TEMPERAMENT**.

### 62.6 Armor Class in Duels
Each commander uses personal AC. Mounted cover:
- Riding Horse: +0 AC
- Warhorse: +1 AC
- Heavy Destrier: +2 AC

### 62.7 Damage Resolution
Each d6 result:
- Roll < enemy AC → no effect
- Roll ≥ enemy AC → 1 HIT
- Roll 6 → 2 HITS (critical blow)

### 62.8 Duel Outcomes

| Result | Outcome |
|--------|---------|
| One commander has 3+ more hits | DECISIVE VICTORY — Loser killed (1-3) or captured (4-6) |
| One commander has 1-2 more hits | VICTORY — Loser wounded, retreats, -1 Tier permanently |
| Hits equal or within 1 | STALEMATE — Both withdraw, no further effect |

### 62.9 Morale Effects of Duels

**IF COMMANDER IS KILLED:**
- Their unit: Immediate morale check at -2. On failure, unit shatters (disbands). On success, fights on at -1 Tier.
- Their army: All allied units -1 Morale
- Enemy army: All enemy units +1 Morale

**IF COMMANDER IS CAPTURED:**
- Their unit: Immediate morale check at -1. On failure, unit retreats.
- Enemy army: Victor gains +1 Loyalty

**IF COMMANDER IS WOUNDED:**
- Their unit: -1 Initiative for rest of battle
- Commander out for 1d6 weeks

---

## PART 63: PROTECTION & INTERVENTION (Mega Patch 6.0)

### 63.1 Core Principle
A lord does not fight alone. Around them are champions, personal guards, banner carriers, and loyal commanders.

### 63.2 Who Can Intervene

| Protector | Requirements | Effect |
|-----------|-------------|--------|
| **PERSONAL CHAMPION** | Assigned before battle; own stats (Tier 1-3, weapon, armor) | Fights in place of the lord |
| **LOYAL COMMANDER** | Loyalty ≥ 4 to targeted lord | Intercepts the attack, takes duel |
| **PERSONAL GUARD** | Unit of elite bodyguards | 1d6 extra dice in lord's duel pool; if lord killed, 50% die in vengeance |
| **BANNER CARRIER** | Lord may sacrifice them (once per battle) | Takes killing blow instead; Banner falls but lord lives; Army gains +2 Morale |

### 63.3 Intervention Triggers

| Protector | Trigger |
|-----------|---------|
| Personal Champion | Automatically if assigned and alive |
| Loyal Commander | Roll 1d6, success on 4+. +1 if Loyalty ≥ 5, +2 if Loyalty = 6. On failure, they are cut down (killed). |
| Personal Guard | Automatically if present. Add 1d6 to lord's duel pool. If lord loses, 1d3 guards die. |
| Banner Carrier | Lord may choose to sacrifice them (once per battle). Army gains +2 Morale. |

---

## PART 64: CHAMPION'S DUEL — BATTLE BY PROXY (Per Patch 7.22)

### 64.1 Core Principle
One champion against another. The winner takes the battle. The loser takes his chances.

### 64.2 Requirements
- Both commanders agree to the duel
- Each side names a champion (themselves or another)
- Terms set before the fight
- Both sides bound by honor, not law

### 64.3 Why Agree / Refuse

| Agree | Refuse |
|-------|--------|
| Avoid Mass Casualties | You'll Probably Lose |
| Morale Advantage | You Don't Trust Them |
| Quick Resolution | You Have Advantage |
| Personal Glory | Cultural Taboo |
| Cultural Tradition | — |

### 64.4 Terms of the Duel

| Term | Meaning |
|------|---------|
| Battle Decided | Winner's army wins. Loser's army withdraws. |
| Single Combat Only | Only decisive fight |
| Champion's Fate | Loser may be killed, captured, ransomed |
| Spoils | Winner takes loser's horse, armor, weapons |
| Oath | Both commanders swear to honor result |

### 64.5 Resolution — The Duel Itself
Use Commander Duel system (Part 62) with modifiers:

| Situation | Modifier |
|-----------|----------|
| Fighting for your lord's honor | +1 to all rolls |
| Fighting for your own freedom | +2 to all rolls |
| Champion is known to both armies | +1 morale to allied army if win |
| Champion is hated by enemy | -1 morale to enemy if they lose |

| Outcome | Mechanical Effect |
|---------|-------------------|
| Win (decisive) | Champion kills/captures opponent. Victory condition met. |
| Win (narrow) | Champion wounds opponent. Opponent yields. Victory met. |
| Loss | Champion dies/yields. Army must abide by terms. |
| Stalemate | Both withdraw. No decision — battle continues normally. |

### 64.6 After the Duel — Keeping the Oath
**Roll 1d6 + Culture Modifier + Situation Modifier.**

**Cultural Honor Modifiers:**

| Culture | Base Honor |
|---------|------------|
| Central Plains | +2 (duels are sacred) |
| Western Rivers | +1 (contract is contract) |
| Eastern Forests (Settled) | +1 (word is bond) |
| Eastern Forests (Tribal) | N/A (do not duel) |
| Southern Mountains | +2 (ancestors watch) |
| Northern Snowlands | +1 (oath is oath) |
| Nomad Steppe (Traditional) | -1 (duels are for fools) |
| Nomad Steppe (Settled) | 0 (depends on situation) |

**Situation Modifiers:**

| Situation | Modifier |
|-----------|----------|
| Champion was beloved by army | +1 to keep oath |
| Champion was hated rival | -1 to keep oath |
| Army is stronger than opponent's | -2 to keep oath |
| Army is weaker than opponent's | +2 to keep oath |
| Commander is known oathbreaker | -2 to keep oath |
| Commander is known honorable | +2 to keep oath |

**Oath Resolution Table:**

| Total | Outcome |
|-------|---------|
| 1-3 | Oath Broken — attack immediately (enemy gains +1 morale from outrage) |
| 4-6 | Oath Broken — but with shame (-2 reputation for oathbreaker) |
| 7-9 | Oath Kept — but grudgingly (army -1 morale) |
| 10+ | Oath Kept — honorably (both sides withdraw in peace, +1 reputation) |

### 64.7 Champion's Rewards

| Reward | Source |
|--------|--------|
| Enemy's Horse | Taken from defeated champion |
| Enemy's Armor | Taken from defeated champion |
| Enemy's Weapons | Taken from defeated champion |
| Bonus Pay | 100-1,000 SD from own lord |
| Fame | +2 to reputation (regional) |
| Nickname | May earn new epithet |
| Song | 10% chance bards compose song about the duel |

If champion kills the enemy: +3 reputation instead of +2; enemy gear may include heirlooms; blood feud possible.
If champion yields: -1 reputation (but alive); may be ransomed later.

### 64.8 Cultural Views on Champion's Duels

| Culture | View | Accept Duel? | Keep Oath | Champion |
|---------|------|-------------|-----------|----------|
| Central Plains | Sacred | Yes — enthusiastically | +2 | Knights lobby hard |
| Western Rivers | Practical | Yes — if odds favor | +1 | Negotiated bonus expected |
| Eastern Forests (Settled) | Acceptable | Yes — reluctantly | +1 | Chooses ground carefully |
| Eastern Forests (Tribal) | Alien concept | NO — never | N/A | Will not participate |
| Southern Mountains | Ancestral | Yes — with gravity | +2 | Chosen for piety |
| Northern Snowlands | Pragmatic | Yes — if it serves | +1 | Best warrior |
| Nomad Steppe (Traditional) | Fool's game | Yes — opportunistically | -1 | Best rider |
| Nomad Steppe (Settled) | Pragmatic | Yes — if advantageous | 0 | Negotiated terms carefully |

### 64.9 Champion Selection

| Who | Pros | Cons |
|-----|------|------|
| Self | Maximum glory, direct control | Risk of death, army loses commander |
| Best Knight | Skilled, experienced | May be needed later, might die |
| Eager Volunteer | High morale, wants to prove self | May be overconfident, less skilled |
| Mercenary Champion | Professional, replaceable | Costs money, less loyalty |

### 64.10 Duelist Reputation Titles

| Title | Requirements | Effect |
|-------|-------------|--------|
| Untested | Never dueled | None |
| Known Duelist | Won 1-2 duels | +1 to intimidation |
| Feared Blade | Won 3-5 duels | +2 to intimidation, enemies may refuse duels |
| Legendary Duelist | Won 6-9 duels | +3 to intimidation, +1 to morale when fighting |
| The Unmatched | Won 10+ duels | +4 to intimidation, enemies automatically refuse duels |
