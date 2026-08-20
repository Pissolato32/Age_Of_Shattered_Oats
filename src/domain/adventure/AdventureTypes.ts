export interface AdventureChoice {
  id: string;
  text: string;
  skillCheck?: string;
  difficulty?: number;
  outcomeText: string;
  resourceDelta?: {
    silverdew?: number;
    food?: number;
    troops?: number;
    reputation?: number;
  };
}

export interface AdventureNode {
  id: string;
  title: string;
  description: string;
  choices: AdventureChoice[];
}

export interface AdventureState {
  active: boolean;
  currentAdventureId?: string;
  currentNodeId?: string;
  stepCount: number;
}
