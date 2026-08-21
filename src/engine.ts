import { CampaignState, Character, WeeklyLedger, ArmyUnit, Holdings, ResourcePatch, NobleHouse, TurnResult } from "./types";
import { INITIAL_HOUSES, REGIONS, MONTHS } from "./data";
import { globalRNG, RandomService } from "./core/RandomService";
import { globalEventStore } from "./core/EventStore";
import { Relationship } from "./domain/relationship/Relationship";
import { CommanderAIService, CombatContext, CommanderProfile, CombatTactic } from "./domain/npc_ai/CommanderAIService";
import { VisibilityService } from "./domain/visibility/VisibilityService";
import { MarketService, MarketPriceResult } from "./domain/commerce/services/MarketService";
import { CombatStatsCalculator, CombatStatsResult } from "./domain/items/CombatStatsCalculator";
import { SuccessionService, Relative } from "./domain/kingdom/services/SuccessionService";
import { ProductionService, HoldingEconomy, EconomyTickResult } from "./domain/kingdom/services/ProductionService";
import { FoodService } from "./domain/kingdom/services/FoodService";
import { LaborService } from "./domain/kingdom/services/LaborService";
import { TreasuryService, ExpenseOutcome } from "./domain/kingdom/services/TreasuryService";
import { ConstructionService, ConstructionRefundResult, ResourcePatchQuality } from "./domain/kingdom/services/ConstructionService";
import { PayrollService, UpkeepCosts, DesertionResult } from "./domain/military/services/PayrollService";
import { BreedingService } from "./domain/military/services/BreedingService";
import { createNarrativeContext, ExecutionReport, NarrativeCommand, NarrativeContext, ObserverProjection } from "./lib/narrativeContracts";
import { createObserverProjection } from "./lib/narrativeProjection";
import { NarrativeResolutionResult, resolveNarrativeCommand as resolveNarrativeCommandCore } from "./lib/narrativeExecution";

/**
 * Builds an observer-scoped narrative context from an already-authorized projection.
 * CampaignState filtering remains an Engine responsibility for a future integration step.
 */
export function buildNarrativeContext(
  projection: ObserverProjection,
  executionReport: ExecutionReport
): NarrativeContext {
  return createNarrativeContext(projection, executionReport);
}

/**
 * Creates an explicit observer projection from CampaignState using a deny-by-default allow-list.
 */
export function buildObserverProjection(
  state: CampaignState,
  observer: ObserverProjection['observer']
): ObserverProjection {
  return createObserverProjection(state, observer);
}

/**
 * Authoritative Engine boundary: resolves an interpreted NarrativeCommand through
 * the existing deterministic rules and represents only real consequences as an
 * ExecutionReport of deltas/facts (never a CampaignState snapshot). The injected
 * RandomService is consumed only for MRS magnitude draws (default: globalRNG).
 */
export function resolveNarrativeCommand(
  command: NarrativeCommand,
  state: CampaignState,
  rng?: RandomService
): NarrativeResolutionResult {
  return resolveNarrativeCommandCore(command, state, rng);
}

/**
 * Calculates mount breeding success rates based on primary region suitability and holding tier limits using canonical BreedingService rules.
 */
export function calculateMountBreedingSuccessRate(
  baseSuccessRate: number,
  primaryRegion: string | undefined,
  mountId: string,
  location: string,
  holdingTier: number
): number {
  return BreedingService.calculateSuccessRate(baseSuccessRate, primaryRegion, mountId, location, holdingTier);
}

/**
 * Calculates total military wages for army units and garrison using canonical PayrollService rules.
 */
export function calculateMilitaryWages(units: { size: number }[], garrison: number): { armyWages: number; garrisonWages: number; totalWages: number } {
  const unitSizes = units.map(u => u.size);
  return PayrollService.calculateMilitaryWages(unitSizes, garrison);
}

/**
 * Resolves troop desertion checks for unpaid wage streaks using canonical PayrollService rules and globalRNG.
 */
export function resolveTroopDesertion(unpaidWeeks: number, prng = globalRNG): DesertionResult {
  return PayrollService.resolveDesertion(unpaidWeeks, prng);
}

/**
 * Calculates the 50% resource refund for a cancelled construction project using canonical ConstructionService rules.
 */
export function calculateConstructionRefund(costSd: number, costTimber: number, costStone: number): ConstructionRefundResult {
  return ConstructionService.calculateRefund(costSd, costTimber, costStone);
}

/**
 * Resolves resource patch quality upon construction completion using canonical ConstructionService rules and globalRNG.
 */
export function resolveResourcePatchQuality(prng = globalRNG): ResourcePatchQuality {
  return ConstructionService.resolvePatchQuality(prng);
}

/**
 * Calculates weekly economic production (SD & FSU) for a holding using canonical ProductionService rules.
 */
export function calculateWeeklyProduction(holding: HoldingEconomy, isWinter: boolean): EconomyTickResult {
  return ProductionService.calculateWeeklyProduction(holding, isWinter);
}

/**
 * Calculates food consumption requirements for civilian population and military forces using FoodService rules.
 */
export function calculateFoodConsumption(population: number, militarySize: number): { civilianFsu: number; militaryFsu: number; totalFsu: number } {
  const civilianFsu = FoodService.calculateCivilianConsumption(population);
  const militaryFsu = FoodService.calculateMilitaryConsumption(militarySize);
  return { civilianFsu, militaryFsu, totalFsu: civilianFsu + militaryFsu };
}

/**
 * Calculates total labor pool and available labor capacity using LaborService rules.
 */
export function calculateLaborCapacity(population: number, patches: { laborAllocated?: number }[]): { totalPool: number; allocated: number; available: number } {
  const totalPool = LaborService.calculateLaborPool(population);
  const allocated = LaborService.calculateAllocatedLabor(patches);
  const available = LaborService.calculateAvailableLabor(population, patches);
  return { totalPool, allocated, available };
}

/**
 * Calculates derived character Armor Class (AC) and Initiative bonus using canonical CombatStatsCalculator rules.
 */
export function calculateCharacterCombatStats(character: { stats: Partial<Character['stats']> }): CombatStatsResult {
  return CombatStatsCalculator.calculateStats(character);
}

/**
 * Recalculates and updates derived AC and Initiative in CampaignState character stats based on equipped armor, shield, and mount.
 */
export function recalculateCharacterStats(state: CampaignState): void {
  const derived = calculateCharacterCombatStats(state.character);
  state.character.stats.ac = derived.ac;
  state.character.stats.initiativeBonus = derived.initiativeBonus;
}

/**
 * Calculates ordered succession list for a set of relatives using canonical SuccessionService rules.
 */
export function calculateSuccessionOrder(relatives: Relative[]): Relative[] {
  return SuccessionService.getSuccessionOrder(relatives);
}

/**
 * Resolves dynastic succession when a ruler abdicates or dies, promoting the highest-ranked heir to ruler according to primogeniture.
 */
export function resolveDynasticSuccession(
  state: CampaignState,
  mode: 'abdicate' | 'death'
): { success: boolean; oldLordName: string; primaryHeirName?: string; reason?: string } {
  const livingChildren = (state.family?.children || []).filter(c => c.alive);
  if (livingChildren.length === 0) {
    return {
      success: false,
      oldLordName: state.character.name,
      reason: "No living heirs available in family line."
    };
  }

  // Convert target FamilyChild[] to domain Relative[]
  const relatives: Relative[] = livingChildren.map(c => ({
    id: c.name,
    name: c.name,
    relation: 'child',
    age: c.age,
    isLegitimate: true,
    gender: c.gender
  }));

  // Determine heir using pure SuccessionService primogeniture algorithm
  const sortedRelatives = calculateSuccessionOrder(relatives);
  const primaryRelative = sortedRelatives[0];

  const primaryHeir = livingChildren.find(c => c.name === primaryRelative.name) || livingChildren[0];
  const oldLordName = state.character.name;

  // Apply character updates cleanly
  state.character.name = primaryHeir.name;
  state.character.age = Math.max(16, primaryHeir.age);
  state.character.gender = (primaryHeir.gender as 'Male' | 'Female') || state.character.gender;
  state.character.reputation = Math.max(0, Math.floor(state.character.reputation / 2));
  state.character.backstory = `Assumiu o controle da Casa ${state.character.house} aos ${state.character.age} anos, após a ${mode === 'abdicate' ? 'abdicação voluntária' : 'morte no campo'} de seu antecessor, ${oldLordName}.`;

  // Remove promoted heir from children array
  state.family.children = state.family.children.filter(c => c.name !== primaryHeir.name);

  // Appoint new primary heir if any children remain using SuccessionService
  if (state.family.children.length > 0) {
    const remainingRelatives: Relative[] = state.family.children.filter(c => c.alive).map(c => ({
      id: c.name,
      name: c.name,
      relation: 'child',
      age: c.age,
      isLegitimate: true,
      gender: c.gender
    }));
    const nextSorted = calculateSuccessionOrder(remainingRelatives);
    if (nextSorted.length > 0) {
      const nextHeirName = nextSorted[0].name;
      state.family.children.forEach(c => {
        c.isHeir = (c.name === nextHeirName);
      });
    }
  }

  // Record world event in ledger
  state.worldLedger.majorEvents.push({
    date: `W${state.weeklyLedger.week}, M${state.weeklyLedger.month}`,
    event: `Sucessão Dinástica: ${primaryHeir.name} assume a Casa ${state.character.house}`,
    region: state.character.location.region,
    involved: `${oldLordName} -> ${primaryHeir.name}`,
    resolved: "Yes"
  });

  return {
    success: true,
    oldLordName,
    primaryHeirName: primaryHeir.name
  };
}

/**
 * Translates target calendar month name (e.g. "Greening", "Frostwane") to 1..12 month index for MarketService.
 */
export function getMonthNumberFromName(monthName: string): number {
  if (!monthName) return 1;
  const clean = monthName.trim().replace(/\s+/g, '_');
  const index = MONTHS.indexOf(clean);
  if (index >= 0) {
    return index + 1;
  }
  const lower = clean.toLowerCase();
  if (lower.includes("frostwane")) return 1;
  if (lower.includes("deepfrost")) return 2;
  if (lower.includes("thawrise")) return 3;
  if (lower.includes("greening")) return 4;
  if (lower.includes("highsun_1") || lower === "highsun") return 5;
  if (lower.includes("highsun_2")) return 6;
  if (lower.includes("harvestfall_1") || lower === "harvestfall") return 7;
  if (lower.includes("harvestfall_2")) return 8;
  if (lower.includes("ashfall_1") || lower === "ashfall") return 9;
  if (lower.includes("ashfall_2")) return 10;
  if (lower.includes("longdark_1") || lower === "longdark") return 11;
  if (lower.includes("longdark_2")) return 12;
  return 1;
}

/**
 * Calculates dynamic material/commodity market prices using canonical MarketService rules.
 */
export function calculateMaterialPrice(
  basePrice: number,
  materialId: string,
  regionId: string,
  monthName: string,
  stock = 0,
  marketCapacity = 150
): MarketPriceResult {
  const service = new MarketService();
  const monthNumber = getMonthNumberFromName(monthName);
  return service.calculatePrice(basePrice, materialId, regionId, monthNumber, stock, marketCapacity);
}

/**
 * Calculates absolute week-tick from CampaignState currentDate (base year 342).
 */
export function getAbsoluteCampaignTurn(year: number, week?: number): number {
  const baseYear = 342;
  const safeWeek = week !== undefined && week !== null ? Math.max(1, week) : 1;
  return Math.max(1, (year - baseYear) * 52 + safeWeek);
}

/**
 * Normalizes landmark or region names to standard VisibilityService hubs ('valenfort' | 'blackmoor' | 'harvel' | 'capital').
 */
export function normalizeLocationToHub(locationName?: string): string {
  if (!locationName) return "valenfort";
  const loc = locationName.toLowerCase();
  if (loc.includes("valenfort") || loc.includes("stormcrest")) return "valenfort";
  if (loc.includes("blackmoor") || loc.includes("bogthrone")) return "blackmoor";
  if (loc.includes("harvel") || loc.includes("ironridge") || loc.includes("south")) return "harvel";
  if (loc.includes("capital") || loc.includes("royal") || loc.includes("central")) return "capital";
  return loc;
}

/**
 * Asserts whether a campaign event or rumor at eventLocation is visible to an observer.
 */
export function isEventVisibleToObserver(
  observerLocation: string,
  eventLocation: string,
  currentTurn: number,
  eventTurn: number
): boolean {
  const visService = new VisibilityService();
  const normObserver = normalizeLocationToHub(observerLocation);
  const normEvent = normalizeLocationToHub(eventLocation);
  return visService.canObserverSeeEvent(normObserver, normEvent, currentTurn, eventTurn);
}

/**
 * Returns worldSecrets filtered by fog-of-war spatial visibility rules for the current campaign state.
 */
export function getVisibleWorldSecrets(state: CampaignState): Array<any> {
  if (!state.worldSecrets) return [];
  const currentTurn = getAbsoluteCampaignTurn(state.worldLedger.currentDate.year, state.worldLedger.currentDate.week);
  const playerLoc = (state.character.location as any).currentLandmark || state.character.location.landmark || state.character.location.region || "Valenfort Citadel";

  return state.worldSecrets.filter(sec => {
    // If secret is already revealed or has no origin location, it is immediately visible
    if (sec.revealed || !sec.originLocation) return true;
    const eventTurn = sec.originTurn !== undefined ? sec.originTurn : 1;
    return isEventVisibleToObserver(playerLoc, sec.originLocation, currentTurn, eventTurn);
  });
}

/**
 * Adjusts a noble house's opinion score using canonical Relationship domain rules (-3..+3 bounds).
 */
export function adjustHouseOpinion(house: NobleHouse, delta: number, sourceId: string = "Player"): void {
  const rel = new Relationship({
    sourceId,
    targetId: house.name,
    opinion: house.opinion,
    relationshipType: house.status || "Neutra"
  });
  rel.adjustOpinion(delta);
  house.opinion = rel.opinion;
}

/**
 * Sets a noble house's opinion score directly, enforcing canonical Relationship domain bounds (-3..+3).
 */
export function setHouseOpinion(house: NobleHouse, targetOpinion: number, sourceId: string = "Player"): void {
  const rel = new Relationship({
    sourceId,
    targetId: house.name,
    opinion: targetOpinion,
    relationshipType: house.status || "Neutra"
  });
  house.opinion = rel.opinion;
}

/**
 * Derives a deterministic effective commander profile for an NPC unit if custom settings are omitted.
 */
export function getEffectiveCommanderProfile(
  enemyUnit: ArmyUnit,
  customProfile?: Partial<CommanderProfile>
): CommanderProfile {
  let temperament: CommanderProfile['temperament'] = 'Disciplined';
  let priority: CommanderProfile['priority'] = 'Victory';
  let fear: CommanderProfile['fear'] = 'Encirclement';

  const nameLower = (enemyUnit.name || '').toLowerCase();
  if (nameLower.includes('levy') || nameLower.includes('skeleton')) {
    temperament = 'Wary';
    priority = 'Survival';
    fear = 'Loss';
  } else if (nameLower.includes('swords') || nameLower.includes('free company')) {
    temperament = 'Aggressive';
    priority = 'Glory';
    fear = 'Fire';
  } else if (nameLower.includes('guard') || nameLower.includes('retinue')) {
    temperament = 'Disciplined';
    priority = 'Orders';
    fear = 'Encirclement';
  }

  return {
    temperament: customProfile?.temperament || temperament,
    priority: customProfile?.priority || priority,
    fear: customProfile?.fear || fear,
  };
}

/**
 * Builds a deterministic CombatContext from target ArmyUnit properties.
 * morale: unit.morale (1..10) is scaled to 0..100 for context evaluation.
 * hpPercent: (size / maxSize) * 100 bounded between 0 and 100.
 */
export function buildCombatContext(
  enemyUnit: ArmyUnit,
  playerUnit: ArmyUnit,
  options?: { terrainAdvantage?: boolean; fearTriggered?: boolean; isAllyRetreating?: boolean }
): CombatContext {
  const maxSize = enemyUnit.maxSize || 50;
  const hpPercent = maxSize > 0 ? Math.min(100, Math.max(0, Math.round((enemyUnit.size / maxSize) * 100))) : 100;
  const moraleScaled = Math.min(100, Math.max(0, Math.round((enemyUnit.morale ?? 5) * 10)));

  return {
    hpPercent,
    morale: moraleScaled,
    isOutnumbered: playerUnit.size > enemyUnit.size,
    isHalfStrength: enemyUnit.size <= Math.floor(maxSize / 2),
    isAllyRetreating: options?.isAllyRetreating ?? false,
    terrainAdvantage: options?.terrainAdvantage ?? false,
    fearTriggered: options?.fearTriggered ?? false,
  };
}

/**
 * Maps legacy CombatTactic to target engine combat action.
 * 'Charge' -> 'Charge'
 * 'Attack' -> 'Keep Attacking'
 * 'Defend', 'Traps', 'Rearguard', 'Retreat' -> 'Defend'
 */
export function mapTacticToEngineAction(tactic: CombatTactic): 'Keep Attacking' | 'Defend' | 'Charge' {
  switch (tactic) {
    case 'Charge':
      return 'Charge';
    case 'Attack':
      return 'Keep Attacking';
    case 'Defend':
    case 'Traps':
    case 'Rearguard':
    case 'Retreat':
    default:
      return 'Defend';
  }
}

/**
 * Resolves an NPC combat tactical action deterministically using CommanderAIService.
 */
export function resolveNpcCombatAction(
  enemyUnit: ArmyUnit,
  playerUnit: ArmyUnit,
  customProfile?: Partial<CommanderProfile>,
  options?: { terrainAdvantage?: boolean; fearTriggered?: boolean; isAllyRetreating?: boolean }
): 'Keep Attacking' | 'Defend' | 'Charge' {
  const context = buildCombatContext(enemyUnit, playerUnit, options);
  const profile = getEffectiveCommanderProfile(enemyUnit, customProfile);
  const aiService = new CommanderAIService();
  const tactic = aiService.selectCombatTactic(context, profile);
  return mapTacticToEngineAction(tactic);
}

// Generate a blank initial campaign state
export function createInitialState(archetype: any, region: string): CampaignState {
  // Reset RNG to deterministic seed for each new campaign
  globalRNG.setSeed(424242);
  const isNecro = archetype === "Necromancer";
  
  return {
    character: {
      name: "Renascent Lord",
      house: "Stormcrest",
      age: 28,
      gender: "Male",
      archetype: isNecro ? "Necromancer" : "Noble Ruler",
      title: isNecro ? "Necromancer Lord" : "Lord of the Keep",
      location: {
        region: region || "Central Plains",
        subregion: "The Frontier",
        landmark: "Grey Keep",
        distanceNearTown: 3,
        distanceNearCastle: 0,
        distanceCapital: 4
      },
      banner: {
        colors: isNecro ? "Black and Obsidian" : "Red and Gold",
        symbol: isNecro ? "Shattered Crown" : "Golden Eagle",
        motto: isNecro ? "O Sangue Lembra" : "Steel Before Oath"
      },
      stats: {
        commanderTier: 1,
        bannerTier: 1,
        ac: 3,
        initiativeBonus: 0,
        weapon: isNecro ? "Dagger" : "Spear",
        shield: "Standard",
        mount: isNecro ? "None" : "Riding Horse",
        mountQuality: "Common",
        weaponQuality: "Common",
        armorQuality: "Common",
        shieldQuality: "Common"
      },
      reputation: isNecro ? 0 : 2,
      nicknames: [],
      flavorDetail: "O vento nunca cessa nestas terras ásperas.",
      backstory: "Um juramento quebrado levou você ao exílio. Agora você retorna para reclamar seu assento.",
      soulEssence: isNecro ? 20 : undefined,
      controlUsed: isNecro ? 10 : undefined,
      controlLimit: isNecro ? 50 : undefined,
      isLich: isNecro ? false : undefined
    },
    weeklyLedger: {
      week: 1,
      month: "Greening",
      year: 342,
      season: "Thawtide",
      weather: "Clear, cool",
      silverdew: isNecro ? 50 : 300,
      food: isNecro ? 2 : 10.0,
      materials: {
        timber: isNecro ? 10 : 20,
        iron: isNecro ? 5 : 10,
        stone: 0
      },
      incomeDetail: { holdings: 75, patches: 0, trade: 0, tribute: 0, taxes: 0, loot: 0, other: 0 },
      expenseDetail: { wages: 0, garrison: 0, foodPurchases: 0, construction: 0, recruitment: 0, mercenaries: 0, tributePaid: 0, engineerWages: 0, shipUpkeep: 0, holdingMaintenance: 0, other: 0 }
    },
    army: {
      units: [
        isNecro 
          ? { id: `levy_${globalRNG.nextInt(0, 1000000)}`, name: "Skeleton Guards", size: 10, maxSize: 10, tier: 1, ac: 3, weapon: "Fists", mount: "None", morale: 6, type: "Skeletons" }
          : { id: "u_1", name: "Landed Levy", size: 60, maxSize: 60, tier: 1, ac: 3, weapon: "Spears", mount: "None", morale: 4, type: "Levy" }
      ],
      garrisonSize: isNecro ? 0 : 40
    },
    holdings: {
      name: "Grey Keep",
      type: isNecro ? "Bastion" : "Bastion",
      tier: 1,
      region: region || "Central Plains",
      position: "Três dias leste de River Caedor",
      population: 1000,
      laborPool: 400,
      garrison: isNecro ? 0 : 40,
      fortification: {
        type: "Wooden Palisade",
        tier: 1,
        acBonus: 1,
        rangedRerolls: 1,
        firstMeleeBonus: 0
      },
      resourcePatches: [
        { id: "p1", name: "Grama de Caedor", type: "Grain Field", tier: 1, quality: "Common", yieldPerDay: 2, incomePerDay: 2.5, laborRequired: 5 }
      ],
      residentSmith: { name: "Master Robert", level: 1, xp: 10, specialty: "Armor" },
      granaryUpgrade: false,
      villages: [
        { name: "Sítio de Corvopedra", status: "Protectorate", direction: "Norte", distanceDays: 1.5, products: "Cereais e Tecidos", notes: "Leal à Casa Stormcrest. Fornece grãos e homens." },
        { name: "Vila de Bogthrone", status: "Independent", direction: "Oeste", distanceDays: 3, products: "Turfa e Peixe", notes: "Neutro, dominada por contrabandistas e mercadores locais." }
      ],
      otherHoldings: [
        { name: "Forte de Vigia Leste", type: "Posto de Fronteira", garrison: 15, incomePerWeek: 15, function: "Vigia a travessia do rio Caedor e rotas comerciais." },
        { name: "Torre de Corvopedra", type: "Posto Avançado", garrison: 10, incomePerWeek: 5, function: "Protege o vilarejo de Corvopedra contra incursões de clãs hostis." }
      ]
    },
    ships: [],
    sessionLog: {
      lastSessionDate: "Greening Day 1, Year 342",
      lastThingHappened: "Iniciou uma nova campanha.",
      activeMissions: [],
      pendingDecisions: []
    },
    worldLedger: {
      currentDate: { day: 1, month: "Greening", year: 342, week: 1 },
      activeConflicts: [],
      majorEvents: [],
      nobleHouses: INITIAL_HOUSES,
      rareEventStatus: {
        warmYear: { active: false, lastOccurredYear: 312 },
        youngPretender: { active: false },
        snowBearMigration: { active: false },
        blindTraveler: { active: false },
        schemer: { active: false }
      },
      marketConditions: {
        "Central Plains": { tradeVolume: "Medium", priceTrend: "Stable", shortages: "None" },
        "Western Rivers": { tradeVolume: "High", priceTrend: "Rising", shortages: "Stone" },
        "Eastern Forests": { tradeVolume: "Medium", priceTrend: "Stable", shortages: "Iron" },
        "Southern Mountains": { tradeVolume: "Low", priceTrend: "Stable", shortages: "Grain" },
        "Northern Snowlands": { tradeVolume: "Low", priceTrend: "Rising", shortages: "Grain" },
        "Nomad Steppe": { tradeVolume: "Medium", priceTrend: "Stable", shortages: "Timber" }
      },
      weatherHistory: ["Clear", "Windy", "Light rain", "Cool, overcast"],
      notableDeaths: []
    },
    crowns: [
      {
        id: 'blood',
        name: 'Crown of Blood (Planícies)',
        region: 'Central Plains',
        unlocked: false,
        progress: 0,
        maxProgress: 3,
        requirements: ['Vencer 3 batalhas importantes nas Planícies', 'Liderar 5 grandes Casas das Planícies', 'Reivindicar o Assento de Ferro']
      },
      {
        id: 'contracts',
        name: 'Crown of Contracts (Rios)',
        region: 'Western Rivers',
        unlocked: false,
        progress: 0,
        maxProgress: 4,
        requirements: ['Obter rotas de comércio com holdings fluviais', 'Eleição pelo Conselho do Rio', 'Firmar cartas de fealdade com lordes mercantes']
      },
      {
        id: 'northwind',
        name: 'Crown of the North Wind (Gelo)',
        region: 'Northern Snowlands',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        requirements: ['Sobreviver ao frio profundo de uma Nevasca no Norte', 'Abater uma fera ou urso da neve']
      },
      {
        id: 'greendrake',
        name: 'Crown of the Green Drake (Florestas)',
        region: 'Eastern Forests',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        requirements: ['Submeter ou domar Eldric, o Dragão Negro das Florestas', 'Capturar a Torre Florestal Alta']
      },
      {
        id: 'stone',
        name: 'Crown of Stone (Montanhas)',
        region: 'Southern Mountains',
        unlocked: false,
        progress: 0,
        maxProgress: 2,
        requirements: ['Defender as passagens sulistas sob cerco', 'Recuperar as relíquias de pedra dos antigos clãs']
      },
      {
        id: 'rubicon',
        name: 'Rubicon Crown (Proclamação)',
        region: 'Any',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        requirements: ['Ser aclamado pelas próprias tropas em rebelião', 'Conquistar a capital por usurpação armada']
      }
    ],
    inventory: {
      horns: [
        { id: 'horn_1', name: 'Berrante de Caça Comum', type: 'Hunting', sound: 'Sopro rápido e brilhante', broken: false }
      ],
      smudgeBundles: {
        sage: 2,
        cedar: 1,
        sweetgrass: 0,
        tobacco: 1
      }
    },
    family: {
      spouse: undefined,
      children: [],
      betrothedHouse: undefined,
      pregnancyWeekRemaining: undefined
    },
    worldSecrets: [
      {
        id: 'secret_1',
        title: 'A Herdeira Oculta do Antigo Rei',
        description: 'Sussurros dizem que uma descendente direta da linhagem heráldica real sobreviveu e vive sob disfarce de camponesa no sul.',
        revealed: false,
        investigationProgress: 0,
        category: 'Dynasty',
        outcomeDesc: 'CONFIRMADO! A herdeira legítima chama-se Lyra e vive nas montanhas do sul. Você pode tentar um Casamento Político com ela (requer +5 de Reputação) para unificar as reivindicações de sangue da coroa real, elevando sua lealdade.',
        difficultyClass: 18,
        criticality: 'Critical',
        compromisedChance: 0.25,
        obsoleteInWeeks: 12,
        originLocation: 'Harvel Pass',
        originTurn: 1
      },
      {
        id: 'secret_2',
        title: 'O Suborno do Marechal Ren',
        description: 'Mercadores de Bogthrone murmuram que a lealdade de Ren é lavada em prata, e que ele possui uma dívida severa de jogatina com cobradores de ferro.',
        revealed: false,
        investigationProgress: 0,
        category: 'Military',
        outcomeDesc: 'CONFIRMADO! Marshal Ren aceita subornos em momentos de aperto. Na aba de combate contra ele, você pode suborná-lo gastando 100 SD para reduzir a guarnição e o tamanho da tropa dele à metade imediatamente.',
        difficultyClass: 14,
        criticality: 'High',
        compromisedChance: 0.15,
        obsoleteInWeeks: 8,
        originLocation: 'Blackmoor Keep',
        originTurn: 1
      },
      {
        id: 'secret_3',
        title: 'O Enclave Secreto de Sálvia Sagrada',
        description: 'Diz-se que há uma clareira mística e protegida nas profundezas das Florestas Orientais onde abundam ervas e óleos de purificação.',
        revealed: false,
        investigationProgress: 0,
        category: 'Plot',
        outcomeDesc: 'CONFIRMADO! Seus batedores mapearam o santuário. Você ganha imediatamente +15 FSU e +3 feixes de Sálvia e Cedro das ervas sagradas protegidas.',
        difficultyClass: 10,
        criticality: 'Medium',
        compromisedChance: 0.08,
        obsoleteInWeeks: 6,
        originLocation: 'Valenfort Citadel',
        originTurn: 1
      }
    ],
    discoveredArtifacts: [
      {
        name: "O Livro Negro de Caedor",
        description: "Um tomo encadernado em couro negro desgastado, preenchido com nomes, segredos, registros de subornos e dossiês secretos da fronteira de Caedor.",
        origin: "Encontrado em um compartimento falso sob o altar de pedra da capela em ruínas.",
        properties: "Fornece dossiês confidenciais sobre vassalos, reduzindo a dificuldade de investigações e permitindo ações políticas de intriga.",
        locationFound: "Ruínas da capela de Corvopedra",
        type: "Tomo de Espionagem & Intriga",
        weekFound: 1
      }
    ],
    advisors: {
      counselorName: globalRNG.pick(["Mara", "Gwen", "Elysia", "Vanya", "Lorea", "Sybilla", "Alys", "Isolde"]),
      stewardName: globalRNG.pick(["Barth", "Lorn", "Garrick", "Tymon", "Brogan", "Cormac", "Harlan", "Theron"]),
      spyMasterName: globalRNG.pick(["Ren", "Sylas", "Kaelen", "Lyra", "Fiona", "Valia", "Morwen", "Rook"])
    },
    revealedRegions: [region || "Central Plains"],
    tribalRelations: [
      { tribeName: "Clã das Sombras do Inverno", leader: "Chefe Morghur", opinion: "Neutral", details: "Habitam as montanhas geladas do norte. Comércio ocasional.", soldiersEstimate: "300 guerreiros" },
      { tribeName: "Clã dos Nômades de Ferro", leader: "Mãe dos Clãs Morna", opinion: "Friendly", details: "Amigáveis, apoiam patrulhas conjuntas contra salteadores.", soldiersEstimate: "150 guerreiros" }
    ],
    councils: [
      {
        name: "Conselho Senhorial de Grey Keep",
        nature: "Conselho Administrativo Senhorial (Part 97)",
        emergencyFund: 120,
        seats: [
          { name: "Lord Alric", role: "Soberano", disposition: 5, loyalty: 6 },
          { name: "Lady Gwyneth", role: "Chanceler", disposition: 4, loyalty: 5 },
          { name: "Marshal Ren", role: "Marechal", disposition: 3, loyalty: 4 }
        ],
        pendingAgendas: [
          "Aumento dos impostos de inverno para reforçar as paliçadas.",
          "Arbitragem de disputa de terras pastoris na fronteira de Caedor."
        ],
        rules: [
          "Quórum de dois terços para decisões fiscais.",
          "Voto de desempate reservado ao Lorde Soberano."
        ]
      },
      {
        name: "Conselho Fluvial dos Rios (River Council)",
        nature: "Coalizão das Terras Fluviais (Part 22.3)",
        emergencyFund: 88,
        seats: [
          { name: "Lord Brandon", role: "Vassalo do Norte", disposition: 3, loyalty: 3 },
          { name: "Elder Morna", role: "Porta-Voz dos Clãs", disposition: 4, loyalty: 5 }
        ],
        pendingAgendas: [
          "Estocar sálvia sagrada para rituais de defumação coletivos contra as nevascas.",
          "Combater incursores e mercenários sem bandeira nas rotas de neve."
        ],
        rules: [
          "Decisões por aclamação ou consenso tribal."
        ]
      }
    ],
    spyNetwork: {
      spymaster: "Ren",
      totalAgents: 2,
      costPerWeek: 15,
      agents: [
        { id: "a1", name: "Kaelen", codename: "Lobo Cinzento", status: "Active", location: "Valenfort", cover: "Mercador de Peles" },
        { id: "a2", name: "Elysia", codename: "Sombra do Corvo", status: "Active", location: "Northern Snowlands", cover: "Menestrel Itinerante" }
      ],
      activeIntelligence: [
        "House Viremont está estocando ferro em segredo perto de Ironridge.",
        "Rumores dizem que o Mestre dos Sussurros de House Blackmere procura a herdeira oculta de Gwyneth."
      ]
    },
    equipmentInventory: {
      armory: [
        { item: "Lanças de Ferro de Batalha", type: "Weapons", quality: "Common", qty: 60, notes: "Armas padrão da milícia levy." },
        { item: "Couraças de Couro Batido", type: "Armor", quality: "Common", qty: 40, notes: "Proteção leve de patrulha." },
        { item: "Escudos Redondos de Carvalho", type: "Shields", quality: "Common", qty: 50, notes: "Excelente cobertura defensiva." },
        { item: "Mantos Pesados de Pele", type: "Winter Gear", quality: "High-Grade", qty: 25, notes: "Indispensável para sobrevivência no norte." }
      ],
      production: {
        spears: { rate: 2, resource: "Iron/Timber", active: true },
        cuirasses: { rate: 1, resource: "Leather", active: false }
      }
    },
    caravanLedger: {
      activeCaravans: [
        { id: "car1", name: "Caravana de Ferro de Caedor", leader: "Barth, o Velho", guardDetails: "15 Mercenários da Companhia Livre", status: "A caminho de Valenfort", weekLaunched: 1 }
      ],
      pendingCaravans: []
    }
  };
}

// Calculate travel time between landmark points
export function calculateTravelTime(
  distanceInMiles: number,
  terrain: string,
  hasRoads: boolean,
  isMounted: boolean,
  isWinter: boolean,
  isWarmYear: boolean
): number {
  // Terrain Base Speeds per 100 miles (OCR page 20)
  // Royal Road: 4 days | Plains: 7 days | Maintained Road: 5 days | Hills: 9 days |
  // Mountains: 10-15 days | Common Road: 6 days | Light Forest: 8 days | Deep Forest: 12 days |
  // Winter Snow: 20 days
  let baseDays = 7; // default Plains
  const tLower = terrain.toLowerCase();
  if (tLower.includes("road") || hasRoads) {
    baseDays = tLower.includes("royal") ? 4 : tLower.includes("maintained") ? 5 : 6;
  } else if (tLower.includes("hill")) {
    baseDays = 9;
  } else if (tLower.includes("mountain")) {
    baseDays = 12;
  } else if (tLower.includes("deep forest")) {
    baseDays = 12;
  } else if (tLower.includes("forest")) {
    baseDays = 8;
  } else if (tLower.includes("swamp") || tLower.includes("marsh")) {
    baseDays = 14;
  }

  if (isWinter && !isWarmYear) {
    baseDays = 20; // Winter Snow rules
  }

  // Speed scaling per 100 miles
  let totalDays = (distanceInMiles / 100) * baseDays;

  // Mounted parties travel 25% faster on roads, but same speed in rough terrain
  if (isMounted && (hasRoads || tLower.includes("road") || tLower.includes("plains"))) {
    totalDays *= 0.75;
  }

  // Round up fractional days to nearest half-day
  return Math.ceil(totalDays * 2) / 2;
}

// Roll weather (1d6) silently for region and season
export function rollWeather(region: string, season: string, isWarmYear: boolean): { weather: string; travelMod: number; foragingMod: number } {
  if (isWarmYear) {
    return { weather: "Inverno Suave (Ano Quente - Sem Neve)", travelMod: 1.0, foragingMod: 1.0 };
  }

  const roll = globalRNG.nextInt(1, 6);
  const regLower = region.toLowerCase();

  if (regLower.includes("snow") || regLower.includes("north")) {
    if (season === "Deepfrost") {
      if (roll === 1) return { weather: "Limpo, frio amargo (Velocidade +25%, risco geladura)", travelMod: 1.25, foragingMod: 0.1 };
      if (roll <= 3) return { weather: "Neve leve (Velocidade +50%, visibilidade reduzida)", travelMod: 1.5, foragingMod: 0.5 };
      if (roll === 4) return { weather: "Neve pesada (Velocidade +100%, sem forrageamento)", travelMod: 2.0, foragingMod: 0 };
      if (roll === 5) return { weather: "Nevasca (Velocidade +200%, sem viagem)", travelMod: 3.0, foragingMod: 0 };
      return { weather: "Tempestade Branca (Viagem impossível, baixas na tropa)", travelMod: 10, foragingMod: 0 };
    } else {
      return { weather: "Nublado, ventoso (Velocidade normal)", travelMod: 1.0, foragingMod: 0.8 };
    }
  }

  if (regLower.includes("plain") || regLower.includes("central")) {
    if (season === "Deepfrost") {
      if (roll <= 3) return { weather: "Frio e ventoso (Velocidade normal)", travelMod: 1.0, foragingMod: 0.5 };
      if (roll <= 5) return { weather: "Garoa gélida (Velocidade +25%)", travelMod: 1.25, foragingMod: 0.3 };
      return { weather: "Nevada leve rara (Velocidade +50%)", travelMod: 1.5, foragingMod: 0.2 };
    } else {
      if (roll <= 3) return { weather: "Limpo e quente (Perfeito)", travelMod: 1.0, foragingMod: 1.2 };
      if (roll <= 5) return { weather: "Vento forte e seco (Risco de incêndio)", travelMod: 1.0, foragingMod: 1.0 };
      return { weather: "Chuvas sazonais (Velocidade +25% por lama)", travelMod: 1.25, foragingMod: 1.1 };
    }
  }

  // Default fallback
  return { weather: "Tempo firme, nublado", travelMod: 1.0, foragingMod: 1.0 };
}

// Execute Weekly Turn Resolution (PHASE 1 to PHASE 6)
export function resolveWeeklyTurn(state: CampaignState): { updatedState: CampaignState; turnResult: TurnResult } {
  const s = JSON.parse(JSON.stringify(state)) as CampaignState;
  
  const isNecro = s.character.archetype === "Necromancer";
  const isWarmYear = s.worldLedger.rareEventStatus.warmYear.active;

  const turnResult: TurnResult = {
    incomeChanges: { holdings: 0, patches: 0 },
    foodChanges: 0,
    militaryChanges: { wagesPaid: 0, desertions: 0, moralePenalty: 0 },
    eventLog: []
  };

  // Advance Week
  const curWeek = s.worldLedger.currentDate.week;
  let nextWeek = curWeek + 1;
  let nextMonth = s.worldLedger.currentDate.month;
  let nextYear = s.worldLedger.currentDate.year;

  if (nextWeek > 4) {
    nextWeek = 1;
    const curMonthIdx = MONTHS.indexOf(s.worldLedger.currentDate.month);
    let nextMonthIdx = curMonthIdx + 1;
    if (nextMonthIdx >= MONTHS.length) {
      nextMonthIdx = 0;
      nextYear += 1;
      
      // Dynamic Dynastic Aging
      s.character.age += 1;
      if (s.family && s.family.spouse) {
        s.family.spouse.age += 1;
      }
      if (s.family && s.family.children) {
        s.family.children.forEach(c => c.age += 1);
      }
      turnResult.eventLog.push(`ANO NOVO: O ano ${nextYear} começa gélido nas terras despedaçadas. Todos os membros de sua linhagem envelhecem um ano.`);
    }
    nextMonth = MONTHS[nextMonthIdx];
  }

  s.worldLedger.currentDate.week = nextWeek;
  s.worldLedger.currentDate.month = nextMonth;
  s.worldLedger.currentDate.year = nextYear;

  // Determine current season
  let season: 'Thawtide' | 'Sunreach' | 'Reapingfall' | 'Deepfrost' = "Thawtide";
  if (["Frostwane", "Deepfrost", "Longdark_1", "Longdark_2"].includes(nextMonth)) {
    season = "Deepfrost";
  } else if (["Thawrise", "Greening"].includes(nextMonth)) {
    season = "Thawtide";
  } else if (["Highsun_1", "Highsun_2"].includes(nextMonth)) {
    season = "Sunreach";
  } else {
    season = "Reapingfall";
  }
  s.weeklyLedger.season = season;

  // Pregnancy tick
  if (s.family && s.family.pregnancyWeekRemaining !== undefined) {
    s.family.pregnancyWeekRemaining -= 1;
    if (s.family.pregnancyWeekRemaining <= 0) {
      s.family.pregnancyWeekRemaining = undefined;
      const isBoy = globalRNG.next() < 0.5;
      const boys = ["Aethelwulf", "Robert", "Cedric", "Gawain", "Eldred", "Boran", "Valerius", "Karr", "Edmund"];
      const girls = ["Yvaine", "Morgaine", "Aveline", "Elysia", "Sallie", "Rowena", "Gwen", "Sybilla", "Beatrix"];
      const childName = isBoy 
        ? globalRNG.pick(boys)
        : globalRNG.pick(girls);
      const hasHeir = s.family.children.some(c => c.isHeir && c.alive);
      const newChild = {
        name: childName,
        age: 0,
        gender: isBoy ? "Male" : "Female",
        isHeir: !hasHeir,
        alive: true
      };
      s.family.children.push(newChild);
      turnResult.eventLog.push(`NASCIMENTO: Sua esposa deu à luz um bebê saudável! Um(a) ${isBoy ? 'menino' : 'menina'} chamado(a) ${childName}, herdeiro(a) da Casa ${s.character.house}.`);
    } else {
      turnResult.eventLog.push(`Linhagem: Gestação em progresso. Nascimento esperado em ${s.family.pregnancyWeekRemaining} semanas.`);
    }
  }

  turnResult.eventLog.push(`--- INÍCIO DA SEMANA ${nextWeek} DE ${nextMonth.replace("_", " ")}, ANO ${nextYear} ---`);

  // 1. Weather update
  const w = rollWeather(s.character.location.region, season, isWarmYear);
  s.weeklyLedger.weather = w.weather;
  s.worldLedger.weatherHistory.push(w.weather);
  if (s.worldLedger.weatherHistory.length > 4) {
    s.worldLedger.weatherHistory.shift();
  }
  turnResult.eventLog.push(`Clima: ${w.weather}`);

  // 2. Production (PHASE 1)
  let holdingBaseIncome = 0;
  if (!isNecro) {
    const type = s.holdings.type;
    if (type === "Bastion") holdingBaseIncome = 300 / 4;
    else if (type === "Castle") holdingBaseIncome = 900 / 4;
    else if (type === "Fortified Town") holdingBaseIncome = 600 / 4;
    else if (type === "Walled City") holdingBaseIncome = 1500 / 4;
  }

  let patchIncome = 0;
  let patchFood = 0;
  let patchTimber = 0;
  let patchIron = 0;
  let patchStone = 0;

  const isWinter = season === "Deepfrost" || (season as string) === "Inverno";
  s.holdings.resourcePatches.forEach((p) => {
    const yieldW = p.yieldPerDay * 7 * w.foragingMod;
    const incomeW = p.incomePerDay * 7;
    patchIncome += incomeW;

    if (p.type === "Grain Field") {
      patchFood += isWinter ? yieldW * 0.5 : yieldW;
    } else if (p.type === "Timber Camp") patchTimber += yieldW;
    else if (p.type === "Iron Mine") patchIron += yieldW;
    else if (p.type === "Stone Quarry") patchStone += yieldW;
  });

  if (isNecro) {
    s.character.soulEssence = (s.character.soulEssence || 0) + 2;
    turnResult.eventLog.push(`Produção: +2 Essência de Alma colhida.`);
  } else {
    s.weeklyLedger.silverdew += holdingBaseIncome + patchIncome;
    s.weeklyLedger.food += patchFood;
    s.weeklyLedger.materials.timber += patchTimber;
    s.weeklyLedger.materials.iron += patchIron;
    s.weeklyLedger.materials.stone += patchStone;
    turnResult.incomeChanges = { holdings: holdingBaseIncome, patches: patchIncome };
    turnResult.foodChanges = patchFood;
    turnResult.eventLog.push(`Produção: ${holdingBaseIncome + patchIncome} SD gerados, ${patchFood.toFixed(1)} FSU coletados.`);
  }

  // 3. Consumption (PHASE 2)
  let totalWages = 0;
  let totalMilitaryUnitsSize = 0;
  const activeTroopUnits: { size: number; morale: number }[] = [];

  s.army.units.forEach((u) => {
    if (u.morale <= 0) return;
    if (u.type !== "Skeletons" && u.type !== "Skeleton Archers" && !isNecro) {
      activeTroopUnits.push(u);
      totalMilitaryUnitsSize += u.size;
    }
  });

  if (!isNecro) {
    totalMilitaryUnitsSize += s.holdings.garrison;

    // Use PayrollService for canonical military wage calculations
    const wageCalculation = PayrollService.calculateMilitaryWages(
      activeTroopUnits.map(u => u.size),
      s.holdings.garrison
    );
    totalWages = wageCalculation.totalWages;

    // Use FoodService for military food consumption calculation
    const totalFoodConsumption = FoodService.calculateMilitaryConsumption(totalMilitaryUnitsSize);

    const foodOutcome = FoodService.applyFoodConsumption(
      { treasuryFsu: s.weeklyLedger.food, famineTicks: s.weeklyLedger.famineTicks },
      totalFoodConsumption
    );

    if (!foodOutcome.famineStarted) {
      s.weeklyLedger.food = foodOutcome.consumed;
      turnResult.foodChanges -= totalFoodConsumption;
    } else {
      s.weeklyLedger.food = 0;
      turnResult.militaryChanges.moralePenalty += 1; // Fome gera penalidade
      s.army.units.forEach(u => {
        u.morale = Math.max(1, u.morale - 1);
        const deserters = Math.floor(u.size * 0.1);
        u.size -= deserters;
        turnResult.militaryChanges.desertions += deserters;
        turnResult.eventLog.push(`Fome: ${deserters} homens desertaram.`);
      });
    }

    const treasuryOutcome = TreasuryService.deductExpenses(
      { treasurySd: s.weeklyLedger.silverdew },
      totalWages
    );

    if (!treasuryOutcome.defaulted) {
      s.weeklyLedger.silverdew = treasuryOutcome.expensesDeducted; // remaining SD
      turnResult.militaryChanges.wagesPaid = totalWages;
      const payrollState = { units: s.army.units, unpaidTicks: s.weeklyLedger.unpaidWagesTicks };
      PayrollService.applyPaymentOutcome(payrollState, true);
      s.weeklyLedger.unpaidWagesTicks = 0;
    } else {
      s.weeklyLedger.silverdew = 0;
      turnResult.militaryChanges.moralePenalty += 2;
      const payrollState = { units: s.army.units, unpaidTicks: s.weeklyLedger.unpaidWagesTicks };
      PayrollService.applyPaymentOutcome(payrollState, false);
      s.weeklyLedger.unpaidWagesTicks = payrollState.unpaidTicks;

      // Resolve unpaid wage streak desertions via PayrollService and globalRNG
      const desertionCheck = PayrollService.resolveDesertion(s.weeklyLedger.unpaidWagesTicks, globalRNG);
      if (desertionCheck.deserted && desertionCheck.deserterCount > 0) {
        const actualDeserters = PayrollService.applyDesertionToUnits(s.army.units, desertionCheck.deserterCount);
        turnResult.militaryChanges.desertions += actualDeserters;
        turnResult.eventLog.push(`Salários Atrasados: ${actualDeserters} soldados desertaram por falta de pagamento.`);
      }
    }
  }

  // False Lineage Upkeep tick
  if (s.falseLineage && s.falseLineage.active) {
    if (!s.falseLineage.isExposed) {
      if (s.weeklyLedger.silverdew >= s.falseLineage.weeklyUpkeep) {
        s.weeklyLedger.silverdew -= s.falseLineage.weeklyUpkeep;
        turnResult.eventLog.push(`SUSSURROS DA LINHAGEM: Foram pagos -${s.falseLineage.weeklyUpkeep} SD em propinas e silêncio para manter a mentira de sua linhagem real ativa.`);
        
        // Random chance of exposure per week (based on exposureChance)
        if (globalRNG.next() < s.falseLineage.exposureChance) {
          s.falseLineage.isExposed = true;
          s.worldLedger.nobleHouses.forEach(h => setHouseOpinion(h, -3));
          s.character.reputation = 0;
          s.army.units.forEach(u => {
            u.morale = Math.max(1, u.morale - 2);
            u.size = Math.max(0, u.size - Math.floor(u.size * 0.25));
          });
          turnResult.eventLog.push(`EXPOSIÇÃO REAL! Boatos e vazamentos heráldicos de genealogistas descontentes expuseram sua farsa à corte! Todas as Casas Nobres reagiram com ira e nojo (-3 de Opinião com todas), sua Reputação desabou para 0, e a quebra de honra causou pânico e deserções em seu exército.`);
        }
      } else {
        // Exposed because can't pay
        s.falseLineage.isExposed = true;
        s.worldLedger.nobleHouses.forEach(h => setHouseOpinion(h, -3));
        s.character.reputation = 0;
        s.army.units.forEach(u => {
          u.morale = Math.max(1, u.morale - 2);
          u.size = Math.max(0, u.size - Math.floor(u.size * 0.3));
        });
        turnResult.eventLog.push(`EXPOSIÇÃO REAL! Seus cofres ficaram vazios e você não pôde pagar as moedas de silêncio exigidas. Sua mentira real ruiu publicamente! Todas as Casas Nobres reagiram com ira extrema (-3 de Opinião com todas), sua Reputação caiu para 0, e 30% do exército desertou imediatamente.`);
      }
    } else {
      turnResult.eventLog.push(`ESCÂNDALO REAL: A mentira de sua linhagem nobre fabricada continua exposta. Casas Nobres se recusam a negociar com um impostor.`);
    }
  }

  // World secrets dynamic decay and obsolete shift
  if (s.worldSecrets) {
    s.worldSecrets.forEach(sec => {
      if (!sec.revealed && sec.obsoleteInWeeks !== undefined) {
        sec.obsoleteInWeeks -= 1;
        if (sec.obsoleteInWeeks <= 0) {
          sec.obsoleteInWeeks = globalRNG.nextInt(6, 11);
          sec.investigationProgress = 0;
          sec.difficultyClass = (sec.difficultyClass || 14) + (globalRNG.next() > 0.5 ? 1 : -1);
          sec.difficultyClass = Math.max(10, Math.min(22, sec.difficultyClass));
          
          if (sec.id === 'secret_1') {
            sec.title = 'A Herdeira Oculta de Outro Clã';
            sec.description = 'Os ventos da intriga mudaram. Rumores sobre Lyra esfriaram, mas novos sussurros apontam para um bastardo esquecido de um clã montanhês no oeste.';
            sec.outcomeDesc = 'CONFIRMADO! O bastardo herdeiro chama-se Julian e lidera batedores ocidentais. Você ganha +10 de Opinião com a Casa principal do Oeste se o nomear cavaleiro.';
          } else if (sec.id === 'secret_2') {
            sec.title = 'O Novo Acordo do Marechal Ren';
            sec.description = 'A dívida antiga de Ren foi saldada por mercadores rivais. Agora, os boatos dizem que sua guarnição está secretamente vendendo provisões militares.';
            sec.outcomeDesc = 'CONFIRMADO! Marshal Ren está desviando rações. Você pode chantageá-lo para forçar uma queda de 3 semanas na provisão de comida de qualquer castelo cercado por ele.';
          } else if (sec.id === 'secret_3') {
            sec.title = 'A Clareira da Sálvia Negra';
            sec.description = 'As colheitas na clareira mística oriental cessaram. Novas pistas apontam para uma gruta escondida no norte que contém sálvia negra curativa.';
            sec.outcomeDesc = 'CONFIRMADO! A gruta de sálvia negra foi mapeada. Você ganha +20 FSU e purifica permanentemente quaisquer infecções de praga ativas em suas terras.';
          }
          turnResult.eventLog.push(`INTRIGAS FLUIDAS: O tempo passou e as circunstâncias de "${sec.title}" mudaram. O mistério antigo esfriou e novas pistas surgiram em outras paragens.`);
        }
      }
    });
  }

  // 4. Random events
  s.worldLedger.nobleHouses.forEach((house) => {
    const drift = globalRNG.nextInt(1, 6);
    if (drift === 1) adjustHouseOpinion(house, -1);
    else if (drift === 6) adjustHouseOpinion(house, 1);
  });

  if (globalRNG.next() < 0.02) {
    const eventRoll = globalRNG.nextInt(0, 2);
    if (eventRoll === 0 && !s.worldLedger.rareEventStatus.warmYear.active) {
      s.worldLedger.rareEventStatus.warmYear.active = true;
      turnResult.eventLog.push("RUMOR: Ano Quente iminente.");
    } else if (eventRoll === 1 && !s.worldLedger.rareEventStatus.youngPretender.active) {
      s.worldLedger.rareEventStatus.youngPretender.active = true;
      s.worldLedger.rareEventStatus.youngPretender.region = globalRNG.pick(REGIONS);
      turnResult.eventLog.push("RUMOR: Jovem pretendente ao trono surgiu.");
    }
  }

  return { updatedState: s, turnResult };
}

// Generate human-readable save state block
export function exportStateToText(state: CampaignState): string {
  const jsonStr = JSON.stringify(state);
  const base64Str = btoa(encodeURIComponent(jsonStr));

  return `AGE OF SHATTERED OATHS CAMPAIGN SAVE FILE
CAMPAIGN ID: ${state.character.name} - Year ${state.worldLedger.currentDate.year}
VERSION: 4.7
--- JSON DATA START ---
${base64Str}
--- JSON DATA END ---

========================================
WORLD LEDGER (G.W) - ESTADO GLOBAL
========================================
DATA ATUAL: Dia ${state.worldLedger.currentDate.day} de ${state.worldLedger.currentDate.month.replace("_", " ")}, Ano ${state.worldLedger.currentDate.year}
ESTAÇÃO: ${state.weeklyLedger.season} | Clima: ${state.weeklyLedger.weather}

PERSONAGEM: ${state.character.name} da Casa ${state.character.house}
TÍTULO: ${state.character.title} | Reputação: ${state.character.reputation}
RECURSOS: ${state.weeklyLedger.silverdew} SD | ${state.weeklyLedger.food.toFixed(1)} FSU de Comida
EXÉRCITO: ${state.army.units.reduce((acc, u) => acc + u.size, 0)} guerreiros em campo.

HOLDING: ${state.holdings.name} (${state.holdings.type})
SITUADO EM: ${state.holdings.position}`;
}

// Import campaign state from text block
export function importStateFromText(textBlock: string): CampaignState {
  try {
    const startMarker = "--- JSON DATA START ---";
    const endMarker = "--- JSON DATA END ---";

    const startIdx = textBlock.indexOf(startMarker);
    const endIdx = textBlock.indexOf(endMarker);

    let parsedState: any = null;

    if (startIdx !== -1 && endIdx !== -1) {
      // Classic Base64 wrapped
      const b64 = textBlock.substring(startIdx + startMarker.length, endIdx).trim();
      const jsonStr = decodeURIComponent(atob(b64));
      parsedState = JSON.parse(jsonStr);
    } else {
      const trimmed = textBlock.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        // Raw JSON pasted directly
        parsedState = JSON.parse(trimmed);
      } else {
        // Try raw Base64 without markers
        try {
          const jsonStr = decodeURIComponent(atob(trimmed));
          parsedState = JSON.parse(jsonStr);
        } catch {
          throw new Error("Formato do save inválido. Por favor, cole o bloco de save inteiro ou um objeto JSON válido.");
        }
      }
    }

    if (!parsedState || typeof parsedState !== 'object') {
      throw new Error("O savegame fornecido não é um objeto de estado válido.");
    }

    // Auto-populate / sanitize defaults for missing structures
    const defaultState = createInitialState(
      parsedState.character?.archetype || "Noble Ruler", 
      parsedState.character?.location?.region || "Southern Mountains"
    );

    // Merge character safely
    const character = { ...defaultState.character, ...parsedState.character };
    character.stats = { ...defaultState.character.stats, ...parsedState.character?.stats };
    character.location = { ...defaultState.character.location, ...parsedState.character?.location };
    character.banner = { ...defaultState.character.banner, ...parsedState.character?.banner };
    character.nicknames = parsedState.character?.nicknames || defaultState.character.nicknames;

    // Sanitize character null overrides
    if (character.archetype === null || character.archetype === undefined) character.archetype = "Noble Ruler";
    if (character.gender === null || character.gender === undefined) character.gender = "Male";
    if (character.reputation === null || character.reputation === undefined) character.reputation = 0;
    if (character.stats.ac === null || character.stats.ac === undefined) character.stats.ac = 4;
    if (character.stats.initiativeBonus === null || character.stats.initiativeBonus === undefined) character.stats.initiativeBonus = 1;
    if (character.location.subregion === null || character.location.subregion === undefined) character.location.subregion = "The Frontier";
    if (character.location.distanceNearTown === null || character.location.distanceNearTown === undefined) character.location.distanceNearTown = 3;
    if (character.location.distanceNearCastle === null || character.location.distanceNearCastle === undefined) character.location.distanceNearCastle = 0;
    if (character.location.distanceCapital === null || character.location.distanceCapital === undefined) character.location.distanceCapital = 4;

    // Merge weeklyLedger safely
    const weeklyLedger = { ...defaultState.weeklyLedger, ...parsedState.weeklyLedger };
    weeklyLedger.materials = { ...defaultState.weeklyLedger.materials, ...parsedState.weeklyLedger?.materials };

    // Sanitize weeklyLedger null overrides
    if (weeklyLedger.week === null || weeklyLedger.week === undefined) weeklyLedger.week = 1;
    if (weeklyLedger.weather === null || weeklyLedger.weather === undefined) weeklyLedger.weather = "Cold and Windy";

    // Merge army safely
    const army = { ...defaultState.army, ...parsedState.army };
    army.garrisonDetail = parsedState.army?.garrisonDetail || parsedState.army?.garrison?.detail || parsedState.garrisonDetail || parsedState.garrison?.detail;
    army.commandStructure = parsedState.army?.commandStructure || parsedState.army?.chainOfCommand || parsedState.commandStructure || parsedState.chainOfCommand;
    army.militia = parsedState.army?.militia || parsedState.militia;
    
    if (parsedState.army?.units && Array.isArray(parsedState.army.units)) {
      army.units = parsedState.army.units.map((u: any, idx: number) => {
        const sizeVal = (u.size !== undefined && u.size !== null) ? u.size : 30;
        const maxSizeVal = (u.maxSize !== undefined && u.maxSize !== null) ? u.maxSize : sizeVal;
        return {
          id: `u_recruited_${globalRNG.nextInt(0, 1000000)}`,
          name: u.name || "Guarda Desconhecida",
          size: sizeVal,
          maxSize: maxSizeVal,
          tier: (u.tier !== undefined && u.tier !== null) ? u.tier : 1,
          ac: (u.ac !== undefined && u.ac !== null) ? u.ac : 3,
          weapon: u.weapon || "Spear",
          mount: u.mount || "None",
          morale: (u.morale !== undefined && u.morale !== null) ? u.morale : 5,
          type: u.type
        };
      });
    }

    // Merge holdings safely
    const holdings = { ...defaultState.holdings, ...parsedState.holdings };
    holdings.villages = parsedState.holdings?.villages || parsedState.villages || [];
    holdings.otherHoldings = parsedState.holdings?.otherHoldings || parsedState.otherHoldings || [];
    if (parsedState.holdings?.fortification) {
      holdings.fortification = { ...defaultState.holdings.fortification, ...parsedState.holdings.fortification };
    }
    if (parsedState.holdings?.residentSmith) {
      holdings.residentSmith = { ...defaultState.holdings.residentSmith, ...parsedState.holdings.residentSmith };
    }

    // Merge inventory safely
    const inventory = {
      horns: parsedState.inventory?.horns || defaultState.inventory.horns,
      smudgeBundles: {
        sage: parsedState.inventory?.smudgeBundles?.sage !== undefined ? parsedState.inventory.smudgeBundles.sage : 0,
        cedar: parsedState.inventory?.smudgeBundles?.cedar !== undefined ? parsedState.inventory.smudgeBundles.cedar : 0,
        sweetgrass: parsedState.inventory?.smudgeBundles?.sweetgrass !== undefined ? parsedState.inventory.smudgeBundles.sweetgrass : 0,
        tobacco: parsedState.inventory?.smudgeBundles?.tobacco !== undefined ? parsedState.inventory.smudgeBundles.tobacco : 0,
      }
    };

    // Merge advisors safely
    const advisors = { ...defaultState.advisors, ...parsedState.advisors };

    // Populate worldLedger
    const worldLedger = parsedState.worldLedger || defaultState.worldLedger;

    // Populate other missing sections
    const crowns = parsedState.crowns || defaultState.crowns;
    const worldSecrets = parsedState.worldSecrets || defaultState.worldSecrets;
    const falseLineage = parsedState.falseLineage || defaultState.falseLineage;
    const revealedRegions = parsedState.revealedRegions || defaultState.revealedRegions;
    const narrativeHistory = parsedState.narrativeHistory || defaultState.narrativeHistory;

    const mergedState: CampaignState = {
      ...defaultState,
      character,
      weeklyLedger,
      army,
      holdings,
      inventory,
      advisors,
      worldLedger,
      crowns,
      worldSecrets,
      falseLineage,
      revealedRegions,
      narrativeHistory,
      councils: parsedState.councils || defaultState.councils,
      spyNetwork: parsedState.spyNetwork || defaultState.spyNetwork,
      equipmentInventory: parsedState.equipmentInventory || defaultState.equipmentInventory,
      mountBreeding: parsedState.mountBreeding || parsedState.holdings?.mountBreeding,
      tradeRoutes: parsedState.tradeRoutes || parsedState.diplomacy?.tradeRoutes,
      caravanLedger: parsedState.caravanLedger || defaultState.caravanLedger,
      regionalTrade: parsedState.regionalTrade || defaultState.regionalTrade,
      tribalRelations: parsedState.tribalRelations || parsedState.diplomacy?.tribalRelations || defaultState.tribalRelations,
      meta: parsedState.meta,
      executiveBrief: parsedState.executiveBrief,
      characters: parsedState.characters,
      diplomacy: parsedState.diplomacy,
      livroNegroDetail: parsedState.livroNegroDetail,
      mercenaries: parsedState.mercenaries,
      fortalezasOrm: parsedState.fortalezasOrm,
      genealogy: parsedState.genealogy,
      distances: parsedState.distances,
      hiddenHeir: parsedState.hiddenHeir,
      discoveredArtifacts: parsedState.discoveredArtifacts || defaultState.discoveredArtifacts,
      family: parsedState.family || defaultState.family
    };

    return mergedState;
  } catch (error: any) {
    throw new Error(`Falha ao carregar campanha: ${error.message}`);
  }
}

// Simulate one round of deterministic Mass Combat
export function simulateCombatRound(
  playerUnit: ArmyUnit,
  enemyUnit: ArmyUnit,
  playerAction: 'Keep Attacking' | 'Defend' | 'Charge',
  enemyAction: 'Keep Attacking' | 'Defend' | 'Charge'
): {
  playerKills: number;
  enemyKills: number;
  combatLog: string[];
} {
  const combatLog: string[] = [];
  
  // Base attack modifiers based on choices
  // Base Pool = Weapon Dice + (People / 20)d6
  const playerBasePeopleDice = Math.max(1, Math.floor(playerUnit.size / 20));
  const enemyBasePeopleDice = Math.max(1, Math.floor(enemyUnit.size / 20));

  // Determine weapon base dice
  const getWeaponDice = (w: string) => {
    const wLower = w.toLowerCase();
    if (wLower.includes("dagger")) return 2;
    if (wLower.includes("axe")) return 4;
    if (wLower.includes("halberd")) return 4;
    return 3; // standard sword/spear
  };

  const pWepDice = getWeaponDice(playerUnit.weapon);
  const eWepDice = getWeaponDice(enemyUnit.weapon);

  let pDiceCount = pWepDice + playerBasePeopleDice;
  let eDiceCount = eWepDice + enemyBasePeopleDice;

  // Modify dice based on actions
  if (playerAction === "Charge") pDiceCount += 2;
  if (enemyAction === "Charge") eDiceCount += 2;
  if (playerAction === "Defend") eDiceCount = Math.max(1, eDiceCount - 1);
  if (enemyAction === "Defend") pDiceCount = Math.max(1, pDiceCount - 1);

  // Roll d6s and calculate hits against enemy AC
  const rollAttack = (dice: number, targetAC: number): { kills: number; rolls: number[] } => {
    let kills = 0;
    const rolls: number[] = [];
    for (let i = 0; i < dice; i++) {
      const r = globalRNG.nextInt(1, 6);
      rolls.push(r);
      if (r >= targetAC) {
        kills += 1;
      }
      if (r === 6) {
        kills += 1; // Critical hit: natural 6 = 2 kills
      }
    }
    return { kills, rolls };
  };

  const pAC = playerUnit.ac;
  const eAC = enemyUnit.ac;

  const playerRolls = rollAttack(pDiceCount, eAC);
  const enemyRolls = rollAttack(eDiceCount, pAC);

  const playerKills = Math.min(enemyUnit.size, playerRolls.kills);
  const enemyKills = Math.min(playerUnit.size, enemyRolls.kills);

  // Apply casualties
  playerUnit.size -= enemyKills;
  enemyUnit.size -= playerKills;

  combatLog.push(`Seu exército escolheu: [${playerAction}] | Inimigo escolheu: [${enemyAction}]`);
  combatLog.push(`Você lançou ${pDiceCount} dados de ataque contra a Armadura Class do inimigo (${eAC}).`);
  combatLog.push(`O inimigo lançou ${eDiceCount} dados de ataque contra sua Armadura Class (${pAC}).`);
  combatLog.push(`Baixas infligidas ao inimigo: ${playerKills} homens.`);
  combatLog.push(`Suas baixas nesta rodada: ${enemyKills} homens.`);

  return { playerKills, enemyKills, combatLog };
}
