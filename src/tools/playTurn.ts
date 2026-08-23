import { executePlaytestTurnPristine } from './PlaytestSessionRunner';

const playerInput = process.argv.slice(2).join(' ');

if (!playerInput) {
  console.error('Uso: npx tsx src/tools/playTurn.ts "<ordem do jogador>"');
  process.exit(1);
}

(async () => {
  try {
    const res = await executePlaytestTurnPristine(playerInput);
    console.log(JSON.stringify(res.traceEntry, null, 2));
  } catch (err) {
    console.error('Erro ao executar o turno:', err);
    process.exit(1);
  }
})();
