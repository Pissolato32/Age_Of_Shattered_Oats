import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toNarrativeProjection } from '../../src/lib/narrativeProjection';
import { ExecutionReport, NarrativeScene } from '../../src/lib/narrativeContracts';

describe('=== M27.2: NARRATIVE PROJECTION EPISTEMIC INTEGRITY ===', () => {
  const sampleReport: ExecutionReport = {
    contractVersion: 1,
    reportId: 'REP-101',
    command: {
      commandId: 'CMD-101',
      actorId: 'Comandante Vane',
      action: 'RECRUIT',
      targetId: 'infantry_unit_5',
      locationId: 'Valenfort Keep'
    },
    status: 'ACCEPTED',
    actionExecuted: 'RECRUIT',
    affectedEntities: [
      { entityId: 'char_88', entityType: 'CHARACTER', role: 'ACTOR' },
      { entityId: 'res_silverdew', entityType: 'RESOURCE', role: 'AFFECTED' }
    ],
    stateChanges: [
      { path: 'treasury.silverdew', before: 500, after: 420, delta: -80 }
    ],
    consequences: [
      {
        consequenceId: 'CNS-01',
        kind: 'IMMEDIATE',
        description: 'Os novos recrutas assumiram seus postos nas muralhas externas.',
        authorized: true
      }
    ],
    discoveredInformation: [
      {
        factId: 'FCT-01',
        statement: 'A guarnição atingiu prontidão de combate.',
        tier: 'CHARACTER_KNOWLEDGE',
        certainty: 'CONFIRMED',
        source: 'ENGINE'
      }
    ],
    hiddenInformationIds: ['SECRET-88'],
    events: [
      {
        eventId: 'EV-101',
        eventType: 'RECRUIT_COMPLETED',
        summary: 'Vinte voluntários prestaram juramento na praça de armas.',
        week: 14,
        knowledgeTier: 'CHARACTER_KNOWLEDGE'
      }
    ],
    reasonCode: 'RECRUIT_OK_TREASURY_SUFFICIENT',
    magnitude: {
      mode: 'FIXED',
      value: 20,
      source: 'PLAYER_EXPLICIT',
      min: 20,
      max: 20
    }
  };

  it('[PROJECTION-01] Não deve conter siglas, valores numéricos de recursos ou termos mecânicos', () => {
    const projection = toNarrativeProjection(sampleReport);
    const serialized = JSON.stringify(projection);

    // 1. Siglas e termos de RPG/sistema
    const forbiddenTerms = [
      'silverdew',
      'res_silverdew',
      'char_88',
      'RECRUIT_OK_TREASURY_SUFFICIENT',
      'CMD-101',
      'REP-101',
      'delta',
      'before',
      'after',
      'ACCEPTED',
      'REJECTED',
      'SECRET-88'
    ];

    for (const term of forbiddenTerms) {
      assert.strictEqual(
        serialized.includes(term),
        false,
        `Violação epistemológica: NarrativeProjection vazou termo técnico '${term}'`
      );
    }
  });

  it('[PROJECTION-02] Deve preservar integralmente todos os fatos autoritativos e eventos observáveis', () => {
    const projection = toNarrativeProjection(sampleReport);

    assert.strictEqual(projection.outcome, 'success');
    assert.strictEqual(projection.subject, 'Comandante Vane');
    assert.strictEqual(projection.location, 'Valenfort Keep');
    assert.strictEqual(projection.visibleEvents.length, 1);
    assert.strictEqual(projection.visibleEvents[0].description, 'Vinte voluntários prestaram juramento na praça de armas.');
    assert.strictEqual(projection.authoritativeFacts.includes('A guarnição atingiu prontidão de combate.'), true);
    assert.strictEqual(projection.authoritativeFacts.includes('Os novos recrutas assumiram seus postos nas muralhas externas.'), true);
  });

  it('[PROJECTION-03] Não deve inventar clima, humor ou atmosfera quando inexistentes no World State', () => {
    const projectionWithoutScene = toNarrativeProjection(sampleReport);
    assert.strictEqual(projectionWithoutScene.sensoryContext, undefined);

    const emptyScene: NarrativeScene = {
      locationId: 'loc_1',
      regionName: 'Frostfall',
      environment: '',
      weather: '',
      season: 'Inverno'
    };

    const projectionWithPartialScene = toNarrativeProjection(sampleReport, emptyScene);
    assert.strictEqual(projectionWithPartialScene.sensoryContext?.season, 'Inverno');
    assert.strictEqual(projectionWithPartialScene.sensoryContext?.region, 'Frostfall');
    assert.strictEqual(projectionWithPartialScene.sensoryContext?.environment, undefined);
  });
});
