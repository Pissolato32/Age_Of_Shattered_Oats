import { CampaignState, NobleHouse, ResourcePatch } from "./types";

export const MONTHS = [
  "Frostwane",
  "Deepfrost",
  "Thawrise",
  "Greening",
  "Highsun_1",
  "Highsun_2",
  "Harvestfall_1",
  "Harvestfall_2",
  "Ashfall_1",
  "Ashfall_2",
  "Longdark_1",
  "Longdark_2"
];

export const REGIONS = [
  "Central Plains",
  "Western Rivers",
  "Eastern Forests",
  "Southern Mountains",
  "Northern Snowlands",
  "Nomad Steppe"
];

export interface ArmorItemSpec {
  id: string;
  name: string;
  armorClass: number;
  initiativeMod: number;
  costSd: number;
}

export interface ShieldItemSpec {
  id: string;
  name: string;
  armorClassMod: number;
  initiativeMod: number;
  costSd: number;
}

export interface MountItemSpec {
  id: string;
  name: string;
  initiativeMod: number;
  costSd: number;
}

export const ARMOR_SPECS: Record<string, ArmorItemSpec> = {
  cloth: { id: "cloth", name: "Cloth / None", armorClass: 2, initiativeMod: 1, costSd: 0 },
  leather: { id: "leather", name: "Leather", armorClass: 3, initiativeMod: 0, costSd: 10 },
  chain: { id: "chain", name: "Chain", armorClass: 4, initiativeMod: -1, costSd: 25 },
  plate: { id: "plate", name: "Plate", armorClass: 5, initiativeMod: -2, costSd: 50 }
};

export const SHIELD_SPECS: Record<string, ShieldItemSpec> = {
  standard_shield: { id: "standard_shield", name: "Standard Shield", armorClassMod: 1, initiativeMod: 0, costSd: 5 },
  shield: { id: "shield", name: "Standard Shield", armorClassMod: 1, initiativeMod: 0, costSd: 5 },
  heater_shield: { id: "heater_shield", name: "Heater / Kite Shield", armorClassMod: 1, initiativeMod: 0, costSd: 10 },
  tower_shield: { id: "tower_shield", name: "Tower Shield", armorClassMod: 1, initiativeMod: -1, costSd: 20 }
};

export const MOUNT_SPECS: Record<string, MountItemSpec> = {
  riding_horse: { id: "riding_horse", name: "Riding Horse", initiativeMod: 1, costSd: 30 },
  courser: { id: "courser", name: "Courser", initiativeMod: 2, costSd: 60 },
  warhorse: { id: "warhorse", name: "Warhorse", initiativeMod: 2, costSd: 100 },
  destrier: { id: "destrier", name: "Destrier", initiativeMod: 1, costSd: 120 },
  draft_warhorse: { id: "draft_warhorse", name: "Draft Warhorse", initiativeMod: 0, costSd: 40 }
};

export const INITIAL_HOUSES: NobleHouse[] = [
  // Northern Snowlands (G.R3)
  {
    name: "House Ironhand",
    region: "Northern Snowlands",
    currentLord: "Lord Harald Ironhand",
    seat: "Harald's Hold",
    tier: 6,
    status: "Great House",
    allies: ["House Frosthold"],
    enemies: ["House Winterwolf"],
    opinion: 0,
    rumor: "Dizem que Lorde Harald nunca quebrou um juramento em 30 anos.",
    isRealRumor: true
  },
  {
    name: "House Winterwolf",
    region: "Northern Snowlands",
    currentLord: "Lord Ragnar Winterwolf",
    seat: "Wolf's Den",
    tier: 4,
    status: "Minor Lord",
    allies: ["House Icefang"],
    enemies: ["House Ironhand"],
    opinion: -1,
    rumor: "Dizem que eles alimentam lobos de gelo com prisioneiros.",
    isRealRumor: false
  },
  {
    name: "House Frostpeak",
    region: "Northern Snowlands",
    currentLord: "Lord Sven Frostpeak",
    seat: "Frostpeak Tower",
    tier: 3,
    status: "Minor Lord",
    allies: [],
    enemies: [],
    opinion: 0,
    rumor: "Eles estão estocando peles para um inverno terrível.",
    isRealRumor: true
  },
  // Central Plains (G.R1)
  {
    name: "House Stormcrown",
    region: "Central Plains",
    currentLord: "Lorde Alric Stormcrown",
    seat: "Grey Keep",
    tier: 5,
    status: "Great House",
    allies: ["House Grey"],
    enemies: ["House Blackmere"],
    opinion: 0,
    rumor: "O pai de Alric defendeu o desfiladeiro contra três invasões.",
    isRealRumor: true
  },
  {
    name: "House Ironhold",
    region: "Central Plains",
    currentLord: "Lord Decimus Ironhold",
    seat: "Ironhold Castle",
    tier: 5,
    status: "Great House",
    allies: ["House Stonehill"],
    enemies: [],
    opinion: 0,
    rumor: "Sua mina de ferro secreta está perto de esgotar.",
    isRealRumor: false
  },
  {
    name: "House Goldcrest",
    region: "Central Plains",
    currentLord: "Lady Aurelia Goldcrest",
    seat: "Goldcrest Hall",
    tier: 4,
    status: "Minor Lord",
    allies: ["House Sunfield"],
    enemies: [],
    opinion: 0,
    rumor: "Eles abrigam foras-da-lei sob o pretexto de caridade.",
    isRealRumor: true
  },
  {
    name: "House Riverford",
    region: "Central Plains",
    currentLord: "Lord Gaius Riverford II",
    seat: "Riverford Keep",
    tier: 3,
    status: "Minor Lord",
    allies: [],
    enemies: [],
    opinion: 0,
    rumor: "O senhor atual comprou o título de um conde falido.",
    isRealRumor: false
  },
  // Western Rivers (G.R6)
  {
    name: "House Velrin",
    region: "Western Rivers",
    currentLord: "Lord Jacques Velrin",
    seat: "Velrinport",
    tier: 5,
    status: "Great House",
    allies: ["House Dockside"],
    enemies: ["House Blackwater"],
    opinion: 0,
    rumor: "Eles cobram taxas abusivas em cada barca que passa.",
    isRealRumor: true
  },
  {
    name: "House Three Bridges",
    region: "Western Rivers",
    currentLord: "Lord Remy Bridges",
    seat: "Bridgefort",
    tier: 4,
    status: "Minor Lord",
    allies: ["House Tollman"],
    enemies: [],
    opinion: 0,
    rumor: "A ponte de pedra esconde passagens usadas por contrabandistas.",
    isRealRumor: true
  },
  {
    name: "House Blackwater",
    region: "Western Rivers",
    currentLord: "Lord Luc Blackwater",
    seat: "Blackwater Keep",
    tier: 3,
    status: "Minor Lord",
    allies: [],
    enemies: ["House Velrin"],
    opinion: -1,
    rumor: "Eles envenenaram os poços de Fenwick.",
    isRealRumor: false
  },
  // Eastern Forests (G.R5)
  {
    name: "House Greenwood",
    region: "Eastern Forests",
    currentLord: "Lord Aldric Greenwood",
    seat: "Greenwood Hall",
    tier: 5,
    status: "Great House",
    allies: ["House Oakenshield"],
    enemies: ["House Thornwood"],
    opinion: 0,
    rumor: "Lorde Aldric tem sangue da lenda do Dragão Verde.",
    isRealRumor: true
  },
  {
    name: "House Thornwood",
    region: "Eastern Forests",
    currentLord: "Lord Rowen Thornwood",
    seat: "Thornwall",
    tier: 4,
    status: "Minor Lord",
    allies: ["House Briar"],
    enemies: ["House Greenwood"],
    opinion: -1,
    rumor: "Eles pagam tributo a bandidos para manter a floresta livre de rivais.",
    isRealRumor: false
  },
  {
    name: "House Deepforest",
    region: "Eastern Forests",
    currentLord: "Lady Elara Deepforest",
    seat: "Hidden Glade",
    tier: 3,
    status: "Minor Lord",
    allies: [],
    enemies: [],
    opinion: 0,
    rumor: "Os ancestrais falam diretamente com Lady Elara através das árvores.",
    isRealRumor: true
  },
  // Southern Mountains (G.R4)
  {
    name: "House Highpeak",
    region: "Southern Mountains",
    currentLord: "Lord Callum Highpeak",
    seat: "Highpeak Keep",
    tier: 5,
    status: "Great House",
    allies: ["House Cliffside"],
    enemies: [],
    opinion: 0,
    rumor: "Callum está secretamente minerando prata pura.",
    isRealRumor: true
  },
  {
    name: "House Stoneguard",
    region: "Southern Mountains",
    currentLord: "Lord Ewan Stoneguard",
    seat: "Stoneguard Pass",
    tier: 5,
    status: "Great House",
    allies: ["House Passkeeper"],
    enemies: [],
    opinion: 0,
    rumor: "Qualquer um sem sangue das montanhas será rejeitado nas tumbas.",
    isRealRumor: true
  },
  {
    name: "House Ironridge",
    region: "Southern Mountains",
    currentLord: "Lord Brogan Ironridge",
    seat: "Ironridge Fortress",
    tier: 4,
    status: "Minor Lord",
    allies: ["House Minekeep"],
    enemies: [],
    opinion: 0,
    rumor: "Os ferreiros de Ironridge descobriram a fórmula do aço temperado.",
    isRealRumor: true
  }
];

export const PREGEN_CHARACTERS: CampaignState[] = [
  {
    character: {
      name: "Lord Alric",
      house: "Stormcrown",
      age: 34,
      gender: "Male",
      archetype: "Noble Ruler",
      title: "Warden of the March",
      location: {
        region: "Central Plains",
        subregion: "The Three Corners",
        landmark: "Grey Keep",
        distanceNearTown: 2,
        distanceNearCastle: 0,
        distanceCapital: 5
      },
      banner: {
        colors: "Deep Blue and Silver",
        symbol: "Wolf over storm clouds",
        motto: "We Hold the March"
      },
      stats: {
        commanderTier: 3,
        bannerTier: 2,
        ac: 5,
        initiativeBonus: 0,
        weapon: "Sword (Superb)",
        shield: "Heater",
        mount: "Warhorse",
        mountQuality: "High-Grade",
        weaponQuality: "Superb",
        armorQuality: "High-Grade",
        shieldQuality: "High-Grade"
      },
      reputation: 5,
      nicknames: [{ name: "The Unbroken", earned: "Defended Stonebridge alone", date: "Y12", effect: "+5% intimidation" }],
      flavorDetail: "The walls of Grey Keep are built from stone that weeps in winter.",
      backstory: "My father held this pass against three invasions. I will not be the one who loses it."
    },
    weeklyLedger: {
      week: 1,
      month: "Greening",
      year: 342,
      season: "Thawtide",
      weather: "Clear, windy",
      silverdew: 300,
      food: 8.0,
      materials: { timber: 20, iron: 10, stone: 0 },
      incomeDetail: { holdings: 225, patches: 75, trade: 0, tribute: 0, taxes: 0, loot: 0, other: 0 },
      expenseDetail: { wages: 6, garrison: 0, foodPurchases: 0, construction: 0, recruitment: 0, mercenaries: 0, tributePaid: 0, engineerWages: 0, shipUpkeep: 0, holdingMaintenance: 0, other: 0 }
    },
    army: {
      units: [
        { id: "u1", name: "Landed Retinue", size: 60, maxSize: 100, tier: 1, ac: 3, weapon: "Spear", mount: "None", morale: 4 }
      ],
      garrisonSize: 80,
      detailedForces: {
        garrisons: [
          { location: "Valenfort (Sede)", soldiers: 165, description: "Guarnição principal no castelo e muralhas" },
          { location: "Torre Leste", soldiers: 20, description: "Guarnição militar controlando o pedágio" },
          { location: "Torre de Corvopedra", soldiers: 10, description: "Posto avançado de observação" },
          { location: "Posto Sul", soldiers: 30, description: "Guarnição mista Valenfort e Ashford" },
          { location: "Forte da Vigília Cega", soldiers: 10, description: "Sentinelas das montanhas orientais" },
          { location: "Fortaleza Subterrânea de Fenrir", soldiers: 20, description: "Guarnição de guarda das minas de prata" }
        ],
        fieldForce: 100,
        trainedMilicia: 80,
        emergencyLevy: 300
      }
    },
    holdings: {
      name: "Grey Keep",
      type: "Bastion",
      tier: 2,
      region: "Central Plains",
      position: "Three days east of River Caedor",
      population: 1200,
      laborPool: 480,
      garrison: 80,
      fortification: {
        type: "Stone Wall",
        tier: 2,
        acBonus: 2,
        rangedRerolls: 2,
        firstMeleeBonus: 1
      },
      resourcePatches: [
        { id: "p1", name: "Shattered Hills Timber", type: "Timber Camp", tier: 1, quality: "Common", yieldPerDay: 2, incomePerDay: 5, laborRequired: 8 },
        { id: "p2", name: "Caedor Grasslands", type: "Grain Field", tier: 1, quality: "Common", yieldPerDay: 2, incomePerDay: 2.5, laborRequired: 5 }
      ],
      residentSmith: { name: "Old Brennan", level: 2, xp: 45, specialty: "Weapons" },
      granaryUpgrade: false
    },
    ships: [],
    sessionLog: {
      lastSessionDate: "Greening Day 1, Year 342",
      lastThingHappened: "Assumiu o controle do feudo e foi alertado sobre movimentações militares estranhas.",
      activeMissions: [],
      pendingDecisions: ["Preparar o castelo para um possível cerco", "Enviar batedores para Viremont"]
    },
    worldLedger: {
      currentDate: { day: 1, month: "Greening", year: 342, week: 1 },
      activeConflicts: [
        { conflict: "Stormcrown-Blackmere Feud", sides: "Stormcrown vs Blackmere", startDate: "Year 312", status: "Ongoing" }
      ],
      majorEvents: [
        { date: "Highsun 10, Year 340", event: "Battle of Crimson Field", region: "Central Plains", involved: "Viremont vs Blackmere", resolved: "Viremont Victory" }
      ],
      nobleHouses: [
        {
          name: "House Gray",
          region: "Central Plains",
          currentLord: "Lord Gerold Gray",
          seat: "Graystone",
          tier: 3,
          status: "Allied House",
          allies: ["House Stormcrown"],
          enemies: ["House Blackmere"],
          opinion: 3,
          rumor: "Estão dispostos a marchar caso o conflito estoure.",
          isRealRumor: true,
          population: 3000,
          soldiers: 120,
          weeklyIncome: 200,
          relationshipDetail: "Aliado"
        },
        {
          name: "House Bronzeford",
          region: "Central Plains",
          currentLord: "Lord Aldren Bronzeford",
          seat: "Bronze Keep",
          tier: 2,
          status: "Allied House",
          allies: ["House Stormcrown"],
          enemies: [],
          opinion: 2,
          rumor: "Garantem suprimento de metal se a rota comercial for mantida.",
          isRealRumor: true,
          population: 1500,
          soldiers: 60,
          weeklyIncome: 120,
          relationshipDetail: "Aliado"
        },
        {
          name: "House Stonebrook",
          region: "Central Plains",
          currentLord: "Lord Garrick Stonebrook",
          seat: "Stonebrook Hall",
          tier: 2,
          status: "Minor House",
          allies: [],
          enemies: [],
          opinion: 0,
          rumor: "Estão relutantes em enviar tropas fora de suas terras.",
          isRealRumor: false,
          population: 1200,
          soldiers: 40,
          weeklyIncome: 100,
          relationshipDetail: "Ausente"
        },
        {
          name: "House Ashford",
          region: "Central Plains",
          currentLord: "Lady Seren Ashford",
          seat: "Ashford Manor",
          tier: 2,
          status: "Minor House",
          allies: ["House Stormcrown"],
          enemies: [],
          opinion: 1,
          rumor: "Ainda choram suas baixas da última escaramuça no vale.",
          isRealRumor: true,
          population: 1200,
          soldiers: 40,
          weeklyIncome: 100,
          relationshipDetail: "Luto"
        }
      ],
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
        "Eastern Forests": { tradeVolume: "Medium", priceTrend: "Stable", shortages: "Iron" }
      },
      weatherHistory: ["Clear", "Light rain", "Cool, overcast", "Clear"],
      notableDeaths: [],
      villages: [
        { name: "Falcoa", status: "Protectorate", subordination: "Valenfort Protectorate", notes: "Protetorado voluntário: recebe proteção militar em troca de comércio aberto." },
        { name: "Pedra Alta", status: "Embargoed", subordination: "Under Military Administration", notes: "Sob embargo e administração temporária de Dona Lira após traição de Alberico." },
        { name: "Vila do Vale", status: "Burnt", subordination: "Joint Ashford-Valenfort Garrison", notes: "Destruída em incêndio; convertida em Posto Sul avançado de vigilância." },
        { name: "Clã do Rio", status: "Uncontacted", subordination: "None", notes: "Clã livre e isolado; ainda sem interação direta estabelecida." }
      ],
      outposts: [
        { name: "Torre Leste", tier: 1, garrison: 20, incomeBonus: 75, notes: "Pedágio militar e posto de observação na estrada oriental." },
        { name: "Torre de Corvopedra", tier: 1, garrison: 10, incomeBonus: 0, notes: "Sentinela de fronteira de baixo custo." },
        { name: "Posto Sul", tier: 1, garrison: 30, incomeBonus: 0, notes: "Reconstrução da antiga Vila do Vale; guarnição mista." },
        { name: "Forte da Vigília Cega", tier: 1, garrison: 10, incomeBonus: 0, notes: "Guarita isolada nas escarpas superiores." },
        { name: "Fortaleza Subterrânea de Fenrir", tier: 2, garrison: 20, incomeBonus: 400, notes: "Minas de prata ativas vigiadas e operadas; Baldur na forja." }
      ],
      councils: [
        {
          name: "Conselho Senhorial de Grey Keep",
          seats: [
            { name: "Lorde Aldren", role: "Conselheiro de Guerra", disposition: 6, loyalty: 6 },
            { name: "Lorde Gerold", role: "Conselheiro Político", disposition: 6, loyalty: 6 },
            { name: "Lady Seren", role: "Representante das Terras Baixas", disposition: 4, loyalty: 4 },
            { name: "Lady Elara", role: "Conselheira de Assuntos Internos", disposition: 6, loyalty: 6 },
            { name: "Lorde Roric", role: "Comandante da Guarda", disposition: 6, loyalty: 6 },
            { name: "Lorde Garrick", role: "Conselheiro de Finanças", disposition: 5, loyalty: 5 }
          ],
          emergencyFund: 0,
          pendingAgendas: ["Regularizar comércio com Falcoa", "Garantir rotas contra salteadores"]
        },
        {
          name: "Conselho da Passagem Cinzenta",
          seats: [
            { name: "Dona Lira", role: "Administradora Temporária", disposition: 5, loyalty: 5 },
            { name: "Capitão Sorrel", role: "Líder de Escolta", disposition: 6, loyalty: 6 }
          ],
          emergencyFund: 500,
          pendingAgendas: ["Estabilizar Pedra Alta", "Consolidar fundo de comércio de primavera"]
        }
      ],
      espionage: {
        agents: [
          { id: "sp1", location: "Valenfort", codename: "Sombra 1", status: "Active" },
          { id: "sp2", location: "Valenfort", codename: "Sombra 2", status: "Active" },
          { id: "sp3", location: "Falcoa", codename: "Falcão", status: "Active" },
          { id: "sp4", location: "Torre Leste", codename: "Sentinela Leste", status: "Active" },
          { id: "sp5", location: "Capital", codename: "Sussurro", status: "Active" },
          { id: "sp6", location: "House Gray", codename: "Lobo Cinzento", status: "Active" },
          { id: "sp7", location: "Garganta", codename: "Corvo do Abismo", status: "Active" }
        ],
        activeIntelligence: [
          "Rastro de Blackmoor perdido no leste; batedores investigando a costa.",
          "Carta incriminatória de Alberico queimada para evitar vazamentos políticos."
        ],
        weeklyUpkeep: 6
      },
      tribalRelations: [
        { tribeName: "Toghrul Khan (Estepe)", leader: "Toghrul Khan", opinion: "Neutral", details: "Comércio aberto ativo e pacífico; convite oficial emitido para o festival de primavera.", soldiersEstimate: "300+ cavaleiros" },
        { tribeName: "Filhos do Eclipse (Montanhas)", leader: "Gorthok, o Cego", opinion: "Hostile", details: "Hostilidade silenciosa e latente; recuaram para as fendas profundas das escarpas superiores.", soldiersEstimate: "100+ guerreiros" },
        { tribeName: "Tribos Selvagens (Dentes de Gelo)", leader: "Nenhum (Liderança eliminada)", opinion: "Eliminated", details: "Totalmente debelados e dispersos após a expedição militar no inverno de 341.", soldiersEstimate: "Nenhum restante" }
      ],
      equipmentStock: {
        cuirasses: 110,
        chainmail: 45,
        plateArmor: 12,
        shields: 35,
        spears: 180,
        shortswords: 140,
        longbows: 75,
        winterClothes: 187,
        productionDetails: "Baldur na forja produzindo 6 ferramentas/semana. Encomenda ativa de 10 bestas táticas em andamento."
      },
      tradeRoutes: [
        { target: "Capital", status: "Active", details: "Rota de suprimento real estabelecida." },
        { target: "Falcoa", status: "Active", details: "Comércio de grãos e peles sem restrições." },
        { target: "Pedra Alta", status: "Embargoed", details: "Interrompida por tempo indeterminado após o conflito com Alberico." },
        { target: "House Gray", status: "Active", details: "Aliança militar e troca direta de minérios." },
        { target: "Alveria", status: "Active", details: "Troca marítima e mercadorias exóticas." }
      ],
      caravanas: [
        { id: "c1", name: "Caravana de Primavera de Thawrise", leader: "Sorrel", guardDetails: "15 guardas mercenários contratados e batedores", status: "Aguardando o degelo final na semana 6 para partir", weekLaunched: 6 }
      ],
      gmSecrets: [
        { id: "sec1", description: "Localização de Blackmoor: refugiado na Costa Leste com 50-80 mercenários sob seu comando direto, planejando uma investida em Thawrise de 346.", revealed: false },
        { id: "sec2", description: "Conselho da Coroa em colapso político total devido à morte prematura de Tybalt e a prisão secreta do Duque Caspian.", revealed: false }
      ]
    },
    crowns: [
      { id: 'blood', name: 'Crown of Blood (Planícies)', region: 'Central Plains', unlocked: false, progress: 0, maxProgress: 3, requirements: ['Vencer 3 batalhas importantes nas Planícies', 'Liderar 5 grandes Casas das Planícies', 'Reivindicar o Assento de Ferro'] },
      { id: 'contracts', name: 'Crown of Contracts (Rios)', region: 'Western Rivers', unlocked: false, progress: 0, maxProgress: 4, requirements: ['Obter rotas de comércio com holdings fluviais', 'Eleição pelo Conselho do Rio', 'Firmar cartas de fealdade com lordes mercantes'] },
      { id: 'northwind', name: 'Crown of the North Wind (Gelo)', region: 'Northern Snowlands', unlocked: false, progress: 0, maxProgress: 1, requirements: ['Sobreviver ao frio profundo de uma Nevasca no Norte', 'Abater uma fera ou urso da neve'] },
      { id: 'greendrake', name: 'Crown of the Green Drake (Florestas)', region: 'Eastern Forests', unlocked: false, progress: 0, maxProgress: 1, requirements: ['Submeter ou domar Eldric, o Dragão Negro das Florestas', 'Capturar a Torre Florestal Alta'] },
      { id: 'stone', name: 'Crown of Stone (Montanhas)', region: 'Southern Mountains', unlocked: false, progress: 0, maxProgress: 2, requirements: ['Defender as passagens sulistas sob cerco', 'Recuperar as relíquias de pedra dos antigos clãs'] },
      { id: 'rubicon', name: 'Rubicon Crown (Proclamação)', region: 'Any', unlocked: false, progress: 0, maxProgress: 1, requirements: ['Ser aclamado pelas próprias tropas em rebelião', 'Conquistar a capital por usurpação armada'] }
    ],
    inventory: {
      horns: [
        { id: 'horn_1', name: 'Berrante de Caça Comum', type: 'Hunting', sound: 'Sopro rápido e brilhante', broken: false }
      ],
      smudgeBundles: { sage: 2, cedar: 1, sweetgrass: 0, tobacco: 1 }
    },
    family: {
      spouse: undefined,
      children: [],
      betrothedHouse: undefined,
      pregnancyWeekRemaining: undefined
    },
    advisors: {
      counselorName: "Mara",
      stewardName: "Barth",
      spyMasterName: "Ren"
    }
  },
  {
    character: {
      name: "Sera Vance",
      house: "Vance",
      age: 31,
      gender: "Female",
      archetype: "Landless",
      profession: "Mercenária",
      title: "Capitã da Companhia Livre",
      location: {
        region: "Florestas do Rio",
        subregion: "Baixo Alcance",
        landmark: "Fenwick",
        distanceNearTown: 4,
        distanceNearCastle: 2,
        distanceCapital: 6
      },
      banner: {
        colors: "Green with Silver Arrows",
        symbol: "Silver arrow and spear",
        motto: "Steel Before Oath"
      },
      stats: {
        commanderTier: 3,
        bannerTier: 3,
        ac: 3,
        initiativeBonus: 1,
        weapon: "Bow (High-Grade)",
        shield: "None",
        mount: "Courser",
        mountQuality: "High-Grade",
        weaponQuality: "High-Grade",
        armorQuality: "High-Grade",
        shieldQuality: "Common"
      },
      reputation: 4,
      nicknames: [{ name: "The Arrow", earned: "Felled enemy captain from 200 yards", date: "Y13", effect: "+1 morale" }],
      flavorDetail: "We move at night. We know every path in these woods.",
      backstory: "One thousand silver and a hundred swords. Then I am done. Then I buy land."
    },
    weeklyLedger: {
      week: 1,
      month: "Greening",
      year: 342,
      season: "Thawtide",
      weather: "Fog, damp",
      silverdew: 200,
      food: 4.0,
      materials: { timber: 5, iron: 3, stone: 0 },
      incomeDetail: { holdings: 0, patches: 0, trade: 0, tribute: 0, taxes: 0, loot: 0, other: 0 },
      expenseDetail: { wages: 5, garrison: 0, foodPurchases: 0, construction: 0, recruitment: 0, mercenaries: 0, tributePaid: 0, engineerWages: 0, shipUpkeep: 0, holdingMaintenance: 0, other: 0 }
    },
    army: {
      units: [
        { id: "u2", name: "Free Company Swords", size: 50, maxSize: 50, tier: 2, ac: 3, weapon: "Swords", mount: "None", morale: 5 }
      ],
      garrisonSize: 0
    },
    holdings: {
      name: "Mercenary Camp",
      type: "Bastion",
      tier: 1,
      region: "Western Rivers",
      position: "Fenwick Roads",
      population: 50,
      laborPool: 20,
      garrison: 0,
      fortification: {
        type: "Tents",
        tier: 1,
        acBonus: 0,
        rangedRerolls: 1,
        firstMeleeBonus: 0
      },
      resourcePatches: [],
      residentSmith: { name: "Aethelgard", level: 1, xp: 0, specialty: "Repairs" },
      granaryUpgrade: false
    },
    ships: [],
    sessionLog: {
      lastSessionDate: "Greening Day 1, Year 342",
      lastThingHappened: "Acampada nas florestas do rio, buscando contratos no mercado.",
      activeMissions: [],
      pendingDecisions: ["Procurar por contratos em Fenwick", "Comprar rações para a tropa"]
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
        "Western Rivers": { tradeVolume: "High", priceTrend: "Stable", shortages: "Stone" }
      },
      weatherHistory: ["Rain", "Fog", "Cold, clear", "Overcast"],
      notableDeaths: []
    },
    crowns: [
      { id: 'blood', name: 'Crown of Blood (Planícies)', region: 'Central Plains', unlocked: false, progress: 0, maxProgress: 3, requirements: ['Vencer 3 batalhas importantes nas Planícies', 'Liderar 5 grandes Casas das Planícies', 'Reivindicar o Assento de Ferro'] },
      { id: 'contracts', name: 'Crown of Contracts (Rios)', region: 'Western Rivers', unlocked: false, progress: 0, maxProgress: 4, requirements: ['Obter rotas de comércio com holdings fluviais', 'Eleição pelo Conselho do Rio', 'Firmar cartas de fealdade com lordes mercantes'] },
      { id: 'northwind', name: 'Crown of the North Wind (Gelo)', region: 'Northern Snowlands', unlocked: false, progress: 0, maxProgress: 1, requirements: ['Sobreviver ao frio profundo de uma Nevasca no Norte', 'Abater uma fera ou urso da neve'] },
      { id: 'greendrake', name: 'Crown of the Green Drake (Florestas)', region: 'Eastern Forests', unlocked: false, progress: 0, maxProgress: 1, requirements: ['Submeter ou domar Eldric, o Dragão Negro das Florestas', 'Capturar a Torre Florestal Alta'] },
      { id: 'stone', name: 'Crown of Stone (Montanhas)', region: 'Southern Mountains', unlocked: false, progress: 0, maxProgress: 2, requirements: ['Defender as passagens sulistas sob cerco', 'Recuperar as relíquias de pedra dos antigos clãs'] },
      { id: 'rubicon', name: 'Rubicon Crown (Proclamação)', region: 'Any', unlocked: false, progress: 0, maxProgress: 1, requirements: ['Ser aclamado pelas próprias tropas em rebelião', 'Conquistar a capital por usurpação armada'] }
    ],
    inventory: {
      horns: [
        { id: 'horn_1', name: 'Berrante de Caça Comum', type: 'Hunting', sound: 'Sopro rápido e brilhante', broken: false }
      ],
      smudgeBundles: { sage: 2, cedar: 1, sweetgrass: 0, tobacco: 1 }
    },
    family: {
      spouse: undefined,
      children: [],
      betrothedHouse: undefined,
      pregnancyWeekRemaining: undefined
    },
    advisors: {
      counselorName: "Lorea",
      stewardName: "Cormac",
      spyMasterName: "Lyra"
    }
  },
  {
    character: {
      name: "Valerius",
      house: "Ironforge",
      age: 42,
      gender: "Male",
      archetype: "Artificer",
      title: "Master Smith of Ironridge",
      location: {
        region: "Southern Mountains",
        subregion: "The Deep Crags",
        landmark: "Ironridge Fortress",
        distanceNearTown: 1,
        distanceNearCastle: 0,
        distanceCapital: 5
      },
      banner: {
        colors: "Crimson and Charcoal",
        symbol: "Anvil and Hammer",
        motto: "What is Forged Stands"
      },
      stats: {
        commanderTier: 2,
        bannerTier: 2,
        ac: 4,
        initiativeBonus: -1,
        weapon: "Mace (Superb)",
        shield: "Kite",
        mount: "Mule",
        mountQuality: "Common",
        weaponQuality: "Superb",
        armorQuality: "Superb",
        shieldQuality: "High-Grade"
      },
      reputation: 3,
      nicknames: [{ name: "O Martelo", earned: "Forjou as portas de bronze de Ironridge", date: "Y10", effect: "+10% velocidade de forja" }],
      flavorDetail: "A forja de ferro range dia e noite com o bater do martelo gélido.",
      backstory: "Sou um artífice do metal. Vim para as montanhas em busca de veios puros de ferro para forjar as lendárias lâminas da unificação."
    },
    weeklyLedger: {
      week: 1,
      month: "Frostwane",
      year: 342,
      season: "Deepfrost",
      weather: "Cold, windy",
      silverdew: 150,
      food: 6.0,
      materials: { timber: 40, iron: 30, stone: 15 },
      incomeDetail: { holdings: 100, patches: 50, trade: 0, tribute: 0, taxes: 0, loot: 0, other: 0 },
      expenseDetail: { wages: 4, garrison: 0, foodPurchases: 0, construction: 0, recruitment: 0, mercenaries: 0, tributePaid: 0, engineerWages: 0, shipUpkeep: 0, holdingMaintenance: 0, other: 0 }
    },
    army: {
      units: [
        { id: "u3", name: "Ironridge Guards", size: 35, maxSize: 50, tier: 1, ac: 4, weapon: "Maces", mount: "None", morale: 4 }
      ],
      garrisonSize: 20
    },
    holdings: {
      name: "The Iron Forge",
      type: "Bastion",
      tier: 1,
      region: "Southern Mountains",
      position: "High Pass of Ironridge",
      population: 400,
      laborPool: 180,
      garrison: 20,
      fortification: {
        type: "Stone Palisade",
        tier: 1,
        acBonus: 1,
        rangedRerolls: 1,
        firstMeleeBonus: 0
      },
      resourcePatches: [
        { id: "p1_v", name: "Ironridge Vein", type: "Iron Mine", tier: 1, quality: "High-Grade", yieldPerDay: 4, incomePerDay: 8, laborRequired: 12 }
      ],
      residentSmith: { name: "Valerius Himself", level: 3, xp: 90, specialty: "Armor" },
      granaryUpgrade: false
    },
    ships: [],
    sessionLog: {
      lastSessionDate: "Frostwane Day 1, Year 342",
      lastThingHappened: "Forno aceso. Materiais estocados prontos para os primeiros projetos de armas.",
      activeMissions: [],
      pendingDecisions: ["Comprar carvão extra para a forja", "Contratar mineiros locais"]
    },
    worldLedger: {
      currentDate: { day: 1, month: "Frostwane", year: 342, week: 1 },
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
        "Southern Mountains": { tradeVolume: "Medium", priceTrend: "Stable", shortages: "Timber" }
      },
      weatherHistory: ["Snow", "Clear", "Overcast", "Windy"],
      notableDeaths: []
    },
    crowns: [
      { id: 'blood', name: 'Crown of Blood (Planícies)', region: 'Central Plains', unlocked: false, progress: 0, maxProgress: 3, requirements: ['Vencer 3 batalhas importantes nas Planícies', 'Liderar 5 grandes Casas das Planícies', 'Reivindicar o Assento de Ferro'] },
      { id: 'contracts', name: 'Crown of Contracts (Rios)', region: 'Western Rivers', unlocked: false, progress: 0, maxProgress: 4, requirements: ['Obter rotas de comércio com holdings fluviais', 'Eleição pelo Conselho do Rio', 'Firmar cartas de fealdade com lordes mercantes'] },
      { id: 'northwind', name: 'Crown of the North Wind (Gelo)', region: 'Northern Snowlands', unlocked: false, progress: 0, maxProgress: 1, requirements: ['Sobreviver ao frio profundo de uma Nevasca no Norte', 'Abater uma fera ou urso da neve'] },
      { id: 'greendrake', name: 'Crown of the Green Drake (Florestas)', region: 'Eastern Forests', unlocked: false, progress: 0, maxProgress: 1, requirements: ['Submeter ou domar Eldric, o Dragão Negro das Florestas', 'Capturar a Torre Florestal Alta'] },
      { id: 'stone', name: 'Crown of Stone (Montanhas)', region: 'Southern Mountains', unlocked: false, progress: 0, maxProgress: 2, requirements: ['Defender as passagens sulistas sob cerco', 'Recuperar as relíquias de pedra dos antigos clãs'] },
      { id: 'rubicon', name: 'Rubicon Crown (Proclamação)', region: 'Any', unlocked: false, progress: 0, maxProgress: 1, requirements: ['Ser aclamado pelas próprias tropas em rebelião', 'Conquistar a capital por usurpação armada'] }
    ],
    inventory: {
      horns: [
        { id: 'horn_1', name: 'Berrante de Caça Comum', type: 'Hunting', sound: 'Sopro rápido e brilhante', broken: false }
      ],
      smudgeBundles: { sage: 2, cedar: 1, sweetgrass: 0, tobacco: 1 }
    },
    family: {
      spouse: undefined,
      children: [],
      betrothedHouse: undefined,
      pregnancyWeekRemaining: undefined
    },
    advisors: {
      counselorName: "Vanya",
      stewardName: "Brogan",
      spyMasterName: "Sylas"
    }
  },
  {
    character: {
      name: "Cadogan",
      house: "Dreadgrave",
      age: 67,
      gender: "Male",
      archetype: "Necromancer",
      title: "Necromancer Lord of Dreadgrave",
      location: {
        region: "Northern Snowlands",
        subregion: "The Frozen Wastes",
        landmark: "Wolf's Den",
        distanceNearTown: 5,
        distanceNearCastle: 2,
        distanceCapital: 8
      },
      banner: {
        colors: "Soot and Bone",
        symbol: "Shattered Skull",
        motto: "The Grave Whispers"
      },
      stats: {
        commanderTier: 3,
        bannerTier: 1,
        ac: 2,
        initiativeBonus: 2,
        weapon: "Scythe (High-Grade)",
        shield: "None",
        mount: "Undead Steed",
        mountQuality: "High-Grade",
        weaponQuality: "High-Grade",
        armorQuality: "Common",
        shieldQuality: "Common"
      },
      reputation: -2,
      nicknames: [{ name: "O Corrupto", earned: "Despertou os ossos caídos do vale gélido", date: "Y11", effect: "-20% lealdade de nobres, +10% dano de moral de cerco" }],
      flavorDetail: "O frio eterno conserva os corpos e o silêncio dos túmulos.",
      backstory: "Um antigo mestre expulso do conselho real. Agora, nas terras de gelo, os ossos respondem ao meu sussurro de ferro.",
      soulEssence: 45,
      controlUsed: 20,
      controlLimit: 100,
      isLich: false
    },
    weeklyLedger: {
      week: 1,
      month: "Longdark_1",
      year: 342,
      season: "Deepfrost",
      weather: "Blizzard, freezing",
      silverdew: 80,
      food: 3.0,
      materials: { timber: 5, iron: 15, stone: 20 },
      incomeDetail: { holdings: 0, patches: 0, trade: 0, tribute: 0, taxes: 0, loot: 0, other: 0 },
      expenseDetail: { wages: 0, garrison: 0, foodPurchases: 0, construction: 0, recruitment: 0, mercenaries: 0, tributePaid: 0, engineerWages: 0, shipUpkeep: 0, holdingMaintenance: 0, other: 0 }
    },
    army: {
      units: [
        { id: "u4", name: "Skeleton Warriors", size: 60, maxSize: 100, tier: 1, ac: 2, weapon: "Rusty Swords", mount: "None", morale: 6, type: "Skeletons" }
      ],
      garrisonSize: 0
    },
    holdings: {
      name: "Dreadgrave Lair",
      type: "Bastion",
      tier: 1,
      region: "Northern Snowlands",
      position: "The Whispering Glade of Northern Snowlands",
      population: 50,
      laborPool: 20,
      garrison: 0,
      fortification: {
        type: "Bone Wall",
        tier: 1,
        acBonus: 1,
        rangedRerolls: 1,
        firstMeleeBonus: 0
      },
      resourcePatches: [],
      residentSmith: { name: "Undead Hammerer", level: 1, xp: 10, specialty: "Weapons" },
      granaryUpgrade: false
    },
    ships: [],
    sessionLog: {
      lastSessionDate: "Longdark_1 Day 1, Year 342",
      lastThingHappened: "Efetivou o ritual de despertar nas catacumbas sob a neve profunda.",
      activeMissions: [],
      pendingDecisions: ["Estocar essência de almas", "Erguer sentinelas de ossos nos desfiladeiros"]
    },
    worldLedger: {
      currentDate: { day: 1, month: "Longdark_1", year: 342, week: 1 },
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
        "Northern Snowlands": { tradeVolume: "Low", priceTrend: "Stable", shortages: "Grain" }
      },
      weatherHistory: ["Blizzard", "Freezing", "Blizzard", "Cold"],
      notableDeaths: []
    },
    crowns: [
      { id: 'blood', name: 'Crown of Blood (Planícies)', region: 'Central Plains', unlocked: false, progress: 0, maxProgress: 3, requirements: ['Vencer 3 batalhas importantes nas Planícies', 'Liderar 5 grandes Casas das Planícies', 'Reivindicar o Assento de Ferro'] },
      { id: 'contracts', name: 'Crown of Contracts (Rios)', region: 'Western Rivers', unlocked: false, progress: 0, maxProgress: 4, requirements: ['Obter rotas de comércio com holdings fluviais', 'Eleição pelo Conselho do Rio', 'Firmar cartas de fealdade com lordes mercantes'] },
      { id: 'northwind', name: 'Crown of the North Wind (Gelo)', region: 'Northern Snowlands', unlocked: false, progress: 0, maxProgress: 1, requirements: ['Sobreviver ao frio profundo de uma Nevasca no Norte', 'Abater uma fera ou urso da neve'] },
      { id: 'greendrake', name: 'Crown of the Green Drake (Florestas)', region: 'Eastern Forests', unlocked: false, progress: 0, maxProgress: 1, requirements: ['Submeter ou domar Eldric, o Dragão Negro das Florestas', 'Capturar a Torre Florestal Alta'] },
      { id: 'stone', name: 'Crown of Stone (Montanhas)', region: 'Southern Mountains', unlocked: false, progress: 0, maxProgress: 2, requirements: ['Defender as passagens sulistas sob cerco', 'Recuperar as relíquias de pedra dos antigos clãs'] },
      { id: 'rubicon', name: 'Rubicon Crown (Proclamação)', region: 'Any', unlocked: false, progress: 0, maxProgress: 1, requirements: ['Ser aclamado pelas próprias tropas em rebelião', 'Conquistar a capital por usurpação armada'] }
    ],
    inventory: {
      horns: [
        { id: 'horn_1', name: 'Berrante de Caça Comum', type: 'Hunting', sound: 'Sopro rápido e brilhante', broken: false }
      ],
      smudgeBundles: { sage: 2, cedar: 1, sweetgrass: 0, tobacco: 1 }
    },
    family: {
      spouse: undefined,
      children: [],
      betrothedHouse: undefined,
      pregnancyWeekRemaining: undefined
    },
    advisors: {
      counselorName: "Sybilla",
      stewardName: "Lorn",
      spyMasterName: "Rook"
    }
  }
];

export const REGIONAL_DEMAND_PROFILES: Record<string, {
  craves: string[];
  needs: string[];
  produces: string[];
}> = {
  "Northern Snowlands": {
    craves: ["Grain", "Timber", "Iron", "Medicine"],
    needs: ["Furs", "Leather", "Rope", "Wine"],
    produces: ["Furs", "Ivory", "Reindeer products", "Fish"]
  },
  "Nomad Steppe": {
    craves: ["Grain", "Iron", "Timber", "Weapons"],
    needs: ["Leather", "Rope", "Medicine", "Wine"],
    produces: ["Horses", "Hides", "Meat", "Wool"]
  },
  "Western Rivers": {
    craves: ["Luxury goods", "Iron", "Grain", "Horses"],
    needs: ["Timber", "Wine", "Stone", "Weapons"],
    produces: ["Fish", "Salt", "River goods", "Clay"]
  },
  "Eastern Forests": {
    craves: ["Grain", "Iron", "Weapons", "Salt"],
    needs: ["Medicine", "Cloth", "Wine", "Leather"],
    produces: ["Timber", "Furs", "Herbs", "Game"]
  },
  "Central Plains": {
    craves: ["Iron", "Stone", "Furs", "Luxury goods"],
    needs: ["Timber", "Salt", "Wine", "Medicine"],
    produces: ["Grain", "Livestock", "Wool", "Leather"]
  },
  "Southern Mountains": {
    craves: ["Grain", "Timber", "Furs", "Wine"],
    needs: ["Leather", "Cloth", "Weapons", "Oil"],
    produces: ["Stone", "Iron", "Salt", "Silver"]
  }
};

export const WEATHER_EFFECTS_BY_REGION_AND_SEASON: Record<string, Record<string, Array<{ roll: string; effect: string; travelMod: number; foragingMod: number }>>> = {
  "Northern Snowlands": {
    "Deepfrost": [
      { roll: "1", effect: "Ensolarado, mas frio extremo (Risco de geladura, velocidade +25%)", travelMod: 1.25, foragingMod: 0 },
      { roll: "2-3", effect: "Neve leve (Velocidade +50%, visibilidade reduzida)", travelMod: 1.5, foragingMod: 0.5 },
      { roll: "4", effect: "Neve pesada (Velocidade +100%, forrageamento impossível)", travelMod: 2.0, foragingMod: 0 },
      { roll: "5", effect: "Nevasca (Velocidade +200%, viagem impossível, mortes)", travelMod: 3.0, foragingMod: 0 },
      { roll: "6", effect: "Tempestade Branca (Viagem impossível, 2d6 baixas na tropa fora de abrigos)", travelMod: 10, foragingMod: 0 }
    ],
    "Thawtide": [
      { roll: "1-2", effect: "Degelo, lama pesada (Velocidade +50%, rios transbordam)", travelMod: 1.5, foragingMod: 0.5 },
      { roll: "3-4", effect: "Nuvens frias e vento forte (Velocidade normal)", travelMod: 1.0, foragingMod: 1.0 },
      { roll: "5-6", effect: "Mosquitos em massa (Estresse, -1 Moral na tropa)", travelMod: 1.0, foragingMod: 1.2 }
    ]
  },
  "Central Plains": {
    "Sunreach": [
      { roll: "1-3", effect: "Limpo, sol quente (Condições perfeitas de viagem)", travelMod: 1.0, foragingMod: 1.2 },
      { roll: "4-5", effect: "Calor escaldante (Consumo de água alto, risco de incêndio)", travelMod: 1.0, foragingMod: 1.0 },
      { roll: "6", effect: "Tornado repentino (Destrói acampamentos, risco de perdas)", travelMod: 1.5, foragingMod: 0.5 }
    ],
    "Deepfrost": [
      { roll: "1-2", effect: "Frio extremo, grama congelada (Rações normais)", travelMod: 1.0, foragingMod: 0.5 },
      { roll: "3-4", effect: "Neve leve ocasional (Velocidade +25%)", travelMod: 1.25, foragingMod: 0.3 },
      { roll: "5-6", effect: "Vento cortante congelante (Risco de hipotermia se desprotegido)", travelMod: 1.5, foragingMod: 0.1 }
    ]
  }
};
