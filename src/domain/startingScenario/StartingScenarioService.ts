/**
 * StartingScenarioService.ts
 *
 * Deterministic NPC introduction for campaign kickoff.
 * Selects key NPCs from the historical roster based on archetype and region,
 * builds factual profiles, and generates a narrative introduction.
 *
 * CONSTRAINTS:
 * - LLM does NOT modify CampaignState.
 * - NPC selection uses deterministic RNG (globalRNG), never Math.random().
 * - Presented NPCs are determined by Starting Scenario / context, not LLM preference.
 * - Intro narration is a projection of already-determined facts.
 */

import { CampaignState, Character } from '../../types';
import { RandomService } from '../../core/RandomService';
import { CharacterLifecycleService, HistoricalCharacter } from '../character/CharacterLifecycle';
import {
  StartingScenarioFacts,
  StartingScenarioResult,
  NpcProfile
} from './StartingScenarioContract';

export interface StartingScenarioContext {
  readonly state: CampaignState;
  readonly archetype: Character['archetype'];
  readonly region: string;
  readonly rng?: RandomService;
  readonly llm?: {
    narrate(context: any): Promise<string>;
  };
}

const MAX_PRESENTED_NPCS = 3;

const ROLE_LABELS: Record<string, string> = {
  chancellor: 'Chanceler e Conselheiro Político',
  marshal: 'Marechal e Comandante das Forças',
  steward: 'Intendente de Provisões e Finanças',
  spymaster: 'Mestre dos Sussurros e Informações',
  sovereign: 'Soberano'
};

const ARCHETYPE_NPC_WEIGHTS: Record<Character['archetype'], readonly string[]> = {
  'Noble Ruler': ['chancellor', 'steward', 'marshal'],
  'Landed Knight': ['marshal', 'steward', 'chancellor'],
  'Landless': ['chancellor', 'marshal', 'steward'],
  'Artificer': ['steward', 'chancellor', 'marshal'],
  'Necromancer': ['spymaster', 'chancellor', 'marshal']
};

const DISPOSITION_MAP: Record<string, string> = {
  chancellor: 'Leal mas opinativo. Favorece a diplomacia.',
  marshal: 'Direto e pragmático. Favorece ação militar.',
  steward: 'Cauteloso e metódico. Favorece estabilidade.',
  spymaster: 'Observador e silencioso. Favorece informação.'
};

const RELATIONSHIP_MAP: Record<string, string> = {
  chancellor: 'Consulente político de confiança do soberano.',
  marshal: 'Comandante militar leal à coroa.',
  steward: 'Administrador designado pelo soberano.',
  spymaster: 'Olhos e ouvidos do soberano nas sombras.'
};

const BACKGROUND_NOTES: Record<string, string[]> = {
  chancellor: [
    'Conselheiro experimentado nas artes da diplomacia.',
    'Veterano de negociações entre casas nobres.',
    'Conhece os tejidos da corte como ninguém.'
  ],
  marshal: [
    'Comandante de campo com décadas de serviço.',
    'Veterano de campanhas fronteiriças.',
    'Estrategista nato com instinto para terreno.'
  ],
  steward: [
    'Mestre provado na gestão de recursos e provisões.',
    'Administrador meticuloso do erário real.',
    'Conhece cada bushel de grão e cada moeda no cofre.'
  ],
  spymaster: [
    'Rede de informantes cultuada nas sombras.',
    'Mestre na arte de extrair segredos.',
    'Silencioso observador dos movimentos da corte.'
  ]
};

const ARCHETYPE_SITUATIONAL_PRESSURES: Record<Character['archetype'], string> = {
  'Noble Ruler': 'Garantir a estabilidade da região e o abastecimento dos celeiros sob os olhos vigilantes das casas vizinhas.',
  'Landed Knight': 'Manter a vigília marcial nas muralhas e guarnecer as passagens contra incursões na fronteira.',
  'Landless': 'Assegurar o sustento do bando de armas na estrada e evitar que a tropa se disperse por falta de soldo e saque.',
  'Artificer': 'Suprir a oficina com ferro e madeira para reforçar as defesas e armamentos antes do avanço do inverno.',
  'Necromancer': 'Consolidar o domínio sepulcral no bastião sob o isolamento político e a desconfiança perigosa dos vivos.'
};

const SPEAKER_OPENING_LINES: Record<string, string> = {
  chancellor: 'As cartas das casas vizinhas já chegaram com os primeiros mensageiros. Cada senhor medirá vossa determinação antes de firmar qualquer pacto.',
  marshal: 'As sentinelas foram postadas nos parapeitos e os caminhos de ronda estão patrulhados. Nenhuma lança inimiga se moverá nos desfiladeiros sem que sejamos avisados.',
  steward: 'Os registros dos celeiros e do erário foram conferidos. As arcas e as provisões de grãos exigem medida austera se quisermos atravessar as próximas estações.',
  spymaster: 'As estradas trazem mais sussurros do que mercadorias. Quem não vigia as sombras da corte termina cercado sem saber por onde veio o golpe.'
};

export class StartingScenarioService {
  static build(context: StartingScenarioContext): StartingScenarioResult {
    const { state, archetype, region, rng } = context;

    const roster = [...CharacterLifecycleService.peekHistoricalRoster(state)];
    const selected = this.selectNpcs(roster, archetype, rng);
    const facts = this.buildFacts(state, archetype, region, selected, roster);
    const introNarration = this.generateIntro(facts);

    return { facts, introNarration, source: 'PROCEDURAL_FALLBACK' };
  }

  static async buildWithNarrative(context: StartingScenarioContext): Promise<StartingScenarioResult> {
    if (!context.llm) {
      return this.build(context);
    }

    const { state, archetype, region, rng, llm } = context;

    const roster = [...CharacterLifecycleService.peekHistoricalRoster(state)];
    const selected = this.selectNpcs(roster, archetype, rng);
    const facts = this.buildFacts(state, archetype, region, selected, roster);

    try {
      const narration = await this.generateLlmIntro(facts, llm);
      return { facts, introNarration: narration, source: 'LLM' };
    } catch {
      const introNarration = this.generateIntro(facts);
      return { facts, introNarration, source: 'PROCEDURAL_FALLBACK' };
    }
  }

  private static selectNpcs(
    roster: readonly HistoricalCharacter[],
    archetype: Character['archetype'],
    rng?: RandomService
  ): HistoricalCharacter[] {
    const preferredRoles = ARCHETYPE_NPC_WEIGHTS[archetype];
    if (!preferredRoles) {
      throw new Error(
        `[StartingScenarioService] Invalid or unsupported archetype: '${String(archetype)}'. ` +
        `Must be one of the canonical character archetypes.`
      );
    }

    const candidates = roster.filter(c =>
      c.lifeState === 'alive' &&
      c.currentRole !== null &&
      c.currentRole !== 'sovereign'
    );

    const selected: HistoricalCharacter[] = [];
    const usedIds = new Set<string>();

    for (const role of preferredRoles) {
      const match = candidates.find(c => c.currentRole === role && !usedIds.has(c.id));
      if (match) {
        selected.push(match);
        usedIds.add(match.id);
      }
    }

    if (selected.length < MAX_PRESENTED_NPCS) {
      const remaining = candidates.filter(c => !usedIds.has(c.id));
      const shuffled = rng ? rng.shuffle([...remaining]) : [...remaining];
      for (const c of shuffled) {
        if (selected.length >= MAX_PRESENTED_NPCS) break;
        selected.push(c);
        usedIds.add(c.id);
      }
    }

    return selected.slice(0, MAX_PRESENTED_NPCS);
  }

  private static buildFacts(
    state: CampaignState,
    archetype: Character['archetype'],
    region: string,
    selected: HistoricalCharacter[],
    roster: readonly HistoricalCharacter[]
  ): StartingScenarioFacts {
    const npcProfiles: NpcProfile[] = selected.map((c, idx) => ({
      id: c.id,
      name: c.name,
      role: ROLE_LABELS[c.currentRole || ''] || c.currentRole || 'Advisor',
      house: c.house,
      disposition: DISPOSITION_MAP[c.currentRole || ''] || 'Neutro e disponível.',
      relationshipToPlayer: RELATIONSHIP_MAP[c.currentRole || ''] || 'Servidor da coroa.',
      backgroundNote: this.pickBackground(c.currentRole || '', c.id),
      speechStatus: idx === 0 ? 'SPEAKING' : 'SILENT'
    }));

    const primarySpeaker = npcProfiles.length > 0 ? npcProfiles[0] : undefined;
    const silentObservers = npcProfiles.length > 1 ? npcProfiles.slice(1) : [];

    const landmark = state.character.location.landmark || state.holdings.name || 'Grey Keep';
    const regionName = region || state.character.location.region || state.holdings.region || 'Terras Centrais';
    const season = state.weeklyLedger.season || 'Thawtide';
    const weather = state.weeklyLedger.weather || 'tempo firme e frio';
    const holdingType = state.holdings.type || (archetype === 'Landless' ? 'Camp' : 'Bastion');
    const holdingName = state.holdings.name || landmark;
    const playerTitle = state.character.title || (archetype === 'Landless' ? 'Capitão' : (archetype === 'Landed Knight' ? 'Sir' : 'Soberano'));
    const situationalPressure = ARCHETYPE_SITUATIONAL_PRESSURES[archetype] || 'Garantir a ordem inicial nas terras sob vosso domínio.';

    const contextNotes: string[] = [
      `Localização: ${landmark} na região de ${regionName}.`,
      `Estação e clima: ${season}, sob ${weather}.`,
      `Arquétipo e título: ${playerTitle} (${archetype}).`,
      `Situação do domínio: ${situationalPressure}`
    ];

    if (primarySpeaker) {
      contextNotes.push(
        `Conselheiro porta-voz: ${primarySpeaker.name} (${primarySpeaker.role}) é o único autorizado a se manifestar nesta abertura.`
      );
    }

    if (silentObservers.length > 0) {
      contextNotes.push(
        `Conselheiros observadores em silêncio: ${silentObservers.map(p => `${p.name} (${p.role})`).join(', ')}.`
      );
    }

    return {
      playerCharacterName: state.character.name,
      playerHouse: state.character.house,
      playerTitle,
      archetype,
      region: regionName,
      landmark,
      season,
      weather,
      holdingType,
      holdingName,
      situationalPressure,
      presentedNpcs: npcProfiles,
      primarySpeaker,
      silentObservers,
      initialContextNotes: contextNotes,
      absoluteTurn: 1
    };
  }

  private static pickBackground(role: string, characterId: string): string {
    const pool = BACKGROUND_NOTES[role] || BACKGROUND_NOTES['chancellor'];
    const index = this.simpleHash(characterId) % pool.length;
    return pool[index];
  }

  private static simpleHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  private static generateAtmosphere(facts: StartingScenarioFacts): string {
    switch (facts.archetype) {
      case 'Landed Knight':
        return `A geada matinal cobre os parapeitos de ${facts.landmark} sob o ${facts.weather} de ${facts.season}. Como ${facts.playerTitle || 'Sir'} da casa ${facts.playerHouse}, vosso comando nas terras de ${facts.region} é medido pelo fio do ferro e pela firmeza das vigílias nas fronteiras.`;
      case 'Landless':
        return `A fumaça da fogueira de acampamento sobe no ar cortante de ${facts.season} em ${facts.region}. Como ${facts.playerTitle || 'Capitão'} ${facts.playerCharacterName}, vossa autoridade não provém de velhos castelos, mas da lealdade dos homens reunidos na estrada e da vigilância contra emboscadas na terra sem lei.`;
      case 'Artificer':
        return `O calor das forjas combate a névoa úmida e o vento frio de ${facts.season} em ${facts.landmark}. Como ${facts.playerTitle || 'Mestre Artífice'} da casa ${facts.playerHouse}, as obras de defesa e o suprimento de ferragens em ${facts.region} exigem engenho antes que as neves fechem as passagens.`;
      case 'Necromancer':
        return `Um silêncio sepulcral domina as muralhas escuras de ${facts.landmark} sob o manto gélido de ${facts.season}. Como ${facts.playerTitle || 'Senhor'} da casa ${facts.playerHouse}, vosso domínio sobre ${facts.region} ergue-se nas sombras de juramentos desfeitos, onde a névoa oculta segredos que poucos ousam encarar.`;
      case 'Noble Ruler':
      default:
        return `O vento áspero de ${facts.season} sopra pelas frestas de pedra em ${facts.landmark}. Como ${facts.playerTitle || 'soberano'} da casa ${facts.playerHouse}, o governo de ${facts.region} repousa sobre vossos ombros, onde a lealdade dos vassalos e o sustento das terras exigem vigilância constante.`;
    }
  }

  private static generateCouncilScene(facts: StartingScenarioFacts): string {
    if (!facts.primarySpeaker) {
      return 'Nenhum conselheiro se encontra presente na sala para apresentar o estado do domínio.';
    }

    const speakerRoleKey = facts.primarySpeaker.role.toLowerCase();
    let speechLine = SPEAKER_OPENING_LINES['chancellor'];
    if (speakerRoleKey.includes('marechal') || speakerRoleKey.includes('forças')) {
      speechLine = SPEAKER_OPENING_LINES['marshal'];
    } else if (speakerRoleKey.includes('intendente') || speakerRoleKey.includes('provisões') || speakerRoleKey.includes('finanças')) {
      speechLine = SPEAKER_OPENING_LINES['steward'];
    } else if (speakerRoleKey.includes('sussurros') || speakerRoleKey.includes('informações')) {
      speechLine = SPEAKER_OPENING_LINES['spymaster'];
    }

    const speakerDialogue = `Perante o assento de comando, ${facts.primarySpeaker.name}, ${facts.primarySpeaker.role.toLowerCase()} de casa ${facts.primarySpeaker.house || 'desconhecida'}, toma a palavra: "${speechLine}"`;

    if (facts.silentObservers.length === 0) {
      return speakerDialogue;
    }

    const observersNames = facts.silentObservers
      .map(o => `${o.name}, ${o.role.toLowerCase()}`)
      .join(' e ');
    const observerVerb = facts.silentObservers.length > 1 ? 'permanecem' : 'permanece';
    const observerClause = `Ao lado, ${observersNames} ${observerVerb} em silêncio junto à mesa de carvalho, acompanhando o relatório com olhos atentos.`;

    return `${speakerDialogue}\n\n${observerClause}`;
  }

  private static generateIntro(facts: StartingScenarioFacts): string {
    const atmosphere = this.generateAtmosphere(facts);
    const councilScene = this.generateCouncilScene(facts);
    return `${atmosphere}\n\n${councilScene}`;
  }

  private static async generateLlmIntro(
    facts: StartingScenarioFacts,
    llm: { narrate(context: any): Promise<string> }
  ): Promise<string> {
    const introContext = {
      contractVersion: '1.0',
      observer: {
        observerId: 'player',
        name: facts.playerCharacterName,
        role: 'sovereign',
        perspective: 'FIRST_PERSON'
      },
      scene: {
        locationId: facts.landmark,
        regionName: facts.region,
        environment: facts.holdingType === 'Camp' ? 'Acampamento militar' : 'Fortaleza de pedra',
        weather: facts.weather,
        season: facts.season,
        sceneState: 'Continuing',
        currentActivity: 'Abertura do governo e conselho inaugural',
        immediateCircumstances: facts.initialContextNotes
      },
      actors: facts.presentedNpcs.map(npc => ({
        actorId: npc.id,
        name: npc.name,
        role: npc.role,
        house: npc.house,
        speechStatus: npc.speechStatus
      })),
      relationships: [],
      knownFacts: facts.initialContextNotes.map((note, i) => ({
        factId: `intro_fact_${i}`,
        subject: 'starting_scenario',
        statement: note,
        source: 'ENGINE' as const,
        obtainedTurn: 1,
        visibility: 'PUBLIC' as const
      })),
      recentEvents: [],
      executionResult: {
        contractVersion: '1.0',
        reportId: 'intro_bootstrapper',
        command: {
          commandId: 'intro_bootstrap',
          actorId: 'player',
          action: 'INAUGURATE_GOVERNMENT'
        },
        status: 'ACCEPTED',
        actionExecuted: 'INAUGURATE_GOVERNMENT',
        affectedEntities: [],
        stateChanges: [],
        consequences: [],
        discoveredInformation: [],
        hiddenInformationIds: [],
        events: [],
        reasonCode: 'CAMPAIGN_START'
      },
      narrativeConstraints: [
        {
          code: 'RESPECT_SPEAKING_ROLES',
          instruction: facts.primarySpeaker
            ? `Apenas o conselheiro porta-voz (${facts.primarySpeaker.name}, ${facts.primarySpeaker.role}) deve falar ou manifestar-se diretamente na cena. Os demais conselheiros presentes (${facts.silentObservers.map(n => n.name).join(', ')}) devem permanecer estritamente em silêncio observando, sem qualquer fala atribuída.`
            : 'Nenhum conselheiro fala na cena.'
        },
        {
          code: 'NO_CHARACTER_SHEET_LISTING',
          instruction: 'Proibido listar fichas técnicas, traços de personalidade ou preferências dos personagens em formato de cadastro. A cena deve ser uma prosa contínua e imersiva de abertura em 1 ou 2 parágrafos curtos.'
        },
        {
          code: 'IRON_CHRONICLE_TONE',
          instruction: 'Escreva no tom da Crônica de Ferro: frio, realista, visceral, sóbrio e contido. Use o ambiente físico (vento, pedra, geada, fogo, fumaça, ferro) como âncora sensorial.'
        },
        {
          code: 'ABSOLUTE_MECHANICAL_SILENCE',
          instruction: 'Silêncio mecânico absoluto: nunca mencione moedas, números brutos, pontos de status, dados estatísticos ou regras de sistema. Transforme os fatos em consequências físicas e materiais.'
        }
      ]
    };

    const narration = await llm.narrate(introContext);
    if (!narration || narration.trim().length === 0) {
      throw new Error('LLM returned empty intro narration');
    }
    return narration.trim();
  }
}
