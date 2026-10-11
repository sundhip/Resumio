import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { BENCHMARK_JOB_CLASSIFICATION_DATASET } from '../data/researchBenchmarkDataset.js';
import { validateAndPreprocessDataset } from '../services/researchPreprocessing.js';
import { createStratifiedSplits, DatasetSplits } from '../services/researchSplitter.js';
import { ResearchAugmentationEngine } from '../services/researchAugmentation.js';
import { runComparativeEvaluation } from '../services/researchClassifier.js';
import { mongoDb } from '../database/mongoAdapter.js';

const router = Router();
const TARGET_CLASSES = ['Frontend', 'Backend', 'DevOps', 'Security'];

// In-memory / Mongo synced state for active pipeline session
let activeSplits: DatasetSplits | null = null;
let activeAugmentedTrain: any[] = [];
let latestExperimentResult: any = null;

/**
 * 1. GET /api/research/dataset/summary
 * Retrieves benchmark dataset distribution and imbalance analysis
 */
router.get(
  '/research/dataset/summary',
  requireAuth,
  requireRole(['admin']),
  async (_req: Request, res: Response) => {
    try {
      const { validRecords, report } = validateAndPreprocessDataset(
        BENCHMARK_JOB_CLASSIFICATION_DATASET,
        TARGET_CLASSES
      );

      // Persist metadata to MongoDB research_datasets if not exists
      const existing = await mongoDb.research_datasets.findOne({ id: 'recruitment-job-bench-v1' });
      if (!existing) {
        await mongoDb.research_datasets.insertOne({
          _id: 'recruitment-job-bench-v1',
          id: 'recruitment-job-bench-v1',
          name: 'Recruitment Job Category Classification Benchmark',
          description: 'Imbalanced academic benchmark classifying technical job snippets into Frontend, Backend, DevOps, Security',
          task_type: 'job_category_classification',
          target_classes_json: JSON.stringify(TARGET_CLASSES),
          version: 'v1.0.0',
          status: 'Active',
          original_record_count: report.finalCount,
          class_distribution_json: JSON.stringify(report.classDistribution),
          source: 'Academic Benchmark Archive v1',
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      res.json({
        datasetId: 'recruitment-job-bench-v1',
        taskType: 'job_category_classification',
        targetClasses: TARGET_CLASSES,
        report,
        previewRecords: validRecords.slice(0, 5),
      });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to load research dataset: ${err.message}` });
    }
  }
);

/**
 * 2. POST /api/research/splits
 * Creates or resets stratified train/val/test splits with test set preservation
 */
router.post(
  '/research/splits',
  requireAuth,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const seed = req.body.seed ? parseInt(req.body.seed, 10) : 42;
      const { validRecords } = validateAndPreprocessDataset(
        BENCHMARK_JOB_CLASSIFICATION_DATASET,
        TARGET_CLASSES
      );

      activeSplits = createStratifiedSplits(validRecords, seed);
      activeAugmentedTrain = [...activeSplits.train];

      res.json({
        message: 'Stratified splits successfully created with held-out test isolation.',
        seed,
        splitStatistics: activeSplits.splitStatistics,
      });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to create splits: ${err.message}` });
    }
  }
);

/**
 * 3. POST /api/research/augment
 * Generates synthetic samples for a target class using the AI Provider and filters them
 */
router.post(
  '/research/augment',
  requireAuth,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const targetClass = req.body.targetClass || 'Security';
      const requestedCount = req.body.requestedCount ? parseInt(req.body.requestedCount, 10) : 3;

      if (!TARGET_CLASSES.includes(targetClass)) {
        return res.status(400).json({ error: `Invalid target class. Must be one of: ${TARGET_CLASSES.join(', ')}` });
      }

      if (!activeSplits) {
        const { validRecords } = validateAndPreprocessDataset(
          BENCHMARK_JOB_CLASSIFICATION_DATASET,
          TARGET_CLASSES
        );
        activeSplits = createStratifiedSplits(validRecords, 42);
        activeAugmentedTrain = [...activeSplits.train];
      }

      const existingTexts = activeAugmentedTrain.map((r) => r.text);

      const runSummary = await ResearchAugmentationEngine.generateAugmentedSamples({
        datasetId: 'recruitment-job-bench-v1',
        targetClass,
        requestedCount,
        existingTexts,
        createdBy: req.user?.id || 'admin',
      });

      // Append accepted synthetic records ONLY to the training split
      activeAugmentedTrain.push(...runSummary.acceptedSamples);

      // Persist run to MongoDB research_augmentation_runs
      await mongoDb.research_augmentation_runs.insertOne({
        _id: runSummary.runId,
        id: runSummary.runId,
        dataset_id: 'recruitment-job-bench-v1',
        target_class: targetClass,
        requested_count: requestedCount,
        generated_count: runSummary.generatedCount,
        accepted_count: runSummary.acceptedCount,
        rejected_count: runSummary.rejectedCount,
        model_provider: 'gemini',
        model_name: 'gemini-1.5-flash',
        prompt_version: ResearchAugmentationEngine.PROMPT_VERSION,
        filter_stats_json: JSON.stringify(runSummary.filterStats),
        status: 'Completed',
        created_by: req.user?.id || 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      res.json({
        runSummary,
        updatedTrainingCount: activeAugmentedTrain.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: `Augmentation run failed: ${err.message}` });
    }
  }
);

/**
 * 4. POST /api/research/evaluate
 * Runs comparative evaluation: Baseline vs Augmented on held-out test split
 */
router.post(
  '/research/evaluate',
  requireAuth,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      if (!activeSplits) {
        const { validRecords } = validateAndPreprocessDataset(
          BENCHMARK_JOB_CLASSIFICATION_DATASET,
          TARGET_CLASSES
        );
        activeSplits = createStratifiedSplits(validRecords, 42);
        activeAugmentedTrain = [...activeSplits.train];
      }

      // If no augmentation run was executed prior, perform a baseline minority boost for Security
      if (activeAugmentedTrain.length === activeSplits.train.length) {
        const quickRun = await ResearchAugmentationEngine.generateAugmentedSamples({
          datasetId: 'recruitment-job-bench-v1',
          targetClass: 'Security',
          requestedCount: 3,
          existingTexts: activeSplits.train.map((r) => r.text),
          createdBy: req.user?.id || 'admin',
        });
        activeAugmentedTrain.push(...quickRun.acceptedSamples);
      }

      const comparison = runComparativeEvaluation(
        TARGET_CLASSES,
        activeSplits.train,
        activeAugmentedTrain,
        activeSplits.test
      );

      latestExperimentResult = comparison;

      // Persist experiment in MongoDB research_experiments
      await mongoDb.research_experiments.insertOne({
        _id: comparison.experimentId,
        id: comparison.experimentId,
        dataset_id: 'recruitment-job-bench-v1',
        experiment_name: req.body.experimentName || 'Baseline vs Synthetic Augmented Job Classification',
        classifier_type: 'Multinomial Naive Bayes / TF-IDF Vectorizer',
        baseline_metrics_json: JSON.stringify(comparison.baseline),
        augmented_metrics_json: JSON.stringify(comparison.augmented),
        comparison_json: JSON.stringify(comparison.delta),
        confusion_matrices_json: JSON.stringify({
          baseline: comparison.baseline.confusionMatrix,
          augmented: comparison.augmented.confusionMatrix,
        }),
        status: 'Completed',
        created_by: req.user?.id || 'admin',
        created_at: new Date().toISOString(),
      });

      res.json(comparison);
    } catch (err: any) {
      res.status(500).json({ error: `Evaluation failed: ${err.message}` });
    }
  }
);

/**
 * 5. GET /api/research/results
 * Fetches latest experiment result and historical experiment runs
 */
router.get(
  '/research/results',
  requireAuth,
  requireRole(['admin']),
  async (_req: Request, res: Response) => {
    try {
      const history = await mongoDb.research_experiments.find({}).sort({ created_at: -1 }).limit(10).exec();
      res.json({
        latestResult: latestExperimentResult,
        history,
      });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to load experiment history: ${err.message}` });
    }
  }
);

/**
 * 6. GET /api/research/export
 * Exports evaluation metrics and comparison summary as JSON/CSV
 */
router.get(
  '/research/export',
  requireAuth,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const format = req.query.format === 'csv' ? 'csv' : 'json';

      if (!latestExperimentResult) {
        return res.status(404).json({ error: 'No experiment has been run yet to export.' });
      }

      if (format === 'csv') {
        const rows = [
          ['Metric', 'Baseline', 'Augmented', 'Delta'],
          ['Accuracy', latestExperimentResult.baseline.accuracy, latestExperimentResult.augmented.accuracy, latestExperimentResult.delta.accuracy],
          ['Macro Precision', latestExperimentResult.baseline.macroPrecision, latestExperimentResult.augmented.macroPrecision, ''],
          ['Macro Recall', latestExperimentResult.baseline.macroRecall, latestExperimentResult.augmented.macroRecall, ''],
          ['Macro F1-Score', latestExperimentResult.baseline.macroF1, latestExperimentResult.augmented.macroF1, latestExperimentResult.delta.macroF1],
        ];

        for (const [cls, del] of Object.entries(latestExperimentResult.delta.perClassF1)) {
          const bF1 = latestExperimentResult.baseline.perClass[cls]?.f1Score || 0;
          const aF1 = latestExperimentResult.augmented.perClass[cls]?.f1Score || 0;
          rows.push([`${cls} F1-Score`, bF1, aF1, del as any]);
        }

        const csvContent = rows.map((r) => r.join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="resumio-research-metrics.csv"');
        return res.send(csvContent);
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="resumio-research-metrics.json"');
      res.json(latestExperimentResult);
    } catch (err: any) {
      res.status(500).json({ error: `Export failed: ${err.message}` });
    }
  }
);

export const researchRouter = router;
