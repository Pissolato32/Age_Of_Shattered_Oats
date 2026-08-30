# Age of Shattered Oaths - Invariantes de Domínio e Engenharia

1. **Autoridade do Engine e Proveniência de Mutação**:
   - `engine.ts` é o orquestrador autoritativo do sistema.
   - Toda mutação persistente no estado do jogo (`CampaignState`) precisa ter proveniência determinística e rastreável.
   - `worldLedger` é a fonte canônica da verdade para os dados e recursos sob sua responsabilidade.

2. **RNG e Determinismo**:
   - Toda aleatoriedade deve utilizar estritamente o mecanismo canônico de RNG determinístico/semeado do motor.
   - É terminantemente proibido introduzir `Math.random()` ou fontes de aleatoriedade não reproduzíveis no pipeline mecânico.

3. **Integridade Estrutural e Tipagem**:
   - Não crie estado paralelo ou campos redundantes para contornar estruturas existentes.
   - É proibido usar `any` para escapar do sistema de tipos ou mascarar conflitos de representação.
   - Nunca altere a semântica de um subsistema existente apenas para fazer um teste isolado passar.

4. **Preservação de Invariantes em Testes**:
   - Mudanças mecânicas devem preservar todas as invariantes de conservação e regras de domínio existentes.
   - Testes devem verificar invariantes e propriedades estruturais, não apenas outputs arbitrários ou pontuais.
