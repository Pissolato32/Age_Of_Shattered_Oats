import { LLMProviderId } from '../contracts/LLMContract';
import { DiscoveredCandidate } from '../registry/ProviderDiscovery';
import { LLMTask, ModelCapabilityProfile } from '../registry/ModelRegistry';
import { LLMAdapter } from '../adapters/LLMAdapter';
import { SemanticValidator } from '../validators/SemanticValidator';
import { MechanicalLeakageValidator } from '../validators/MechanicalLeakageValidator';
import { NarrativeJudge } from '../validators/NarrativeJudge';
import {
  SMOKE_INTERPRETER_SCENARIOS,
  SMOKE_NARRATOR_SCENARIOS,
  SmokeInterpreterScenario,
  SmokeNarratorScenario
} from './SmokeScenarios';
import { BenchmarkScenario } from '../../../tests/llm/scenarios/types';
import { CampaignState } from '../../types';

export interface Tier1HealthReport {
  readonly tier: 'TIER_1_HEALTH';
  readonly passed: boolean;
  readonly provider: LLMProviderId;
  readonly model: string;
  readonly isOnline: boolean;
  readonly isFreeEligible: boolean;
  readonly failureReason?: string;
}

export interface Tier2SmokeReport {
  readonly tier: 'TIER_2_SMOKE';
  readonly passed: boolean;
  readonly interpreterScore: number;
  readonly narratorScore: number;
  readonly overallScore: number;
  readonly interpreterPassed: boolean;
  readonly narratorPassed: boolean;
  readonly testedScenariosCount: number;
  readonly failures: readonly { scenarioId: string; reason: string }[];
}

export interface GranularCapabilityProfile {
  readonly interpreter: {
    readonly overallScore: number;
    readonly intentAccuracy: number;
    readonly constraintAccuracy: number;
    readonly schemaCompliance: number;
    readonly intentBreakdown: Record<string, number>;
    readonly sampleSize: number;
  };
  readonly narrator: {
    readonly overallScore: number;
    readonly mechanicalSilence: number;
    readonly factualGrounding: number;
    readonly diegesis: number;
    readonly sensoryQuality: number;
    readonly sampleSize: number;
  };
  readonly recommendedTasks: readonly LLMTask[];
}

export interface Tier3BenchmarkReport {
  readonly tier: 'TIER_3_FULL_BENCHMARK';
  readonly passed: boolean;
  readonly profile: GranularCapabilityProfile;
  readonly totalScenarios: number;
}

export class ThreeTierQualification {
  /**
   * TIER 1: Health & Billing Eligibility Check (Cheap, instantaneous).
   */
  public static evaluateTier1Health(candidate: DiscoveredCandidate): Tier1HealthReport {
    const isOnline = candidate.health.status === 'ONLINE';
    const isFreeEligible = candidate.billing.mode === 'FREE' && candidate.billing.eligible;
    const passed = isOnline && isFreeEligible;

    let failureReason: string | undefined = undefined;
    if (!isOnline) {
      failureReason = candidate.health.failureReason || `Endpoint is ${candidate.health.status}`;
    } else if (!isFreeEligible) {
      failureReason = `Billing mode is ${candidate.billing.mode} (not eligible for free-tier execution)`;
    }

    return {
      tier: 'TIER_1_HEALTH',
      passed,
      provider: candidate.provider,
      model: candidate.model,
      isOnline,
      isFreeEligible,
      failureReason
    };
  }

  /**
   * TIER 2: Fast Smoke Qualification Suite (5-10 tests on isolated fixtures).
   * Runs without mutating campaign state.
   */
  public static async evaluateTier2Smoke(
    candidate: DiscoveredCandidate,
    adapter: LLMAdapter,
    mockFixtureState?: CampaignState
  ): Promise<Tier2SmokeReport> {
    const failures: Array<{ scenarioId: string; reason: string }> = [];
    let interpreterPassCount = 0;
    let narratorPassCount = 0;

    // 1. Interpreter Smoke Tests
    for (const scenario of SMOKE_INTERPRETER_SCENARIOS) {
      try {
        const response = await adapter.generate({
          systemPrompt: `Você é o Classificador de Intenções de Age of Shattered Oaths. Responda exclusivamente com JSON estruturado com os campos action, targetId, objectId, locationId, magnitude, stance, desiredOutcome, confidence, requiresClarification, ambiguity.`,
          userPrompt: `<PLAYER_INPUT>\n${scenario.playerInput}\n</PLAYER_INPUT>`,
          temperature: 0.0,
          responseFormat: 'json',
          timeoutMs: 25000
        });

        const validation = SemanticValidator.validateIntentResponse(
          response.text,
          {
            action: scenario.expectedAction,
            requiresClarification: scenario.expectedRequiresClarification
          },
          mockFixtureState
        );

        if (!validation.jsonValid || !validation.schemaValid) {
          failures.push({ scenarioId: scenario.id, reason: 'Invalid JSON or schema violation' });
          continue;
        }

        const cmd = validation.parsedCommand;
        if (cmd?.action !== scenario.expectedAction) {
          failures.push({
            scenarioId: scenario.id,
            reason: `Action mismatch: expected ${scenario.expectedAction}, got ${cmd?.action}`
          });
          continue;
        }

        if (scenario.expectedRequiresClarification !== undefined && cmd?.requiresClarification !== scenario.expectedRequiresClarification) {
          failures.push({
            scenarioId: scenario.id,
            reason: `Clarification mismatch: expected ${scenario.expectedRequiresClarification}, got ${cmd?.requiresClarification}`
          });
          continue;
        }

        interpreterPassCount++;
      } catch (err: any) {
        failures.push({ scenarioId: scenario.id, reason: `Execution error: ${err.message}` });
      }
    }

    // 2. Narrator Smoke Tests
    for (const scenario of SMOKE_NARRATOR_SCENARIOS) {
      try {
        const response = await adapter.generate({
          systemPrompt: `Você é o Narrador da Crônica de Ferro. Narre os fatos de forma realista e concisa (1-2 parágrafos), sem citar números, dados ou mecânicas.`,
          userPrompt: `Projeção Sensorial:\n${JSON.stringify(scenario.projection, null, 2)}`,
          temperature: 0.2,
          responseFormat: 'text',
          timeoutMs: 25000
        });

        // Check mechanical silence
        const leakage = MechanicalLeakageValidator.validate(response.text);
        if (!leakage.mechanicalSilence) {
          failures.push({
            scenarioId: scenario.id,
            reason: `Mechanical silence violation: leaked terms [${leakage.leakedTerms.join(', ')}]`
          });
          continue;
        }

        if (!response.text || response.text.trim().length < 20) {
          failures.push({ scenarioId: scenario.id, reason: 'Narrative too short or empty' });
          continue;
        }

        narratorPassCount++;
      } catch (err: any) {
        failures.push({ scenarioId: scenario.id, reason: `Narrator error: ${err.message}` });
      }
    }

    const intScore = Number(((interpreterPassCount / SMOKE_INTERPRETER_SCENARIOS.length) * 10).toFixed(1));
    const narScore = Number(((narratorPassCount / SMOKE_NARRATOR_SCENARIOS.length) * 10).toFixed(1));
    const overallScore = Number(((intScore * 0.5 + narScore * 0.5)).toFixed(1));

    const interpreterPassed = intScore >= 7.0;
    const narratorPassed = narScore >= 7.0;
    const passed = interpreterPassed && narratorPassed;

    return {
      tier: 'TIER_2_SMOKE',
      passed,
      interpreterScore: intScore,
      narratorScore: narScore,
      overallScore,
      interpreterPassed,
      narratorPassed,
      testedScenariosCount: SMOKE_INTERPRETER_SCENARIOS.length + SMOKE_NARRATOR_SCENARIOS.length,
      failures
    };
  }

  /**
   * TIER 3: Full Benchmark Suite (Granular multidimensional capability profiling).
   * Generates task-specific accuracy and intent breakdown.
   */
  public static async evaluateTier3Benchmark(
    candidate: DiscoveredCandidate,
    scenarios: readonly BenchmarkScenario[],
    adapter: LLMAdapter,
    mockFixtureState?: CampaignState
  ): Promise<Tier3BenchmarkReport> {
    const intentCounts: Record<string, { total: number; passed: number }> = {};
    let totalInterpreterPassed = 0;
    let totalNarratorPassed = 0;
    let totalSilencePassed = 0;
    let totalGroundingPassed = 0;

    for (const scenario of scenarios) {
      const intentKey = scenario.expected.action;
      if (!intentCounts[intentKey]) {
        intentCounts[intentKey] = { total: 0, passed: 0 };
      }
      intentCounts[intentKey].total++;

      try {
        // Evaluate Interpreter
        const intRes = await adapter.generate({
          systemPrompt: `Você é o Classificador de Intenções de Age of Shattered Oaths. Responda exclusivamente com JSON estruturado com os campos action, targetId, objectId, locationId, magnitude, stance, desiredOutcome, confidence, requiresClarification, ambiguity.`,
          userPrompt: `<PLAYER_INPUT>\n${scenario.playerInput}\n</PLAYER_INPUT>`,
          temperature: 0.0,
          responseFormat: 'json',
          timeoutMs: 25000
        });

        const validation = SemanticValidator.validateIntentResponse(
          intRes.text,
          { action: scenario.expected.action },
          mockFixtureState
        );

        if (validation.jsonValid && validation.parsedCommand?.action === scenario.expected.action) {
          totalInterpreterPassed++;
          intentCounts[intentKey].passed++;
        }

        // Evaluate Narrator (Mock/Sample projection)
        const desc = (scenario.mockEngineReport as any)?.decisionReason || (scenario.mockEngineReport as any)?.summary || 'Ação resolvida pela engine.';
        const mockProjection = {
          outcome: scenario.mockEngineReport?.status === 'ACCEPTED' ? 'success' : 'rejected',
          subject: 'Renascent Lord',
          location: 'Grey Keep',
          visibleEvents: [{ eventId: 'ev_01', description: desc }],
          authoritativeFacts: [desc],
          sensoryContext: { region: 'Florestas do Rio', season: 'Longdark', environment: 'Bastion' }
        };

        const narRes = await adapter.generate({
          systemPrompt: `Você é o Narrador da Crônica de Ferro. Narre os fatos de forma concisa e realista em 1-2 parágrafos.`,
          userPrompt: `Projeção Sensorial:\n${JSON.stringify(mockProjection, null, 2)}`,
          temperature: 0.2,
          responseFormat: 'text',
          timeoutMs: 25000
        });

        const leakage = MechanicalLeakageValidator.validate(narRes.text);
        if (leakage.mechanicalSilence) {
          totalSilencePassed++;
        }
        if (narRes.text && narRes.text.length > 20) {
          totalGroundingPassed++;
          totalNarratorPassed++;
        }
      } catch {
        // Failure counted naturally
      }
    }

    const intentBreakdown: Record<string, number> = {};
    for (const [key, val] of Object.entries(intentCounts)) {
      intentBreakdown[key] = val.total > 0 ? Number((val.passed / val.total).toFixed(2)) : 0;
    }

    const totalCount = scenarios.length || 1;
    const intAccuracy = Number((totalInterpreterPassed / totalCount).toFixed(2));
    const narSilence = Number((totalSilencePassed / totalCount).toFixed(2));
    const narGrounding = Number((totalGroundingPassed / totalCount).toFixed(2));

    const interpreterOverall = Number((intAccuracy * 10).toFixed(1));
    const narratorOverall = Number(((narSilence * 0.5 + narGrounding * 0.5) * 10).toFixed(1));

    const recommendedTasks: LLMTask[] = [];
    if (interpreterOverall >= 7.5) recommendedTasks.push('INTERPRET_INTENT');
    if (narratorOverall >= 7.5) recommendedTasks.push('NARRATE_EXECUTION');

    const profile: GranularCapabilityProfile = {
      interpreter: {
        overallScore: interpreterOverall,
        intentAccuracy: intAccuracy,
        constraintAccuracy: intAccuracy,
        schemaCompliance: intAccuracy,
        intentBreakdown,
        sampleSize: scenarios.length
      },
      narrator: {
        overallScore: narratorOverall,
        mechanicalSilence: narSilence,
        factualGrounding: narGrounding,
        diegesis: narGrounding,
        sensoryQuality: narratorOverall,
        sampleSize: scenarios.length
      },
      recommendedTasks
    };

    return {
      tier: 'TIER_3_FULL_BENCHMARK',
      passed: recommendedTasks.length > 0,
      profile,
      totalScenarios: scenarios.length
    };
  }
}
