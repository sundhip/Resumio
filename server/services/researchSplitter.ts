import { ValidatedResearchRecord } from './researchPreprocessing.js';

export interface DatasetSplits {
  train: ValidatedResearchRecord[];
  val: ValidatedResearchRecord[];
  test: ValidatedResearchRecord[];
  splitStatistics: {
    trainCount: number;
    valCount: number;
    testCount: number;
    trainDistribution: Record<string, number>;
    testDistribution: Record<string, number>;
  };
}

/**
 * Deterministic pseudo-random number generator for reproducible experiment splits (seedable PRNG).
 */
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Partitions original dataset into stratified Train (70%), Validation (10%), and Test (20%) splits.
 * GUARANTEE: Test set is held out permanently from the original real distribution before any synthetic augmentation.
 */
export function createStratifiedSplits(
  records: ValidatedResearchRecord[],
  seed: number = 42
): DatasetSplits {
  const prng = seededRandom(seed);

  // Group records by class
  const classGroups: Record<string, ValidatedResearchRecord[]> = {};
  for (const r of records) {
    if (!classGroups[r.class_label]) classGroups[r.class_label] = [];
    classGroups[r.class_label].push(r);
  }

  const train: ValidatedResearchRecord[] = [];
  const val: ValidatedResearchRecord[] = [];
  const test: ValidatedResearchRecord[] = [];

  // Stratify per class
  for (const [_, items] of Object.entries(classGroups)) {
    // Deterministic shuffle with PRNG
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const n = shuffled.length;
    // For small classes, ensure at least 1 in train and 1 in test if n >= 2
    if (n === 1) {
      train.push(shuffled[0]);
    } else if (n === 2) {
      train.push(shuffled[0]);
      test.push(shuffled[1]);
    } else if (n === 3) {
      train.push(shuffled[0], shuffled[1]);
      test.push(shuffled[2]);
    } else {
      const testCount = Math.max(1, Math.round(n * 0.2));
      const valCount = Math.max(0, Math.round(n * 0.1));
      const trainCount = n - testCount - valCount;

      train.push(...shuffled.slice(0, trainCount));
      val.push(...shuffled.slice(trainCount, trainCount + valCount));
      test.push(...shuffled.slice(trainCount + valCount));
    }
  }

  const trainDistribution: Record<string, number> = {};
  const testDistribution: Record<string, number> = {};

  for (const r of train) {
    trainDistribution[r.class_label] = (trainDistribution[r.class_label] || 0) + 1;
  }
  for (const r of test) {
    testDistribution[r.class_label] = (testDistribution[r.class_label] || 0) + 1;
  }

  return {
    train,
    val,
    test,
    splitStatistics: {
      trainCount: train.length,
      valCount: val.length,
      testCount: test.length,
      trainDistribution,
      testDistribution,
    },
  };
}
