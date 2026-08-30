import assert from 'node:assert/strict';
import {
  NARRATIVE_CONTRACT_VERSION,
  createNarrativeContext,
  ObserverProjection,
  ExecutionReport,
  NarrativeObserver
} from '../src/lib/narrativeContracts';

const observer: NarrativeObserver = { kind: 'PLAYER', observerId: 'player' };

const projection: ObserverProjection = {
  contractVersion: NARRATIVE_CONTRACT_VERSION,
  observer,
  scene: {
    locationId: 'Valenfort',
    regionName: 'Central Plains',
    environment: 'Settlement',
    weather: 'Clear',
    season: 'Thawtide'
  },
  actors: [],
  relationships: [],
  knownFacts: [],
  recentEvents: [],
  narrativeConstraints: []
};

const report: ExecutionReport = {
  contractVersion: NARRATIVE_CONTRACT_VERSION,
  reportId: 'rep_1',
  command: {
    commandId: 'cmd_1',
    actorId: 'player',
    action: 'RECRUIT'
  },
  status: 'ACCEPTED',
  actionExecuted: 'RECRUIT',
  affectedEntities: [],
  stateChanges: [],
  consequences: [],
  discoveredInformation: [],
  hiddenInformationIds: [],
  events: [],
  reasonCode: 'ALLOWED'
};

const context = createNarrativeContext(projection, report);
assert.equal(context.contractVersion, NARRATIVE_CONTRACT_VERSION);
assert.equal(context.observer.observerId, 'player');
assert.equal(context.executionResult.status, 'ACCEPTED');
console.log('NarrativeContracts.test.ts: PASS');
