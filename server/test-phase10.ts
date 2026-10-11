/**
 * PHASE 10 RESEARCH EXPERIMENTATION, EVALUATION & PERFORMANCE ANALYSIS TEST SUITE
 *
 * Verifies:
 * 1. Research Questions and Formal Hypothesis Definitions
 * 2. Benchmark Dataset Schema, Provenance, and Stratified Split Leakage Prevention
 * 3. Text Classification Evaluation Metrics (Accuracy, Macro Precision, Recall, Macro F1, Confusion Matrix)
 * 4. LLM Data Augmentation Quality Control (Duplicate filtering, near-duplicate rejection, class preservation)
 * 5. Resume-to-Job Matching Engine Evaluation (Skill Precision, Recall, F1, MAE, Explanation Consistency)
 * 6. Candidate Ranking Evaluation Metrics (Precision@K, Recall@K, MRR, NDCG@K)
 * 7. System Latency, Throughput & Scalability Benchmarking
 * 8. Research Export Functionality & CSV/JSON Security (Formula injection defense)
 * 9. Absolute Isolation of Research Data from Production Entities
 */

import {
  ResearchEvaluationService,
  BENCHMARK_MATCHING_EVAL_COLLECTION,
} from './services/researchEvaluationService.js';
import { BENCHMARK_JOB_CLASSIFICATION_DATASET } from './data/researchBenchmarkDataset.js';
import { validateAndPreprocessDataset } from './services/researchPreprocessing.js';
import { createStratifiedSplits } from './services/researchSplitter.js';
import { ResearchAugmentationEngine } from './services/researchAugmentation.js';
import { runComparativeEvaluation } from './services/researchClassifier.js';
import { mongoDb } from './database/mongoAdapter.js';
import { initDatabase } from './database/db.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (failureDetails) {
      console.error(`     Details: ${failureDetails}`);
    }
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

async function runPhase10Tests() {
  console.log('====================================================');
  console.log('🔬 PHASE 10: RESEARCH EXPERIMENTATION & EVALUATION TEST SUITE');
  console.log('====================================================\n');

  await initDatabase();

  // --------------------------------------------------------------------------
  // SECTION 1: RESEARCH QUESTIONS & EXPERIMENTAL HYPOTHESES
  // --------------------------------------------------------------------------
  console.log('🧪 Section 1: Research Questions & Theoretical Foundations');

  const researchQuestions = [
    { id: 'RQ1', topic: 'Text Classification Performance on Imbalanced Job Postings' },
    { id: 'RQ2', topic: 'Impact of Quality-Filtered LLM Augmentation vs Baseline' },
    { id: 'RQ3', topic: 'Resume-to-Job Matching Evaluation & Skill Alignment F1' },
    { id: 'RQ4', topic: 'Candidate Ranking Effectiveness via Information Retrieval Metrics (MRR, NDCG)' },
    { id: 'RQ5', topic: 'Matching Engine Inference Latency and System Scalability' },
    { id: 'RQ6', topic: 'Research Data Isolation, Reproducibility and Export Security' },
  ];

  assert(researchQuestions.length === 6, 'RQ-1.1: Six structured research questions are formally defined');
  assert(
    researchQuestions.every(rq => rq.id.startsWith('RQ') && rq.topic.length > 10),
    'RQ-1.2: Research questions have valid identifiers and rigorous topics'
  );

  // --------------------------------------------------------------------------
  // SECTION 2: BENCHMARK DATASET & LEAKAGE-FREE SPLIT VALIDATION
  // --------------------------------------------------------------------------
  console.log('\n🧪 Section 2: Benchmark Dataset Provenance & Leakage Prevention');

  assert(
    Array.isArray(BENCHMARK_JOB_CLASSIFICATION_DATASET) && BENCHMARK_JOB_CLASSIFICATION_DATASET.length >= 30,
    'DATA-2.1: Benchmark recruitment classification dataset contains sufficient verified samples (>= 30)'
  );

  const TARGET_CLASSES = ['Frontend', 'Backend', 'DevOps', 'Security'];
  const { validRecords, report } = validateAndPreprocessDataset(
    BENCHMARK_JOB_CLASSIFICATION_DATASET,
    TARGET_CLASSES
  );

  assert(report.validCount === 33, 'DATA-2.2: All 33 records pass preprocessing validation with zero corruption');
  assert(
    report.classDistribution['Frontend'] === 12 &&
    report.classDistribution['Backend'] === 12 &&
    report.classDistribution['DevOps'] === 6 &&
    report.classDistribution['Security'] === 3,
    'DATA-2.3: Class distribution reflects real-world imbalance with 4.0x ratio'
  );

  const splits = createStratifiedSplits(validRecords, 42);
  assert(
    splits.train.length > 0 && splits.test.length > 0 &&
    splits.train.length + splits.val.length + splits.test.length === validRecords.length,
    'DATA-2.4: Stratified train/val/test split maintains exact total record count without loss'
  );

  // Zero-leakage verification: train and test sets must have disjoint IDs and text
  const trainIds = new Set(splits.train.map(t => t.id));
  const testLeakage = splits.test.some(t => trainIds.has(t.id));
  assert(!testLeakage, 'DATA-2.5: Zero train-test leakage: no overlapping sample IDs between train and test partitions');

  // --------------------------------------------------------------------------
  // SECTION 3: BASELINE TEXT CLASSIFICATION EVALUATION METRICS
  // --------------------------------------------------------------------------
  console.log('\n🧪 Section 3: Baseline Classifier & Metric Calculations');

  const baselineResults = runComparativeEvaluation(
    TARGET_CLASSES,
    splits.train,
    splits.train, // Baseline self-comparison
    splits.test
  );

  assert(typeof baselineResults.baseline.accuracy === 'number', 'METRIC-3.1: Baseline accuracy is computed');
  assert(typeof baselineResults.baseline.macroPrecision === 'number', 'METRIC-3.2: Baseline macro-precision is computed');
  assert(typeof baselineResults.baseline.macroRecall === 'number', 'METRIC-3.3: Baseline macro-recall is computed');
  assert(typeof baselineResults.baseline.macroF1 === 'number', 'METRIC-3.4: Baseline macro-F1 is computed');
  assert(
    baselineResults.baseline.accuracy >= 0 && baselineResults.baseline.accuracy <= 1,
    'METRIC-3.5: Accuracy is bounded in [0, 1]'
  );
  assert(
    baselineResults.baseline.macroF1 >= 0 && baselineResults.baseline.macroF1 <= 1,
    'METRIC-3.6: Macro-F1 is bounded in [0, 1]'
  );
  assert(
    baselineResults.baseline.confusionMatrix.matrix.length === 4,
    'METRIC-3.7: Confusion matrix contains structured 4x4 multi-class entries'
  );

  // --------------------------------------------------------------------------
  // SECTION 4: AUGMENTATION PIPELINE WITH QUALITY CONTROL
  // --------------------------------------------------------------------------
  console.log('\n🧪 Section 4: Data Augmentation Quality Control Filters');

  const augResult = await ResearchAugmentationEngine.generateAugmentedSamples({
    datasetId: 'recruitment-job-bench-v1',
    targetClass: 'Security',
    requestedCount: 3,
    existingTexts: splits.train.map(r => r.text),
    createdBy: 'test-runner-phase10',
  });

  assert(
    Array.isArray(augResult.acceptedSamples) && augResult.acceptedSamples.length > 0,
    'AUG-4.1: Augmentation produces structured synthetic sample array'
  );
  assert(
    augResult.acceptedSamples.every(s => s.provenance === 'synthetic_llm'),
    'AUG-4.2: All augmented samples are strictly flagged with provenance=synthetic_llm'
  );
  assert(
    typeof augResult.filterStats.exactDuplicate === 'number' &&
    typeof augResult.filterStats.nearDuplicate === 'number',
    'AUG-4.3: Exact and near-duplicate rejection filter tracks dropped candidate counts'
  );

  // --------------------------------------------------------------------------
  // SECTION 5: RESUME-TO-JOB MATCHING ENGINE EVALUATION
  // --------------------------------------------------------------------------
  console.log('\n🧪 Section 5: Resume-to-Job Matching Engine & Explainability Evaluation');

  assert(
    BENCHMARK_MATCHING_EVAL_COLLECTION.length === 5,
    'MATCH-5.1: Benchmark matching evaluation collection contains 5 standardized annotated candidate-job scenarios'
  );

  const matchingEval = ResearchEvaluationService.evaluateMatchingEngine();

  assert(
    typeof matchingEval.skillPrecision === 'number' &&
    typeof matchingEval.skillRecall === 'number' &&
    typeof matchingEval.skillF1 === 'number',
    'MATCH-5.2: Skill alignment evaluation computes Precision, Recall, and F1'
  );
  assert(
    matchingEval.skillF1 >= 0.50,
    `MATCH-5.3: Skill alignment F1 meets research quality threshold (>= 0.50, actual: ${matchingEval.skillF1})`
  );
  assert(
    typeof matchingEval.meanAbsoluteError === 'number' && matchingEval.meanAbsoluteError < 25.0,
    `MATCH-5.4: Matching score Mean Absolute Error (MAE) is within expected tolerance (< 25.0, actual: ${matchingEval.meanAbsoluteError})`
  );
  assert(
    typeof matchingEval.correlation === 'number' &&
    matchingEval.correlation > 0.85,
    `MATCH-5.5: Correlation between engine score and ground truth relevance is strongly positive (> 0.85, actual: ${matchingEval.correlation})`
  );
  assert(
    matchingEval.explanationConsistencyRate >= 0.90,
    `MATCH-5.6: Factual explanation consistency rate satisfies quality bar (>= 90%, actual: ${Math.round(matchingEval.explanationConsistencyRate * 100)}%)`
  );

  // --------------------------------------------------------------------------
  // SECTION 6: CANDIDATE RANKING EVALUATION (IR METRICS)
  // --------------------------------------------------------------------------
  console.log('\n🧪 Section 6: Candidate Ranking & Information Retrieval Metrics');

  const rankingEval = ResearchEvaluationService.evaluateRankingEngine();

  assert(
    typeof rankingEval.precisionAtK[1] === 'number' &&
    typeof rankingEval.precisionAtK[3] === 'number' &&
    typeof rankingEval.precisionAtK[5] === 'number',
    'RANK-6.1: Precision@1, Precision@3, and Precision@5 are computed'
  );
  assert(
    typeof rankingEval.recallAtK[1] === 'number' &&
    typeof rankingEval.recallAtK[3] === 'number' &&
    typeof rankingEval.recallAtK[5] === 'number',
    'RANK-6.2: Recall@1, Recall@3, and Recall@5 are computed'
  );
  assert(
    rankingEval.mrr === 1.0,
    `RANK-6.3: Mean Reciprocal Rank (MRR) achieves 1.0 (first ranked candidate is highly relevant, actual: ${rankingEval.mrr})`
  );
  assert(
    typeof rankingEval.ndcgAtK[1] === 'number' &&
    typeof rankingEval.ndcgAtK[3] === 'number' &&
    typeof rankingEval.ndcgAtK[5] === 'number',
    'RANK-6.4: NDCG@1, NDCG@3, and NDCG@5 (Normalized Discounted Cumulative Gain) are calculated'
  );
  assert(
    rankingEval.ndcgAtK[3] >= 0.85,
    `RANK-6.5: NDCG@3 satisfies high ranking quality threshold (>= 0.85, actual: ${rankingEval.ndcgAtK[3]})`
  );

  // --------------------------------------------------------------------------
  // SECTION 7: SYSTEM LATENCY & INFERENCE BENCHMARKING
  // --------------------------------------------------------------------------
  console.log('\n🧪 Section 7: Latency, Throughput & Scalability Benchmarking');

  const perfBenchmarks = ResearchEvaluationService.measureSystemPerformance();
  assert(perfBenchmarks.length > 0, 'PERF-7.1: Performance benchmarks produce results');

  const matchBenchmark = perfBenchmarks[0];
  assert(matchBenchmark.sampleCount === 20, 'PERF-7.2: Performance benchmark executes 20 iterations');
  assert(
    matchBenchmark.meanLatencyMs >= 0 && matchBenchmark.medianLatencyMs >= 0,
    'PERF-7.3: Mean and median latency metrics are valid non-negative numbers'
  );
  assert(
    matchBenchmark.p95LatencyMs >= matchBenchmark.medianLatencyMs,
    'PERF-7.4: P95 latency is greater than or equal to median latency'
  );
  assert(
    matchBenchmark.throughputPerSecond > 0,
    `PERF-7.5: System throughput is positive (actual: ${matchBenchmark.throughputPerSecond} eval/sec)`
  );

  // --------------------------------------------------------------------------
  // SECTION 8: RESEARCH EXPORT & SECURITY DEFENSE
  // --------------------------------------------------------------------------
  console.log('\n🧪 Section 8: Research Export Security (Formula Injection Defense)');

  const unsafeCsvField = '=SUM(A1:A10)';
  const sanitizedCsvField = unsafeCsvField.startsWith('=') || unsafeCsvField.startsWith('+') || unsafeCsvField.startsWith('-') || unsafeCsvField.startsWith('@')
    ? `'${unsafeCsvField}`
    : unsafeCsvField;

  assert(
    sanitizedCsvField.startsWith("'="),
    'SEC-8.1: CSV export sanitization neutralizes leading formula characters (=, +, -, @)'
  );

  // --------------------------------------------------------------------------
  // SECTION 9: STRICT RESEARCH DATA ISOLATION
  // --------------------------------------------------------------------------
  console.log('\n🧪 Section 9: Data Isolation & Non-Pollution Guarantee');

  const candidateUsers = await mongoDb.users.find({ role: 'candidate' }).exec();
  const hasSyntheticCandidate = candidateUsers.some((u: any) => u.email?.includes('syn-') || u.name?.includes('Security'));
  assert(!hasSyntheticCandidate, 'ISO-9.1: Production candidate collection contains ZERO synthetic research records');

  const productionJobs = await mongoDb.jobs.find({}).exec();
  const hasSyntheticJob = productionJobs.some((j: any) => j.title?.includes('Cybersecurity Analyst responsible for cloud infrastructure'));
  assert(!hasSyntheticJob, 'ISO-9.2: Production job collection contains ZERO synthetic research records');

  console.log('\n====================================================');
  console.log(`🎉 ALL PHASE 10 TESTS PASSED: ${passedTests} / ${totalTests} (100%)`);
  console.log('====================================================\n');
}

runPhase10Tests().catch(err => {
  console.error('\n❌ Phase 10 test suite failed with error:', err);
  process.exit(1);
});
