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

  public record(type: string, payload: any, week: number, explicitSequence?: number): CampaignEvent {
    const seq = explicitSequence !== undefined ? explicitSequence : (this.sequenceCounter + 1);
    this.sequenceCounter = seq;
    const timestamp = `1970-01-01T00:00:00Z`;
    const rawContent = JSON.stringify({ sequence: seq, type, payload, week });
    
    // Hash determinístico puro derivado do conteúdo e sequência
    let h = 0;
    for (let i = 0; i < rawContent.length; i++) {
      h = ((h << 5) - h + rawContent.charCodeAt(i)) | 0;
    }
    const hash = `evt_${seq}_${Math.abs(h)}`;

    const event: CampaignEvent = {
      id: `evt_${seq}_${Math.abs(h)}`,
      sequence: seq,
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
