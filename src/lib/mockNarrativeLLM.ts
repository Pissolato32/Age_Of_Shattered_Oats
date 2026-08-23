import {
  NarrativeContext,
  NarrativeCommand
} from './narrativeContracts';
import {
  IncidentNarrativeRequest,
  IncidentNarrativeResponse
} from '../domain/events/narrative/IncidentNarrativeContracts';
import { buildProceduralIncidentNarrative } from '../domain/events/narrative/IncidentNarrativeTranslator';
import { InterpretInput, NarrativeLLM } from './narrativeLLM';
import { interpretIntentHeuristically } from './intentHeuristics';

export const interpretInput = interpretIntentHeuristically;

/**
 * Deterministic offline provider for the vertical slice. Keyword-driven, no
 * network, no API key, no RNG, no clock. It never accesses CampaignState
 * directly: it grounds only on the Engine-authorized inputs it receives
 * (ObserverProjection for interpretation, NarrativeContext for narration).
 */
export class MockNarrativeLLM implements NarrativeLLM {
  readonly providerId = 'mock';
  readonly modelId = 'mock-deterministic';

  interpret(input: InterpretInput): Promise<NarrativeCommand> {
    return Promise.resolve(interpretInput(input.playerInput));
  }

  narrate(context: NarrativeContext): Promise<string> {
    return Promise.resolve(narrateReport(context));
  }

  narrateIncident(request: IncidentNarrativeRequest): Promise<IncidentNarrativeResponse> {
    return Promise.resolve(buildProceduralIncidentNarrative(request));
  }
}

function narrateReport(context: NarrativeContext): string {
  const report = context.executionResult;
  const loc = context.scene.locationId || 'Grey Keep';

  if (report.status === 'REJECTED') {
    if (report.reasonCode.includes('esclarecimento')) {
      return 'Antes de qualquer ação, preciso de um esclarecimento: o que exatamente deseja fazer?';
    }
    return `A ação solicitada não foi executada: ${report.reasonCode}`;
  }

  switch (report.actionExecuted) {
    case 'RECRUIT': {
      const levies = report.stateChanges.find(sc => sc.path === 'army.units.levies')?.delta ?? 0;
      return `O recrutamento foi autorizado: ${levies} soldados incorporados às suas forças, e o tesouro arcou com o ônus devido.`;
    }
    case 'BUILD': {
      const silverdew = report.stateChanges.find(sc => sc.path === 'weeklyLedger.silverdew')?.delta ?? 0;
      return `A construção foi autorizada: a paliçada avança sob as muralhas, custo total de ${Math.abs(silverdew)} SD.`;
    }
    case 'TRADE': {
      const foodChange = report.stateChanges.find(sc => sc.path === 'weeklyLedger.food')?.delta;
      if (foodChange !== undefined && typeof foodChange === 'number') {
        return foodChange < 0
          ? `O intendente concluiu a negociação com a caravana mercantil: as sacas de grãos foram entregues aos comboios e as moedas de prata ingressaram nos cofres de ferro da fortaleza.`
          : `A compra de provisões foi concluída junto aos mercadores e os suprimentos foram descarregados nos depósitos.`;
      }
      return 'As negociações comerciais foram autorizadas e registradas pelos intendentes da fortaleza.';
    }
    case 'ESPIONAGE': {
      const csq = report.consequences[0]?.description;
      if (csq) return csq;
      return 'A missão de reconhecimento foi executada e os batedores retornaram aos postos da fortaleza.';
    }
    case 'DIPLOMACY': {
      const csq = report.consequences[0]?.description;
      if (csq) return csq;
      return 'A comitiva formal concluiu a missão diplomática e apresentou os despachos oficiais perante a corte.';
    }
    case 'MILITARY': {
      const csq = report.consequences[0]?.description;
      if (csq) return csq;
      return 'O destacamento militar manobrou no terreno e estabeleceu a posição tática ordenada.';
    }
    case 'INFORMATION': {
      if (report.discoveredInformation && report.discoveredInformation.length > 0) {
        return `O relatório oficial foi registrado nos anais: ${report.discoveredInformation.map(f => f.statement).join(' ')}`;
      }
      const defenseMemory = context.knownFacts.find(f => f.subjectId === 'holdings.fortification' || f.statement.includes('Inspeção'));
      if (defenseMemory) {
        return `Aldren consulta os registros preservados da fortaleza: ${defenseMemory.statement.replace(/^\[Memória\]\s*/, '')}`;
      }
      return `Mara e o Marechal Ren reúnem os pergaminhos sobre a mesa em ${loc}. As defesas permanecem sob vigilância e o conselho recomenda reforçar a guarda, fortificar as muralhas ou enviar batedores para sondar as fronteiras.`;
    }
    default:
      return 'A solicitação foi registrada e autorizada sem alteração mecânica.';
  }
}