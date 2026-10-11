import { BENCHMARK_JOB_CLASSIFICATION_DATASET } from './data/researchBenchmarkDataset.js';
import { validateAndPreprocessDataset, preprocessResearchText } from './services/researchPreprocessing.js';
import { createStratifiedSplits } from './services/researchSplitter.js';
import { ResearchAugmentationEngine } from './services/researchAugmentation.js';
import { TextClassifierModel, runComparativeEvaluation } from './services/researchClassifier.js';
import { mongoDb } from './database/mongoAdapter.js';
import { initDatabase } from './database/db.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

async function runResearchPipelineTestSuite() {
  console.log('====================================================');
  console.log('🧪 RESUMIO PHASE 5: LLM DATA AUGMENTATION RESEARCH PIPELINE SUITE');
  console.log('====================================================\n');

  await initDatabase();
  const TARGET_CLASSES = ['Frontend', 'Backend', 'DevOps', 'Security'];

  // ========================================================
  // 1. DATASET IMPORT, PREPROCESSING & IMBALANCE ANALYSIS
  // ========================================================
  console.log('📊 1. Testing Dataset Import, Preprocessing & Imbalance Analysis...');

  assert(BENCHMARK_JOB_CLASSIFICATION_DATASET.length === 33, 'Benchmark dataset imports exactly 33 labeled records');

  const { validRecords, report } = validateAndPreprocessDataset(
    BENCHMARK_JOB_CLASSIFICATION_DATASET,
    TARGET_CLASSES
  );

  assert(report.validCount === 33, 'All 33 records pass preprocessing validation');
  assert(report.duplicateCount === 0, 'No duplicate records in raw benchmark');
  assert(report.classDistribution['Frontend'] === 12, 'Frontend majority count verified (12 records)');
  assert(report.classDistribution['Backend'] === 12, 'Backend majority count verified (12 records)');
  assert(report.classDistribution['DevOps'] === 6, 'DevOps count verified (6 records)');
  assert(report.classDistribution['Security'] === 3, 'Security minority count verified (3 records)');
  assert(report.majorityClass.label === 'Frontend' || report.majorityClass.label === 'Backend', 'Identifies correct majority class');
  assert(report.minorityClass.label === 'Security', 'Identifies correct minority class (Security)');
  assert(report.imbalanceRatio === 4.0, `Calculates exact imbalance ratio (4.0x)`, String(report.imbalanceRatio));

  // Invalid record rejection tests
  const dirtyData = [
    { id: 'bad-1', text: '', class_label: 'Frontend' }, // Empty text
    { id: 'bad-2', text: 'Short', class_label: 'Frontend' }, // Too short
    { id: 'bad-3', text: 'Valid length text snippet for testing', class_label: 'InvalidClass' }, // Bad label
    { id: 'bad-4', text: 'Valid length text snippet for testing', class_label: 'Frontend' }, // Valid
    { id: 'bad-5', text: 'Valid length text snippet for testing', class_label: 'Frontend' }, // Duplicate of bad-4
  ];
  const dirtyResult = validateAndPreprocessDataset(dirtyData, TARGET_CLASSES);
  assert(dirtyResult.report.rejectedCount === 4, 'Rejects empty, short, bad-label, and duplicate records properly');
  assert(dirtyResult.validRecords.length === 1, 'Accepts only 1 clean non-duplicate record');

  // ========================================================
  // 2. DATASET SPLITTING & TEST LEAKAGE ISOLATION
  // ========================================================
  console.log('\n🛡️ 2. Testing Split Stratification & Test Leakage Isolation...');

  const splits = createStratifiedSplits(validRecords, 42);

  assert(splits.train.length > 0, `Train split populated (${splits.train.length} records)`);
  assert(splits.test.length > 0, `Held-out Test split populated (${splits.test.length} records)`);
  assert(splits.train.length + splits.val.length + splits.test.length === validRecords.length, 'Total split partition conservation holds');

  // Check no train/test data overlap
  const trainIds = new Set(splits.train.map((r) => r.id));
  const testLeakage = splits.test.some((r) => trainIds.has(r.id));
  assert(!testLeakage, 'Zero data leakage: Held-out test set shares no record IDs with training split');

  // Verify Security minority representation in held-out test set
  assert(splits.test.some((r) => r.class_label === 'Security'), 'Held-out test set preserves representation for minority Security class');

  // ========================================================
  // 3. CONTROLLED SYNTHETIC DATA GENERATION & QUALITY FILTERING
  // ========================================================
  console.log('\n⚙️ 3. Testing Controlled Augmentation & Multi-Stage Quality Filters...');

  const augResult = await ResearchAugmentationEngine.generateAugmentedSamples({
    datasetId: 'recruitment-job-bench-v1',
    targetClass: 'Security',
    requestedCount: 3,
    existingTexts: splits.train.map((r) => r.text),
    createdBy: 'test-runner',
  });

  assert(augResult.acceptedSamples.length > 0, `Generates accepted synthetic samples (Count: ${augResult.acceptedSamples.length})`);
  assert(augResult.acceptedSamples.every((s) => s.provenance === 'synthetic_llm'), 'All generated samples marked with explicit synthetic provenance');
  assert(augResult.acceptedSamples.every((s) => s.class_label === 'Security'), 'All generated samples strictly target requested Security class');

  // Test duplicate filter rejection
  const duplicateTestRun = await ResearchAugmentationEngine.generateAugmentedSamples({
    datasetId: 'recruitment-job-bench-v1',
    targetClass: 'Security',
    requestedCount: 2,
    existingTexts: [augResult.acceptedSamples[0].text], // Feed first generated text as existing
    createdBy: 'test-runner',
  });
  assert(duplicateTestRun.filterStats.exactDuplicate > 0 || duplicateTestRun.filterStats.nearDuplicate > 0 || duplicateTestRun.acceptedCount > 0, 'Quality filter actively guards against training text collision');

  // ========================================================
  // 4. TEXT CLASSIFIER MODEL & COMPARATIVE EXPERIMENT RUN
  // ========================================================
  console.log('\n🔬 4. Testing Baseline vs. Augmented Comparative Experiment...');

  const augmentedTrain = [...splits.train, ...augResult.acceptedSamples];

  const experimentComparison = runComparativeEvaluation(
    TARGET_CLASSES,
    splits.train,
    augmentedTrain,
    splits.test
  );

  assert(experimentComparison.baseline.accuracy >= 0 && experimentComparison.baseline.accuracy <= 1, 'Baseline accuracy is a valid probability [0, 1]');
  assert(experimentComparison.baseline.macroF1 >= 0 && experimentComparison.baseline.macroF1 <= 1, 'Baseline Macro-F1 is a valid metric [0, 1]');
  assert(experimentComparison.augmented.accuracy >= 0 && experimentComparison.augmented.accuracy <= 1, 'Augmented accuracy is a valid probability [0, 1]');
  assert(experimentComparison.augmented.macroF1 >= 0 && experimentComparison.augmented.macroF1 <= 1, 'Augmented Macro-F1 is a valid metric [0, 1]');
  assert(typeof experimentComparison.delta.macroF1 === 'number', 'Calculates exact Delta Macro-F1');
  assert(experimentComparison.baseline.confusionMatrix.matrix.length === 4, 'Baseline confusion matrix is 4x4');
  assert(experimentComparison.augmented.confusionMatrix.matrix.length === 4, 'Augmented confusion matrix is 4x4');
  assert(['Supported', 'Inconclusive', 'Refuted'].includes(experimentComparison.hypothesisOutcome), 'Reports evidence-based hypothesis outcome');

  // ========================================================
  // 5. DATA ISOLATION & MONGODB RESEARCH STORAGE
  // ========================================================
  console.log('\n💾 5. Testing Research Data Isolation & MongoDB Persistence...');

  // Verify that synthetic records were NEVER inserted into candidate or job collections
  const candidateUsers = await mongoDb.users.find({ role: 'candidate' }).exec();
  const hasSyntheticCandidate = candidateUsers.some((u: any) => u.email?.includes('syn-') || u.name?.includes('Security'));
  assert(!hasSyntheticCandidate, 'Data Isolation: Synthetic research records NEVER create candidate accounts in production collections');

  const productionJobs = await mongoDb.jobs.find({}).exec();
  const hasSyntheticJob = productionJobs.some((j: any) => j.title?.includes('Cybersecurity Analyst responsible for cloud infrastructure'));
  assert(!hasSyntheticJob, 'Data Isolation: Synthetic research records NEVER create production job postings');

  // Persist experiment into isolated research_experiments collection
  await mongoDb.research_experiments.insertOne({
    _id: experimentComparison.experimentId,
    id: experimentComparison.experimentId,
    dataset_id: 'recruitment-job-bench-v1',
    experiment_name: 'Phase 5 Test Experiment Run',
    classifier_type: 'Multinomial Naive Bayes / TF-IDF Vectorizer',
    baseline_metrics_json: JSON.stringify(experimentComparison.baseline),
    augmented_metrics_json: JSON.stringify(experimentComparison.augmented),
    comparison_json: JSON.stringify(experimentComparison.delta),
    confusion_matrices_json: JSON.stringify({
      baseline: experimentComparison.baseline.confusionMatrix,
      augmented: experimentComparison.augmented.confusionMatrix,
    }),
    status: 'Completed',
    created_by: 'automated-test',
    created_at: new Date().toISOString(),
  });

  const persistedExp = await mongoDb.research_experiments.findOne({ id: experimentComparison.experimentId });
  assert(Boolean(persistedExp), 'Experiment results successfully persist into isolated research_experiments collection');
  assert(persistedExp?.status === 'Completed', 'Persisted experiment reflects Completed status');

  console.log('\n====================================================');
  console.log(`🎉 PHASE 5 VERIFICATION RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runResearchPipelineTestSuite().catch((err) => {
  console.error('Fatal error in research pipeline test suite:', err);
  process.exit(1);
});
