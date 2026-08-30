> STATUS: HISTORICAL / SUPERSEDED
>
> Este documento representa o rascunho de triagem preliminar de dependências legadas.
> Nota de Atualização: O domínio `Narrator` (inicialmente cogitado como candidato principal) foi formalmente **REJEITADO** devido ao acoplamento crítico com `StateApplicator` e mutações bidirecionais em disco (vide [NARRATOR_MIGRATION_READINESS.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/NARRATOR_MIGRATION_READINESS.md)).
>
> Referência Canônica de Consolidação: [MIGRATION_MATRIX.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/MIGRATION_MATRIX.md)

---

# LEGACY_DOMAIN_GRAPH.md (Rascunho Histórico)

## Visão Geral dos Domínios Legados (Snapshot Preliminar)

- **Character**: domínio consolidado na base (`src/domain/character/`).
- **Narrator**: *Rejeitado formalmente* — a arquitetura canônica utiliza a pipeline determinística de `src/lib/` sem mutação de estado por IA.
- **Crime**: utiliza `RandomService` (RNG) e persistência via SQLite/TypeORM (pendente de extração seletiva).
- **Consolidação dos 16 Domínios**: Consulte a matriz central em [MIGRATION_MATRIX.md](file:///c:/Projetos/Age_Of_Shattered_Oats/docs/migration/MIGRATION_MATRIX.md).
