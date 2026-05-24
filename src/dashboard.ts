import { JobHistory, getEntries } from './history';

export interface JobSummary {
  jobId: string;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  lastRunAt: Date | null;
  lastStatus: 'success' | 'failure' | null;
  averageDurationMs: number;
  successRate: number;
}

export interface DashboardSnapshot {
  generatedAt: Date;
  jobs: JobSummary[];
  totalJobs: number;
  healthyJobs: number;
  unhealthyJobs: number;
}

export function summarizeJob(jobId: string, history: JobHistory): JobSummary {
  const entries = getEntries(history, jobId);

  if (entries.length === 0) {
    return {
      jobId,
      totalRuns: 0,
      successCount: 0,
      failureCount: 0,
      lastRunAt: null,
      lastStatus: null,
      averageDurationMs: 0,
      successRate: 0,
    };
  }

  const successCount = entries.filter((e) => e.status === 'success').length;
  const failureCount = entries.filter((e) => e.status === 'failure').length;
  const totalDuration = entries.reduce((sum, e) => sum + e.durationMs, 0);
  const last = entries[entries.length - 1];

  return {
    jobId,
    totalRuns: entries.length,
    successCount,
    failureCount,
    lastRunAt: last.startedAt,
    lastStatus: last.status,
    averageDurationMs: Math.round(totalDuration / entries.length),
    successRate: parseFloat(((successCount / entries.length) * 100).toFixed(2)),
  };
}

export function createDashboard(history: JobHistory): DashboardSnapshot {
  const jobIds = Array.from(new Set(getEntries(history).map((e) => e.jobId)));
  const jobs = jobIds.map((id) => summarizeJob(id, history));

  const healthyJobs = jobs.filter(
    (j) => j.lastStatus === 'success' || j.lastStatus === null
  ).length;

  return {
    generatedAt: new Date(),
    jobs,
    totalJobs: jobs.length,
    healthyJobs,
    unhealthyJobs: jobs.length - healthyJobs,
  };
}

export function formatDashboard(snapshot: DashboardSnapshot): string {
  const lines: string[] = [
    `=== schedul8 Dashboard (${snapshot.generatedAt.toISOString()}) ===`,
    `Jobs: ${snapshot.totalJobs} total | ${snapshot.healthyJobs} healthy | ${snapshot.unhealthyJobs} unhealthy`,
    '',
  ];

  for (const job of snapshot.jobs) {
    const status = job.lastStatus ? `[${job.lastStatus.toUpperCase()}]` : '[NO RUNS]';
    lines.push(
      `  ${status.padEnd(10)} ${job.jobId.padEnd(30)} ` +
        `runs=${job.totalRuns} ok=${job.successCount} fail=${job.failureCount} ` +
        `avg=${job.averageDurationMs}ms rate=${job.successRate}%`
    );
  }

  return lines.join('\n');
}
