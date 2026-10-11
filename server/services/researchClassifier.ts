import { ValidatedResearchRecord } from './researchPreprocessing.js';

export interface ClassificationMetrics {
  accuracy: number;
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  perClass: Record<
    string,
    {
      precision: number;
      recall: number;
      f1Score: number;
      support: number;
    }
  >;
  confusionMatrix: {
    classes: string[];
    matrix: number[][]; // rows: true, columns: pred
  };
}

export interface ExperimentComparisonResult {
  experimentId: string;
  datasetId: string;
  baseline: ClassificationMetrics;
  augmented: ClassificationMetrics;
  delta: {
    macroF1: number;
    accuracy: number;
    perClassF1: Record<string, number>;
  };
  hypothesisOutcome: 'Supported' | 'Inconclusive' | 'Refuted';
  summaryText: string;
}

/**
 * Multinomial Naive Bayes / TF-IDF Vector Space Classifier
 * Light-weight, zero external C++ dependencies, 100% deterministic and reproducible.
 */
export class TextClassifierModel {
  private vocabulary: Map<string, number> = new Map();
  private classPriors: Map<string, number> = new Map();
  private classWordLikelihoods: Map<string, Map<string, number>> = new Map();
  private classes: string[] = [];

  constructor(classes: string[]) {
    this.classes = [...classes];
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s+#]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
  }

  /**
   * Fits model on labeled training records using Multinomial model with Laplace smoothing.
   */
  public fit(trainingRecords: ValidatedResearchRecord[]): void {
    this.vocabulary.clear();
    this.classPriors.clear();
    this.classWordLikelihoods.clear();

    const totalDocs = trainingRecords.length;
    const docCountsPerClass: Map<string, number> = new Map();
    const wordCountsPerClass: Map<string, Map<string, number>> = new Map();
    const totalWordsPerClass: Map<string, number> = new Map();

    for (const c of this.classes) {
      docCountsPerClass.set(c, 0);
      wordCountsPerClass.set(c, new Map());
      totalWordsPerClass.set(c, 0);
    }

    // Accumulate word counts
    for (const record of trainingRecords) {
      const c = record.class_label;
      if (!this.classes.includes(c)) continue;

      docCountsPerClass.set(c, (docCountsPerClass.get(c) || 0) + 1);
      const tokens = this.tokenize(record.text);
      const classMap = wordCountsPerClass.get(c)!;

      for (const token of tokens) {
        this.vocabulary.set(token, (this.vocabulary.get(token) || 0) + 1);
        classMap.set(token, (classMap.get(token) || 0) + 1);
        totalWordsPerClass.set(c, (totalWordsPerClass.get(c) || 0) + 1);
      }
    }

    // Calculate Priors: log(P(c))
    for (const c of this.classes) {
      const count = docCountsPerClass.get(c) || 0;
      this.classPriors.set(c, Math.log((count + 1) / (totalDocs + this.classes.length)));
    }

    // Calculate Likelihoods with Laplace (+1) smoothing: log(P(w | c))
    const vocabSize = Math.max(this.vocabulary.size, 1);
    for (const c of this.classes) {
      const likelihoods = new Map<string, number>();
      const classWordMap = wordCountsPerClass.get(c)!;
      const totalWords = (totalWordsPerClass.get(c) || 0) + vocabSize;

      this.vocabulary.forEach((_, token) => {
        const count = classWordMap.get(token) || 0;
        likelihoods.set(token, Math.log((count + 1) / totalWords));
      });

      this.classWordLikelihoods.set(c, likelihoods);
    }
  }

  /**
   * Predicts class for a given text snippet.
   */
  public predict(text: string): string {
    const tokens = this.tokenize(text);
    let bestClass = this.classes[0];
    let maxScore = -Infinity;

    for (const c of this.classes) {
      let score = this.classPriors.get(c) || 0;
      const likelihoods = this.classWordLikelihoods.get(c)!;

      for (const token of tokens) {
        if (likelihoods.has(token)) {
          score += likelihoods.get(token)!;
        } else {
          // Unseen word default log probability
          score += Math.log(1 / (this.vocabulary.size + 100));
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestClass = c;
      }
    }

    return bestClass;
  }

  /**
   * Evaluates predictions against a test split and computes exact multi-class metrics & confusion matrix.
   */
  public evaluate(testRecords: ValidatedResearchRecord[]): ClassificationMetrics {
    const matrix: number[][] = Array.from({ length: this.classes.length }, () =>
      Array(this.classes.length).fill(0)
    );

    let correctTotal = 0;

    for (const item of testRecords) {
      const pred = this.predict(item.text);
      const trueIdx = this.classes.indexOf(item.class_label);
      const predIdx = this.classes.indexOf(pred);

      if (trueIdx !== -1 && predIdx !== -1) {
        matrix[trueIdx][predIdx]++;
        if (trueIdx === predIdx) correctTotal++;
      }
    }

    const perClass: ClassificationMetrics['perClass'] = {};
    let sumPrecision = 0;
    let sumRecall = 0;
    let sumF1 = 0;

    for (let i = 0; i < this.classes.length; i++) {
      const className = this.classes[i];
      const tp = matrix[i][i];
      let rowSum = 0; // True support
      let colSum = 0; // Pred count

      for (let j = 0; j < this.classes.length; j++) {
        rowSum += matrix[i][j];
        colSum += matrix[j][i];
      }

      const precision = colSum > 0 ? tp / colSum : 0;
      const recall = rowSum > 0 ? tp / rowSum : 0;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      perClass[className] = {
        precision: Number(precision.toFixed(3)),
        recall: Number(recall.toFixed(3)),
        f1Score: Number(f1.toFixed(3)),
        support: rowSum,
      };

      sumPrecision += precision;
      sumRecall += recall;
      sumF1 += f1;
    }

    const k = this.classes.length;
    return {
      accuracy: testRecords.length > 0 ? Number((correctTotal / testRecords.length).toFixed(3)) : 0,
      macroPrecision: Number((sumPrecision / k).toFixed(3)),
      macroRecall: Number((sumRecall / k).toFixed(3)),
      macroF1: Number((sumF1 / k).toFixed(3)),
      perClass,
      confusionMatrix: {
        classes: this.classes,
        matrix,
      },
    };
  }
}

/**
 * Runs controlled comparative evaluation between Baseline (original train) and Augmented (train + synthetic).
 * Both evaluated on the IDENTICAL held-out test split.
 */
export function runComparativeEvaluation(
  classes: string[],
  baselineTrain: ValidatedResearchRecord[],
  augmentedTrain: ValidatedResearchRecord[],
  heldOutTest: ValidatedResearchRecord[]
): ExperimentComparisonResult {
  const experimentId = `exp-${Date.now()}`;

  // 1. Train and evaluate Baseline
  const baselineModel = new TextClassifierModel(classes);
  baselineModel.fit(baselineTrain);
  const baselineMetrics = baselineModel.evaluate(heldOutTest);

  // 2. Train and evaluate Augmented
  const augmentedModel = new TextClassifierModel(classes);
  augmentedModel.fit(augmentedTrain);
  const augmentedMetrics = augmentedModel.evaluate(heldOutTest);

  // 3. Compute metric differences
  const deltaMacroF1 = Number((augmentedMetrics.macroF1 - baselineMetrics.macroF1).toFixed(3));
  const deltaAccuracy = Number((augmentedMetrics.accuracy - baselineMetrics.accuracy).toFixed(3));
  const perClassF1: Record<string, number> = {};

  for (const c of classes) {
    const baseF1 = baselineMetrics.perClass[c]?.f1Score || 0;
    const augF1 = augmentedMetrics.perClass[c]?.f1Score || 0;
    perClassF1[c] = Number((augF1 - baseF1).toFixed(3));
  }

  let hypothesisOutcome: 'Supported' | 'Inconclusive' | 'Refuted' = 'Inconclusive';
  if (deltaMacroF1 > 0.02) {
    hypothesisOutcome = 'Supported';
  } else if (deltaMacroF1 < -0.02) {
    hypothesisOutcome = 'Refuted';
  }

  const summaryText = `Evaluation on held-out test set (N=${heldOutTest.length}) completed. Baseline Macro-F1: ${baselineMetrics.macroF1}, Augmented Macro-F1: ${augmentedMetrics.macroF1} (Delta: ${deltaMacroF1 > 0 ? '+' : ''}${deltaMacroF1}). Minority class improvements: ${JSON.stringify(perClassF1)}.`;

  return {
    experimentId,
    datasetId: 'recruitment-job-bench-v1',
    baseline: baselineMetrics,
    augmented: augmentedMetrics,
    delta: {
      macroF1: deltaMacroF1,
      accuracy: deltaAccuracy,
      perClassF1,
    },
    hypothesisOutcome,
    summaryText,
  };
}
