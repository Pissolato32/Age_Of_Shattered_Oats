import { globalRNG } from './RandomService';

export interface CampaignEvent {
  id: string;
  sequence: number;
  type: string;
  payload: any;
  timestamp: string;
  week: number;
  hash: string;
}

/**
 * EventStore - Repositório de Eventos Imutáveis para Auditoria e Replay (AOS V4.7/V4.8)
 * 
 * Substitui a mutação invisível de "estado mágico" por uma trilha auditável de eventos.
 * Permite responder exatamente: "Por que esse território/recurso/soldado tem este valor?"
 */
export class EventStore {
  private events: CampaignEvent[] = [];
  private sequenceCounter: number = 0;

  public record(type: string, payload: any, week: number): CampaignEvent {
    this.sequenceCounter += 1;
    const timestamp = new Date().toISOString();
    const rawContent = JSON.stringify({ sequence: this.sequenceCounter, type, payload, week });
    
    // Hash determinístico simples para encadeamento de auditoria
    const hash = `evt_${this.sequenceCounter}_${globalRNG.nextInt(1000, 9999)}`;

    const event: CampaignEvent = {
      id: `evt_${Date.now()}_${this.sequenceCounter}`,
      sequence: this.sequenceCounter,
      type,
      payload,
      timestamp,
      week,
      hash
    };

    this.events.push(event);
    return event;
  }

  public getEvents(): CampaignEvent[] {
    return [...this.events];
  }

  public getEventsByType(type: string): CampaignEvent[] {
    return this.events.filter(e => e.type === type);
  }

  public getEventsSinceWeek(week: number): CampaignEvent[] {
    return this.events.filter(e => e.week >= week);
  }

  public clear(): void {
    this.events = [];
    this.sequenceCounter = 0;
  }

  public loadHistory(events: CampaignEvent[]): void {
    this.events = [...events];
    this.sequenceCounter = events.length > 0 ? Math.max(...events.map(e => e.sequence)) : 0;
  }
}

export const globalEventStore = new EventStore();
