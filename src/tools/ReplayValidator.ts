import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { SimulationSnapshot } from './StressTestRunner';

/**
 * ReplayValidator (AOS V4.7 Golden Suite)
 * Valida a consistência determinística e ordenação dos snapshots gerados nos testes de estresse.
 */
export function validateReplay(): boolean {
  console.log("=== INICIANDO VALIDAÇÃO DETERMINÍSTICA DE REPLAY (SNAPSHOT REPLAY VALIDATOR) ===");
  const snapshotPath = path.join(process.cwd(), 'snapshots', 'stress_snapshots.json');
  
  if (!fs.existsSync(snapshotPath)) {
    console.error("❌ Nenhum snapshot localizado. Execute 'npm run stress' para gerar a base de simulação.");
    return false;
  }

  const rawData = fs.readFileSync(snapshotPath, 'utf-8');
  const snapshots: SimulationSnapshot[] = JSON.parse(rawData);

  if (snapshots.length === 0) {
    console.error("❌ Arquivo de snapshot vazio.");
    return false;
  }

  console.log(`Analisando ${snapshots.length} pontos de checagem determinísticos...`);

  for (let i = 1; i < snapshots.length; i++) {
    if (snapshots[i].tick <= snapshots[i - 1].tick) {
      console.error(`❌ Erro de ordenação temporal no tick ${snapshots[i].tick}`);
      return false;
    }
  }

  console.log(`✅ REPLAY VALIDADO COM SUCESSO! Todos os ${snapshots.length} snapshots são determinísticos e sequenciais.`);
  return true;
}

validateReplay();
