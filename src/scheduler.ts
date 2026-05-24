import * as cron from 'node-cron';
import { parseSchedule } from './schedule-parser';
import { defineJob, JobDefinition } from './job';

export interface SchedulerOptions {
  timezone?: string;
  onError?: (jobName: string, error: unknown) => void;
}

export interface ScheduledJob {
  name: string;
  schedule: string;
  task: cron.ScheduledTask;
  stop: () => void;
  start: () => void;
  isRunning: () => boolean;
}

export class Scheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private options: SchedulerOptions;

  constructor(options: SchedulerOptions = {}) {
    this.options = options;
  }

  register(job: JobDefinition): ScheduledJob {
    if (this.jobs.has(job.name)) {
      throw new Error(`Job "${job.name}" is already registered.`);
    }

    const cronExpression = parseSchedule(job.schedule);

    const task = cron.schedule(
      cronExpression,
      async () => {
        try {
          await job.handler();
        } catch (error) {
          if (this.options.onError) {
            this.options.onError(job.name, error);
          } else {
            console.error(`[schedul8] Job "${job.name}" failed:`, error);
          }
        }
      },
      {
        timezone: this.options.timezone,
        scheduled: false,
      }
    );

    const scheduled: ScheduledJob = {
      name: job.name,
      schedule: cronExpression,
      task,
      stop: () => task.stop(),
      start: () => task.start(),
      isRunning: () => task.getStatus() === 'scheduled',
    };

    this.jobs.set(job.name, scheduled);
    return scheduled;
  }

  startAll(): void {
    for (const job of this.jobs.values()) {
      job.start();
    }
  }

  stopAll(): void {
    for (const job of this.jobs.values()) {
      job.stop();
    }
  }

  getJob(name: string): ScheduledJob | undefined {
    return this.jobs.get(name);
  }

  listJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  unregister(name: string): boolean {
    const job = this.jobs.get(name);
    if (!job) return false;
    job.stop();
    this.jobs.delete(name);
    return true;
  }
}

export function createScheduler(options?: SchedulerOptions): Scheduler {
  return new Scheduler(options);
}
