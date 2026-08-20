import { CampaignState } from '../types';
import { globalRNG } from './RandomService';
import * as crypto from 'crypto';

export interface StateSnapshot {
  tick: number;
  week: number;
  stateHash: string;
  state: CampaignState;
  timestamp: string;
}

/**
 * SnapshotStore - Gerenciador de Snapshots e Pontos de Checagem Determinísticos
 * 
 * Registra o estado da campanha em intervalos de tempo para permitir:
 * 1. Replay de episódios da campanha com garantia de integridade.
 * 2. Validação rápida contra dessincronização sem precisar reprocessar do tick 0.
 */
export class SnapshotStore {
  private snapshots: Map<number, StateSnapshot> = new Map();

  public createSnapshot(tick: number, state: CampaignState): StateSnapshot {
    const serializedState = JSON.stringify(state);
    const hash = crypto.createHash('sha256').update(serializedState).digest('hex');

    const snapshot: StateSnapshot = {
      tick,
      week: state.weeklyLedger.week,
      stateHash: hash,
      state: JSON.parse(serializedState),
      timestamp: new Date().toISOString()
    };

    this.snapshots.set(tick, snapshot);
    return snapshot;
  }

  public getSnapshot(tick: number): StateSnapshot | undefined {
    return this.snapshots.get(tick);
  }

  public getAllSnapshots(): StateSnapshot[] {
    return Array.from(this.snapshots.values()).sort((a, b) => a.tick - b.tick);
  }

  public clear(): void {
    this.snapshots.clear();
  }
}

export const globalSnapshotStore = new SnapshotStore();
