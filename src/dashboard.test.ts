import { describe, it, expect, beforeEach } from 'vitest';
import { createJobHistory } from './history';
import { summarizeJob, createDashboard, formatDashboard } from './dashboard';

function addEntry(
  history: ReturnType<typeof createJobHistory>,
  jobId: string,
  status: 'success' | 'failure',
  durationMs = 100
) {
  const startedAt = new Date();
  history.record({
    jobId,
    status,
    startedAt,
    finishedAt: new Date(startedAt.getTime() + durationMs),
    durationMs,
    attempt: 1,
    error: status === 'failure' ? new Error('fail') : undefined,
  });
}

describe('summarizeJob', () => {
  it('returns zero values for a job with no history', () => {
    const history = createJobHistory();
    const summary = summarizeJob('job-a', history);
    expect(summary.totalRuns).toBe(0);
    expect(summary.lastStatus).toBeNull();
    expect(summary.successRate).toBe(0);
  });

  it('calculates success rate correctly', () => {
    const history = createJobHistory();
    addEntry(history, 'job-a', 'success', 200);
    addEntry(history, 'job-a', 'success', 400);
    addEntry(history, 'job-a', 'failure', 100);
    const summary = summarizeJob('job-a', history);
    expect(summary.totalRuns).toBe(3);
    expect(summary.successCount).toBe(2);
    expect(summary.failureCount).toBe(1);
    expect(summary.successRate).toBeCloseTo(66.67, 1);
    expect(summary.averageDurationMs).toBe(233);
  });

  it('reflects the last run status', () => {
    const history = createJobHistory();
    addEntry(history, 'job-b', 'success');
    addEntry(history, 'job-b', 'failure');
    const summary = summarizeJob('job-b', history);
    expect(summary.lastStatus).toBe('failure');
  });
});

describe('createDashboard', () => {
  let history: ReturnType<typeof createJobHistory>;

  beforeEach(() => {
    history = createJobHistory();
  });

  it('returns empty snapshot when history is empty', () => {
    const snap = createDashboard(history);
    expect(snap.totalJobs).toBe(0);
    expect(snap.healthyJobs).toBe(0);
    expect(snap.jobs).toHaveLength(0);
  });

  it('counts healthy and unhealthy jobs correctly', () => {
    addEntry(history, 'job-ok', 'success');
    addEntry(history, 'job-bad', 'failure');
    const snap = createDashboard(history);
    expect(snap.totalJobs).toBe(2);
    expect(snap.healthyJobs).toBe(1);
    expect(snap.unhealthyJobs).toBe(1);
  });
});

describe('formatDashboard', () => {
  it('produces a non-empty string with job info', () => {
    const history = createJobHistory();
    addEntry(history, 'my-job', 'success', 50);
    const snap = createDashboard(history);
    const output = formatDashboard(snap);
    expect(output).toContain('schedul8 Dashboard');
    expect(output).toContain('my-job');
    expect(output).toContain('SUCCESS');
    expect(output).toContain('rate=100%');
  });
});
