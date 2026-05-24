export type JobStatus = 'success' | 'failure' | 'running';

export interface JobRun {
  jobName: string;
  status: JobStatus;
  startedAt: Date;
  finishedAt?: Date;
  durationMs?: number;
  error?: string;
  attempt: number;
}

export interface JobHistory {
  record(run: JobRun): void;
  getAll(jobName?: string): JobRun[];
  getLastRun(jobName: string): JobRun | undefined;
  getFailures(jobName?: string): JobRun[];
  clear(jobName?: string): void;
}

export function createJobHistory(maxEntriesPerJob = 100): JobHistory {
  const store = new Map<string, JobRun[]>();

  function getEntries(jobName: string): JobRun[] {
    if (!store.has(jobName)) {
      store.set(jobName, []);
    }
    return store.get(jobName)!;
  }

  return {
    record(run: JobRun): void {
      const entries = getEntries(run.jobName);
      entries.push(run);
      if (entries.length > maxEntriesPerJob) {
        entries.splice(0, entries.length - maxEntriesPerJob);
      }
    },

    getAll(jobName?: string): JobRun[] {
      if (jobName) {
        return [...(store.get(jobName) ?? [])];
      }
      const all: JobRun[] = [];
      for (const runs of store.values()) {
        all.push(...runs);
      }
      return all.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
    },

    getLastRun(jobName: string): JobRun | undefined {
      const entries = store.get(jobName) ?? [];
      return entries[entries.length - 1];
    },

    getFailures(jobName?: string): JobRun[] {
      return this.getAll(jobName).filter((r) => r.status === 'failure');
    },

    clear(jobName?: string): void {
      if (jobName) {
        store.delete(jobName);
      } else {
        store.clear();
      }
    },
  };
}
