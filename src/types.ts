export interface Character {
  name: string;
  house: string;
  age: number;
  gender: string;
  archetype: 'Noble Ruler' | 'Landed Knight' | 'Landless' | 'Artificer' | 'Necromancer';
  profession?: string;
  title: string;
  location: {
    region: string;
    subregion: string;
    landmark: string;
    distanceNearTown: number; // days
    distanceNearCastle: number; // days
    distanceCapital: number; // weeks
  };
  banner: {
    colors: string;
    symbol: string;
    motto: string;
  };
  stats: {
    commanderTier: number;
    bannerTier: number;
    ac: number;
    initiativeBonus: number;
    baseInitiative?: number;
    weapon: string;
    armor?: string;
    shield: string;
    mount: string;
    mountInjured?: boolean;
    mountInitiativeMod?: number;
    mountQuality: 'Common' | 'High-Grade' | 'Superb';
    weaponQuality: 'Common' | 'High-Grade' | 'Superb';
    armorQuality: 'Common' | 'High-Grade' | 'Superb';
    shieldQuality: 'Common' | 'High-Grade' | 'Superb';
  };
  reputation: number;
  nicknames: Array<{
    name: string;
    earned: string;
    date: string;
    effect: string;
  }>;
  flavorDetail?: string;
  backstory?: string;
  soulEssence?: number; // for Necromancer Lord
  controlUsed?: number; // for Necromancer Lord
  controlLimit?: number; // for Necromancer Lord
  isLich?: boolean; // for Necromancer Lord
  phylacteryLocation?: string; // for Necromancer Lord
}

export interface TurnResult {
  incomeChanges: Record<string, number>;
  foodChanges: number;
  militaryChanges: {
    wagesPaid: number;
    desertions: number;
    moralePenalty: number;
  };
  eventLog: string[]; // Apenas fatos mecânicos ocorridos
}

export interface CombatResult {
  playerKills: number;
  enemyKills: number;
  playerCasualties: number;
  enemyCasualties: number;
  moraleCheckTriggered: boolean;
  engagementStatus: string;
}

export interface WeeklyLedger {
  week: number;
  month: string;
  year: number;
  season: 'Thawtide' | 'Sunreach' | 'Reapingfall' | 'Deepfrost';
  weather: string;
  silverdew: number;
  food: number; // FSU
  famineTicks?: number;
  unpaidWagesTicks?: number;
  materials: {
    timber: number;
    iron: number;
    stone: number;
  };
  incomeDetail: {
    holdings: number;
    patches: number;
    trade: number;
    tribute: number;
    taxes: number;
    loot: number;
    other: number;
  };
  expenseDetail: {
    wages: number;
    garrison: number;
    foodPurchases: number;
    construction: number;
    recruitment: number;
    mercenaries: number;
    tributePaid: number;
    engineerWages: number;
    shipUpkeep: number;
    holdingMaintenance: number;
    other: number;
  };
}

export interface ArmyUnit {
  id: string;
  name: string;
  size: number;
  maxSize: number;
  tier: number;
  ac: number;
  weapon: string;
  mount: string;
  morale: number;
  type?: string; // 'Skeletons', 'Skeleton Archers', 'Levy', etc.
}

export interface Garrison {
  holdingName: string;
  soldiers: number;
  type?: string;
}

export interface Ship {
  name: string;
  type: string;
  captain: string;
  location: string;
  status: 'In Port' | 'At Sea' | 'Overdue' | 'Missing';
  hull: number; // %
  sails: number; // %
}

export interface ResourcePatch {
  id: string;
  name: string;
  type: 'Grain Field' | 'Iron Mine' | 'Timber Camp' | 'Stone Quarry' | 'Wool Farm' | 'Vineyard' | 'Salt Pan' | 'Tar Pit';
  tier: number;
  quality: 'Common' | 'High-Grade' | 'Superb';
  yieldPerDay: number;
  incomePerDay: number;
  laborRequired: number;
}

export interface Smith {
  name: string;
  level: number;
  xp: number;
  specialty: string;
}

export interface Holdings {
  name: string;
  type: 'Castle' | 'Fortified Town' | 'Bastion' | 'Walled City';
  tier: number;
  region: string;
  position: string;
  population: number;
  laborPool: number;
  garrison: number;
  fortification: {
    type: string;
    tier: number;
    acBonus: number;
    rangedRerolls: number;
    firstMeleeBonus: number;
  };
  resourcePatches: ResourcePatch[];
  residentSmith: Smith;
  granaryUpgrade: boolean;
  villages?: any[];
  otherHoldings?: any[];
}

export interface NobleHouse {
  name: string;
  region: string;
  currentLord: string;
  seat: string;
  tier: number;
  status: string;
  allies: string[];
  enemies: string[];
  opinion: number; // -3 to +3
  rumor: string;
  isRealRumor: boolean;
  population?: number;
  soldiers?: number;
  weeklyIncome?: number;
  relationshipDetail?: string;
}

export interface DetailedForces {
  garrisons: Array<{ location: string; soldiers: number; description?: string }>;
  fieldForce: number;      // Força de campo ativa
  trainedMilicia: number;  // Milícia treinada
  emergencyLevy: number;   // Levy emergencial disponível
}

export interface Village {
  name: string;
  status: 'Protectorate' | 'Embargoed' | 'Burnt' | 'Uncontacted' | 'Independent';
  subordination: string; // "Valenfort Protectorate", "None", etc.
  notes: string;
}

export interface Outpost {
  name: string;
  tier: number;
  garrison: number;
  incomeBonus: number; // SD/mês
  notes: string;
}

export interface CouncilMember {
  name: string;
  role: string;
  disposition: number; // 1 a 6
  loyalty: number; // 1 a 6
}

export interface Council {
  name: string;
  seats: CouncilMember[];
  emergencyFund: number; // SD
  pendingAgendas: string[];
}

export interface SpyAgent {
  id: string;
  location: string;
  codename: string;
  status: 'Active' | 'Compromised' | 'MIA';
}

export interface EspionageNetwork {
  agents: SpyAgent[];
  activeIntelligence: string[];
  weeklyUpkeep: number; // em SD
}

export interface TribalRelation {
  tribeName: string;
  leader: string;
  opinion: 'Friendly' | 'Neutral' | 'Hostile' | 'Eliminated';
  details: string;
  soldiersEstimate?: string;
}

export interface EquipmentStock {
  cuirasses: number;
  chainmail: number;
  plateArmor: number;
  shields: number;
  spears: number;
  shortswords: number;
  longbows: number;
  winterClothes: number;
  productionDetails?: string;
}

export interface TradeRoute {
  target: string;
  status: 'Active' | 'Embargoed' | 'Inactive';
  details: string;
}

export interface Caravan {
  id: string;
  name: string;
  leader: string;
  guardDetails: string;
  status: string;
  weekLaunched: number;
}

export interface GMSecret {
  id: string;
  description: string;
  revealed: boolean;
  consequences?: string;
}

export interface CampaignState {
  character: Character;
  weeklyLedger: WeeklyLedger;
  army: {
    units: ArmyUnit[];
    garrisonSize: number;
    detailedForces?: DetailedForces;
    garrisonDetail?: any;
    commandStructure?: any;
    militia?: any;
    garrison?: any;
    chainOfCommand?: any;
  };
  holdings: Holdings;
  ships: Ship[];
  sessionLog: {
    lastSessionDate: string;
    lastThingHappened: string;
    activeMissions: Array<{
      type: string;
      unitName: string;
      returnsDay: number;
      returnsMonth: string;
      details: string;
    }>;
    pendingDecisions: string[];
  };
  worldLedger: {
    currentDate: { day: number; month: string; year: number; week: number };
    activeConflicts: Array<{
      conflict: string;
      sides: string;
      startDate: string;
      status: string;
      outcome?: string;
    }>;
    majorEvents: Array<{
      date: string;
      event: string;
      region: string;
      involved: string;
      resolved: string;
    }>;
    nobleHouses: NobleHouse[];
    rareEventStatus: {
      warmYear: { active: boolean; lastOccurredYear: number };
      youngPretender: { active: boolean; region?: string; followers?: number };
      snowBearMigration: { active: boolean; bearsRemaining?: number };
      blindTraveler: { active: boolean; lastSeenYear?: number };
      schemer: { active: boolean; lord?: string };
    };
    marketConditions: Record<string, {
      tradeVolume: 'Low' | 'Medium' | 'High';
      priceTrend: 'Stable' | 'Rising' | 'Falling';
      shortages: string;
    }>;
    weatherHistory: string[]; // Last 4 weeks
    notableDeaths: Array<{ name: string; title: string; date: string; cause: string; successor: string }>;
    villages?: Village[];
    outposts?: Outpost[];
    councils?: Council[];
    espionage?: EspionageNetwork;
    tribalRelations?: TribalRelation[];
    equipmentStock?: EquipmentStock;
    tradeRoutes?: TradeRoute[];
    caravanas?: Caravan[];
    gmSecrets?: GMSecret[];
  };
  crowns: RegionalCrown[];
  inventory: PlayerInventory;
  family: HouseFamily;
  worldSecrets?: Array<{
    id: string;
    title: string;
    description: string;
    revealed: boolean;
    investigationProgress: number;
    category: 'Dynasty' | 'Military' | 'Plot';
    outcomeDesc?: string;
    difficultyClass?: number;
    criticality?: 'Low' | 'Medium' | 'High' | 'Critical';
    compromisedChance?: number;
    corrupted?: boolean;
    obsoleteInWeeks?: number;
    originLocation?: string;
    originTurn?: number;
  }>;
  advisors?: {
    counselorName: string;
    stewardName: string;
    spyMasterName: string;
  };
  revealedRegions?: string[];
  falseLineage?: {
    active: boolean;
    forgeryProgress: number;
    weeklyUpkeep: number;
    documentsForged: boolean;
    bribesPaid: boolean;
    exposureChance: number;
    isExposed: boolean;
  };
  narrativeHistory?: string[];
  councils?: any;
  spyNetwork?: any;
  equipmentInventory?: any;
  mountBreeding?: any;
  tradeRoutes?: any;
  caravanLedger?: any;
  regionalTrade?: any;
  tribalRelations?: any;
  meta?: any;
  executiveBrief?: any;
  characters?: any;
  diplomacy?: any;
  livroNegroDetail?: any;
  mercenaries?: any;
  fortalezasOrm?: any;
  genealogy?: any;
  distances?: any;
  hiddenHeir?: any;
  discoveredArtifacts?: Array<{
    name: string;
    description: string;
    origin?: string;
    properties?: string;
    locationFound?: string;
    type?: string;
    weekFound?: number;
  }>;
}

export interface RegionalCrown {
  id: 'blood' | 'contracts' | 'roots' | 'greendrake' | 'stone' | 'northwind' | 'felt' | 'settled' | 'rubicon';
  name: string;
  region: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  requirements: string[];
}

export interface WarHorn {
  id: string;
  name: string;
  type: 'Hunting' | 'Battle' | 'War' | 'Clan' | 'Oath' | 'Mourning';
  sound: string;
  broken: boolean;
}

export interface FamilySpouse {
  name: string;
  house: string;
  age: number;
  affection: number;
}

export interface FamilyChild {
  name: string;
  age: number;
  gender: string;
  isHeir: boolean;
  alive: boolean;
}

export interface HouseFamily {
  spouse?: FamilySpouse;
  children: FamilyChild[];
  betrothedHouse?: string;
  pregnancyWeekRemaining?: number;
}

export interface PlayerInventory {
  horns: WarHorn[];
  smudgeBundles: {
    sage: number;
    cedar: number;
    sweetgrass: number;
    tobacco: number;
  };
}

