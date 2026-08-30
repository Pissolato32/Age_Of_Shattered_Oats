import { CampaignState } from '../../types';

export type WorldEventMagnitude = 'INCIDENTAL' | 'MINOR' | 'SIGNIFICANT' | 'MAJOR' | 'CRITICAL';

export type CurrentActivity =
  | 'TRAVEL'
  | 'BUILD'
  | 'TRADE'
  | 'DIPLOMACY'
  | 'REST'
  | 'HOLDING'
  | 'MILITARY'
  | 'ESPIONAGE';

export interface OpportunityContext {
  readonly activity: CurrentActivity;
  readonly locationId?: string;
  readonly subregion?: string;
  readonly targetHouse?: string;
  readonly currentTurn: number;
  readonly recentEventTypes?: readonly string[];
  readonly eventCooldowns?: Readonly<Record<string, number>>;
}

export interface EventOpportunity {
  readonly opportunityId: string;
  readonly eventType: string;
  readonly magnitude: WorldEventMagnitude;
  readonly baseWeight: number;
  readonly weight: number;
  readonly tags: readonly string[];
  readonly eligible: boolean;
  readonly reasons: readonly string[];
  readonly timeCostHint: 'NONE' | 'HOURS' | 'DAY' | 'DAYS' | 'WEEK';
}

interface OpportunityTemplate {
  readonly id: string;
  readonly eventType: string;
  readonly magnitude: WorldEventMagnitude;
  readonly baseWeight: number;
  readonly tags: readonly string[];
  readonly timeCostHint: 'NONE' | 'HOURS' | 'DAY' | 'DAYS' | 'WEEK';
  readonly checkEligibility: (state: CampaignState, ctx: OpportunityContext) => { eligible: boolean; reasons: string[]; weightMultiplier?: number };
}

const OPPORTUNITY_CATALOG: readonly OpportunityTemplate[] = [
  // 1. TRAVEL: Encontro com Animal Selvagem
  {
    id: 'opp_travel_animal_encounter',
    eventType: 'WILD_ANIMAL_ENCOUNTER',
    magnitude: 'MINOR',
    baseWeight: 3,
    tags: ['viagem', 'fauna', 'floresta', 'natureza'],
    timeCostHint: 'HOURS',
    checkEligibility: (state, ctx) => {
      if (ctx.activity !== 'TRAVEL') {
        return { eligible: false, reasons: ['Atividade atual não é viagem'] };
      }
      const region = (state.character.location.region || '').toLowerCase();
      const inWilderness = region.includes('forest') || region.includes('mountain') || region.includes('plains') || region.includes('steppe');
      if (!inWilderness) {
        return { eligible: false, reasons: ['Localização urbana ou fortaleza sem ermos próximos'] };
      }
      return { eligible: true, reasons: ['Viagem ativa em terreno de ermos / mata aberta'] };
    }
  },

  // 2. TRAVEL: Acidente de Carroça / Estrada
  {
    id: 'opp_travel_road_accident',
    eventType: 'TRAVEL_ROAD_ACCIDENT',
    magnitude: 'MINOR',
    baseWeight: 4,
    tags: ['viagem', 'estrada', 'acidente', 'carroca'],
    timeCostHint: 'DAY',
    checkEligibility: (_state, ctx) => {
      if (ctx.activity !== 'TRAVEL') {
        return { eligible: false, reasons: ['Atividade atual não é viagem'] };
      }
      return { eligible: true, reasons: ['Viagem por estradas secundárias ou caminhos de terra'] };
    }
  },

  // 3. TRAVEL: Atraso por Clima Severo / Neve
  {
    id: 'opp_travel_weather_delay',
    eventType: 'TRAVEL_WEATHER_DELAY',
    magnitude: 'MINOR',
    baseWeight: 5,
    tags: ['viagem', 'clima', 'inverno', 'atraso'],
    timeCostHint: 'DAY',
    checkEligibility: (state, ctx) => {
      if (ctx.activity !== 'TRAVEL') {
        return { eligible: false, reasons: ['Atividade atual não é viagem'] };
      }
      const season = state.weeklyLedger.season;
      const weather = (state.weeklyLedger.weather || '').toLowerCase();
      const isSevere = season === 'Deepfrost' || weather.includes('neve') || weather.includes('tempestade') || weather.includes('chuva');
      if (!isSevere) {
        return { eligible: false, reasons: ['Clima ameno e favorável para viagem'] };
      }
      return { eligible: true, reasons: [`Condições climáticas adversas em ${season}`], weightMultiplier: 1.5 };
    }
  },

  // 4. BUILD: Acidente de Trabalho em Obras
  {
    id: 'opp_build_workplace_injury',
    eventType: 'BUILD_WORKPLACE_INJURY',
    magnitude: 'MINOR',
    baseWeight: 4,
    tags: ['construcao', 'obras', 'acidente', 'labor'],
    timeCostHint: 'NONE',
    checkEligibility: (_state, ctx) => {
      if (ctx.activity !== 'BUILD') {
        return { eligible: false, reasons: ['Atividade atual não envolve canteiro de obras ativo'] };
      }
      return { eligible: true, reasons: ['Operação de cantaria, carpintaria ou reforço estrutural em andamento'] };
    }
  },

  // 5. BUILD: Problema de Suprimento / Material Defeituoso
  {
    id: 'opp_build_material_shortage',
    eventType: 'BUILD_MATERIAL_SHORTAGE',
    magnitude: 'SIGNIFICANT',
    baseWeight: 3,
    tags: ['construcao', 'suprimentos', 'madeira', 'gargalo'],
    timeCostHint: 'DAYS',
    checkEligibility: (state, ctx) => {
      if (ctx.activity !== 'BUILD') {
        return { eligible: false, reasons: ['Atividade atual não é construção'] };
      }
      const timber = state.weeklyLedger.materials?.timber ?? 0;
      const stone = state.weeklyLedger.materials?.stone ?? 0;
      if (timber > 15 && stone > 15) {
        return { eligible: false, reasons: ['Estoques de materiais abundantes'] };
      }
      return { eligible: true, reasons: ['Estoque baixo de madeira ou cantaria para obras'], weightMultiplier: 1.3 };
    }
  },

  // 6. TRADE: Oportunidade com Mercador Itinerante
  {
    id: 'opp_trade_opportunistic_merchant',
    eventType: 'TRADE_OPPORTUNISTIC_MERCHANT',
    magnitude: 'SIGNIFICANT',
    baseWeight: 4,
    tags: ['comercio', 'mercado', 'mercador', 'oportunidade'],
    timeCostHint: 'HOURS',
    checkEligibility: (_state, ctx) => {
      if (ctx.activity !== 'TRADE') {
        return { eligible: false, reasons: ['Atividade atual não é comércio'] };
      }
      return { eligible: true, reasons: ['Negociação ativa no mercado local ou rota comercial'] };
    }
  },

  // 7. DIPLOMACY: Incidente de Tensão na Embaixada
  {
    id: 'opp_diplomacy_tension_incident',
    eventType: 'DIPLOMACY_TENSION_INCIDENT',
    magnitude: 'SIGNIFICANT',
    baseWeight: 4,
    tags: ['diplomacia', 'tensao', 'embaixada', 'nobreza'],
    timeCostHint: 'NONE',
    checkEligibility: (state, ctx) => {
      if (ctx.activity !== 'DIPLOMACY') {
        return { eligible: false, reasons: ['Atividade atual não é diplomacia'] };
      }
      const target = ctx.targetHouse || '';
      const house = state.worldLedger?.nobleHouses?.find(h => h.name.toLowerCase() === target.toLowerCase());
      const isTense = (house?.opinion ?? 0) <= 0 || (house?.status || '').toLowerCase().includes('hostil');
      if (!isTense && target.length > 0) {
        return { eligible: false, reasons: ['Relação com a casa alvo é amigável e sem atritos'] };
      }
      return { eligible: true, reasons: ['Tratativas sob clima de desconfiança ou tensão diplomática'] };
    }
  },

  // 8. FRONTIER: Rastros e Movimentação Suspeita na Fronteira
  {
    id: 'opp_frontier_tracks_discovered',
    eventType: 'FRONTIER_TRACKS_DISCOVERED',
    magnitude: 'SIGNIFICANT',
    baseWeight: 5,
    tags: ['fronteira', 'batedores', 'vigilancia', 'rastros'],
    timeCostHint: 'HOURS',
    checkEligibility: (state, ctx) => {
      const subregion = (state.character.location.subregion || '').toLowerCase();
      const inFrontier = subregion.includes('frontier') || subregion.includes('fronteira') || ctx.subregion?.toLowerCase().includes('fronteira');
      if (!inFrontier) {
        return { eligible: false, reasons: ['Localização atual não é zona de fronteira'] };
      }
      return { eligible: true, reasons: ['Posição tática em área limítrofe de fronteira'] };
    }
  },

  // 9. CRISIS: Murmúrio de Inquietação por Fome
  {
    id: 'opp_famine_unrest_rumor',
    eventType: 'FAMINE_UNREST_RUMOR',
    magnitude: 'MAJOR',
    baseWeight: 6,
    tags: ['fome', 'escassez', 'inquietacao', 'celeiros'],
    timeCostHint: 'NONE',
    checkEligibility: (state, _ctx) => {
      const famineTicks = state.weeklyLedger.famineTicks ?? 0;
      const food = state.weeklyLedger.food;
      if (famineTicks === 0 && food >= 5) {
        return { eligible: false, reasons: ['Celeiros devidamente abastecidos sem fome ativa'] };
      }
      return { eligible: true, reasons: [`Crise de provisões ativa (${famineTicks} semanas de fome)`] };
    }
  },

  // 10. INCIDENTAL / FLAVOR: Corvo Pousa na Muralha
  {
    id: 'opp_flavor_raven_wall',
    eventType: 'ATMOSPHERIC_FLAVOR_RAVEN',
    magnitude: 'INCIDENTAL',
    baseWeight: 5,
    tags: ['flavor', 'atmosfera', 'corvo', 'muralha'],
    timeCostHint: 'NONE',
    checkEligibility: (_state, _ctx) => {
      return { eligible: true, reasons: ['Sabor atmosférico universal'] };
    }
  },

  // 11. INCIDENTAL / FLAVOR: Vento Cortante de Inverno
  {
    id: 'opp_flavor_cold_wind',
    eventType: 'ATMOSPHERIC_FLAVOR_COLD_WIND',
    magnitude: 'INCIDENTAL',
    baseWeight: 5,
    tags: ['flavor', 'atmosfera', 'inverno', 'vento'],
    timeCostHint: 'NONE',
    checkEligibility: (state, _ctx) => {
      if (state.weeklyLedger.season !== 'Deepfrost') {
        return { eligible: false, reasons: ['Estação atual não é inverno profundo (Deepfrost)'] };
      }
      return { eligible: true, reasons: ['Inverno rigoroso estabelecido em Deepfrost'] };
    }
  }
];

/**
 * EventOpportunityEngine (M18.9-A)
 * 
 * Pure, deterministic domain evaluator that inspects the current CampaignState
 * and OpportunityContext to compute the exact list of eligible and weighted
 * event candidates.
 * 
 * Invariants:
 * 1. Strictly functional (Zero state mutations).
 * 2. No random generation (Weights are metadata for M18.9-B).
 * 3. Context-driven eligibility (Travel accidents only in travel, etc.).
 */
export class EventOpportunityEngine {
  public static evaluateOpportunities(
    state: CampaignState,
    context: OpportunityContext
  ): EventOpportunity[] {
    const results: EventOpportunity[] = [];

    for (const tmpl of OPPORTUNITY_CATALOG) {
      // 1. Verificar Cooldown
      const cooldownRemaining = context.eventCooldowns?.[tmpl.eventType] ?? 0;
      if (cooldownRemaining > 0) {
        results.push({
          opportunityId: tmpl.id,
          eventType: tmpl.eventType,
          magnitude: tmpl.magnitude,
          baseWeight: tmpl.baseWeight,
          weight: 0,
          tags: tmpl.tags,
          eligible: false,
          reasons: [`Em cooldown por mais ${cooldownRemaining} turnos`],
          timeCostHint: tmpl.timeCostHint
        });
        continue;
      }

      // 2. Verificar Elegibilidade Contextual
      const evalResult = tmpl.checkEligibility(state, context);
      const calculatedWeight = evalResult.eligible
        ? Math.round(tmpl.baseWeight * (evalResult.weightMultiplier ?? 1.0))
        : 0;

      results.push({
        opportunityId: tmpl.id,
        eventType: tmpl.eventType,
        magnitude: tmpl.magnitude,
        baseWeight: tmpl.baseWeight,
        weight: calculatedWeight,
        tags: tmpl.tags,
        eligible: evalResult.eligible,
        reasons: evalResult.reasons,
        timeCostHint: tmpl.timeCostHint
      });
    }

    return results;
  }

  public static getEligibleOpportunities(
    state: CampaignState,
    context: OpportunityContext
  ): EventOpportunity[] {
    return this.evaluateOpportunities(state, context).filter(o => o.eligible && o.weight > 0);
  }
}
