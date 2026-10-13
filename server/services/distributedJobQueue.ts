import { EventEmitter } from 'events';
import crypto from 'crypto';

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed';

export interface BackgroundJob<TData = any, TResult = any> {
  id: string;
  queueName: string;
  data: TData;
  status: JobStatus;
  progress: number; // 0 - 100%
  result?: TResult;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  completedAt?: string;
}

export type JobProcessor<TData = any, TResult = any> = (
  job: BackgroundJob<TData, TResult>,
  updateProgress: (pct: number) => void
) => Promise<TResult>;

/**
 * Enterprise Production In-Memory / Distributed Job Queue Manager.
 * Operates in non-blocking event-driven fashion with exponential backoff and progress tracking.
 */
export class DistributedJobQueue extends EventEmitter {
  private jobs: Map<string, BackgroundJob> = new Map();
  private processors: Map<string, JobProcessor> = new Map();
  private queueBuckets: Map<string, string[]> = new Map(); // queueName -> jobIds[]
  private isProcessing: Map<string, boolean> = new Map();

  constructor() {
    super();
  }

  /**
   * Register a worker processor for a specific queue (e.g. 'resume-parsing', 'batch-screening')
   */
  public registerWorker<TData = any, TResult = any>(
    queueName: string,
    processor: JobProcessor<TData, TResult>
  ) {
    this.processors.set(queueName, processor);
    if (!this.queueBuckets.has(queueName)) {
      this.queueBuckets.set(queueName, []);
    }
  }

  /**
   * Add a job to the background queue with automatic worker dispatch
   */
  public async add<TData = any>(
    queueName: string,
    data: TData,
    options: { maxAttempts?: number } = {}
  ): Promise<BackgroundJob<TData>> {
    const id = `job_${queueName}_${crypto.randomUUID().slice(0, 8)}`;
    const job: BackgroundJob<TData> = {
      id,
      queueName,
      data,
      status: 'waiting',
      progress: 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(id, job);

    let bucket = this.queueBuckets.get(queueName);
    if (!bucket) {
      bucket = [];
      this.queueBuckets.set(queueName, bucket);
    }
    bucket.push(id);

    this.emit('job:added', job);

    // Trigger asynchronous queue tick without blocking caller
    setImmediate(() => this.processNext(queueName));

    return job;
  }

  public getJob(id: string): BackgroundJob | undefined {
    return this.jobs.get(id);
  }

  public getQueueStats(queueName: string) {
    const bucket = this.queueBuckets.get(queueName) || [];
    let waiting = 0;
    let active = 0;
    let completed = 0;
    let failed = 0;

    for (const id of bucket) {
      const job = this.jobs.get(id);
      if (!job) continue;
      if (job.status === 'waiting') waiting++;
      else if (job.status === 'active') active++;
      else if (job.status === 'completed') completed++;
      else if (job.status === 'failed') failed++;
    }

    return { queueName, total: bucket.length, waiting, active, completed, failed };
  }

  private async processNext(queueName: string) {
    if (this.isProcessing.get(queueName)) return;

    const bucket = this.queueBuckets.get(queueName) || [];
    const nextJobId = bucket.find((id) => this.jobs.get(id)?.status === 'waiting');
    if (!nextJobId) return;

    const job = this.jobs.get(nextJobId);
    const processor = this.processors.get(queueName);

    if (!job || !processor) return;

    this.isProcessing.set(queueName, true);
    job.status = 'active';
    job.attempts++;
    this.emit('job:active', job);

    const updateProgress = (pct: number) => {
      job.progress = Math.min(100, Math.max(0, Math.round(pct)));
      this.emit('job:progress', { id: job.id, progress: job.progress });
    };

    try {
      const result = await processor(job, updateProgress);
      job.status = 'completed';
      job.progress = 100;
      job.result = result;
      job.completedAt = new Date().toISOString();
      this.emit('job:completed', job);
    } catch (err: any) {
      if (job.attempts < job.maxAttempts) {
        job.status = 'waiting';
        // Exponential backoff
        await new Promise((r) => setTimeout(r, Math.pow(2, job.attempts) * 200));
      } else {
        job.status = 'failed';
        job.error = err.message || 'Job execution failed';
        job.completedAt = new Date().toISOString();
        this.emit('job:failed', job);
      }
    } finally {
      this.isProcessing.set(queueName, false);
      // Process remaining jobs in bucket
      setImmediate(() => this.processNext(queueName));
    }
  }
}

// Global Singleton Queue Instance for Enterprise Services
export const jobQueue = new DistributedJobQueue();

// Register the core resume processing worker
jobQueue.registerWorker('resume-processing', async (job, updateProgress) => {
  const { resumeId, candidateId, candidateProfileId, storedFilename, applicationId, jobId } = job.data;
  updateProgress(15);
  const { processResumeAndScreen } = await import('./resumeProcessingPipeline');
  updateProgress(45);
  const result = await processResumeAndScreen(resumeId, candidateId, candidateProfileId, storedFilename, applicationId, jobId);
  updateProgress(100);
  if (result.status === 'Failed') {
    throw new Error(result.errorMessage || 'Resume processing failed.');
  }
  return result;
});

