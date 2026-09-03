// Interaction and outcome enums for ARCH-003

/** Nature of the player's intention after LLM interpretation */
export enum IntentKind {
  INFORMATION_QUERY = 'INFORMATION_QUERY',
  ACTION_PROPOSAL = 'ACTION_PROPOSAL',
  CLARIFICATION_REQUEST = 'CLARIFICATION_REQUEST',
  UNSUPPORTED_INTENT = 'UNSUPPORTED_INTENT',
}

/** High‑level outcome categories for the interaction pipeline */
export enum OutcomeKind {
  INFORMATION = 'INFORMATION',
  ACTION = 'ACTION',
  CLARIFICATION = 'CLARIFICATION',
  UNSUPPORTED = 'UNSUPPORTED',
  REJECTED = 'REJECTED',
}

/** Result status for a resolved action */
export enum ActionStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  UNSUPPORTED_CAPABILITY = 'UNSUPPORTED_CAPABILITY',
}

/** Whitelist of facts that may be exposed to the player */
export enum AuthorizedFactKey {
  MEN_COUNT = 'MEN_COUNT',
  LOCATION = 'LOCATION',
  SUPPLIES = 'SUPPLIES',
  ALLIES = 'ALLIES',
  // Extend as needed
}

/** Helper to map a fact key to a readable statement based on CampaignState */
export function renderFact(key: AuthorizedFactKey, state: any): string {
  switch (key) {
    case AuthorizedFactKey.MEN_COUNT:
      return `Vocês têm ${state.weeklyLedger?.incomeDetail?.recruitment ?? 0} homens disponíveis.`;
    case AuthorizedFactKey.LOCATION:
      return `Vocês estão em ${state.character?.location?.region ?? 'uma região desconhecida'}.`;
    case AuthorizedFactKey.SUPPLIES:
      return `Suprimentos atuais: ${state.weeklyLedger?.food ?? 0} unidades.`;
    case AuthorizedFactKey.ALLIES:
      return `Aliados conhecidos: ${state.worldLedger?.nobleHouses?.map((h: any) => h.name).join(', ') ?? 'nenhum'}.`;
    default:
      return '';
  }
}
