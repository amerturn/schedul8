import { parseSchedule, describeCron } from './schedule-parser';
import { withRetry, RetryOptions, describeRetry } from './retry';

export interface JobOptions {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
  retry?: Partial<RetryOptions>;
  timezone?: string;
}

export interface JobRunResult {
  jobName: string;
  startedAt: Date;
  finishedAt: Date;
  success: boolean;
  attempts: number;
  error?: Error;
}

const DEFAULT_RETRY: RetryOptions = {
  maxAttempts: 1,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
};

export class Job {
  readonly name: string;
  readonly cronExpression: string;
  readonly timezone: string;
  private readonly handler: () => Promise<void>;
  private readonly retryOptions: RetryOptions;

  constructor(options: JobOptions) {
    this.name = options.name;
    this.cronExpression = parseSchedule(options.schedule);
    this.timezone = options.timezone ?? 'UTC';
    this.handler = options.handler;
    this.retryOptions = { ...DEFAULT_RETRY, ...options.retry };
  }

  async run(): Promise<JobRunResult> {
    const startedAt = new Date();

    const retryResult = await withRetry(this.handler, this.retryOptions);

    return {
      jobName: this.name,
      startedAt,
      finishedAt: new Date(),
      success: retryResult.success,
      attempts: retryResult.attempts,
      error: retryResult.error,
    };
  }

  describe(): string {
    const scheduleDesc = describeCron(this.cronExpression);
    const retryDesc = describeRetry(this.retryOptions);
    return `Job "${this.name}": runs ${scheduleDesc} (${this.timezone}), ${retryDesc}`;
  }
}

export function defineJob(options: JobOptions): Job {
  return new Job(options);
}
