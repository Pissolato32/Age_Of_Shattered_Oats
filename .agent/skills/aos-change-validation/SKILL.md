---
name: aos-change-validation
description: Workflow operacional de 10 passos para investigar, implementar e validar alterações de engenharia no repositório.
---

# Workflow de Validação de Mudanças (10 Passos)

Siga este procedimento antes de considerar qualquer alteração concluída no projeto:

1. **Inspecionar a arquitetura existente**: Identifique os módulos, contratos e fluxos envolvidos.
2. **Procurar implementação equivalente**: Verifique se já existe código, tipo ou serviço atendendo à mesma finalidade.
3. **Identificar a fonte canônica da verdade**: Localize quem é o dono autoritativo do dado (`worldLedger`, subsistema específico ou `engine.ts`).
4. **Identificar invariantes afetados**: Mapeie propriedades de conservação, determinismo de RNG ou contratos semânticos impactados.
5. **Implementar a menor mudança possível**: Corrija o fluxo existente na raiz; nunca adicione camadas desnecessárias, adaptadores artificiais ou campos redundantes.
6. **Executar testes específicos**: Rode os testes unitários do domínio alterado (`tests/domain/*`).
7. **Executar testes de integração**: Valide o encadeamento entre subsistemas (`tests/integration/*`).
8. **Executar replay / simulação**: Rode `npm run replay:validate` ou a simulação correspondente conforme a matriz de simulação.
9. **Verificar diff**: Inspecione se há tipos `any`, dependências supérfluas ou violações de silêncio mecânico no diff.
10. **Conclusão**: Considere a tarefa concluída somente após a aprovação de todos os gates de validação.
