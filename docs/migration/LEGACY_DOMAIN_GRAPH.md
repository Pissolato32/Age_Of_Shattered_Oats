# LEGACY_DOMAIN_GRAPH.md

## Visão Geral dos Domínios Legados

- **Character**: domínio já consolidado na nova base.
- **Narrator**: candidato principal para migração; depende de `EventStore`, `SnapshotStore`, `RandomService`, `Clock`.
- **Crime**: utiliza `RandomService` (RNG) e persistência via SQLite/TypeORM.
- **Outros Domínios**: listados em `src/domain/` (consultar estrutura de diretórios).

> Este documento serve como referência para entender as dependências entre os domínios legados.
