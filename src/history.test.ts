import { createJobHistory, JobRun } from './history';

function makeRun(overrides: Partial<JobRun> = {}): JobRun {
  return {
    jobName: 'test-job',
    status: 'success',
    startedAt: new Date('2024-01-01T10:00:00Z'),
    finishedAt: new Date('2024-01-01T10:00:01Z'),
    durationMs: 1000,
    attempt: 1,
    ...overrides,
  };
}

describe('createJobHistory', () => {
  it('records and retrieves runs for a job', () => {
    const history = createJobHistory();
    const run = makeRun();
    history.record(run);
    expect(history.getAll('test-job')).toHaveLength(1);
    expect(history.getAll('test-job')[0]).toEqual(run);
  });

  it('returns all runs across jobs when no name given', () => {
    const history = createJobHistory();
    history.record(makeRun({ jobName: 'job-a' }));
    history.record(makeRun({ jobName: 'job-b' }));
    expect(history.getAll()).toHaveLength(2);
  });

  it('getLastRun returns the most recent run', () => {
    const history = createJobHistory();
    history.record(makeRun({ startedAt: new Date('2024-01-01T09:00:00Z') }));
    const latest = makeRun({ startedAt: new Date('2024-01-01T10:00:00Z') });
    history.record(latest);
    expect(history.getLastRun('test-job')).toEqual(latest);
  });

  it('getLastRun returns undefined for unknown job', () => {
    const history = createJobHistory();
    expect(history.getLastRun('unknown')).toBeUndefined();
  });

  it('getFailures filters to failed runs', () => {
    const history = createJobHistory();
    history.record(makeRun({ status: 'success' }));
    history.record(makeRun({ status: 'failure', error: 'oops' }));
    history.record(makeRun({ status: 'failure', error: 'again' }));
    expect(history.getFailures('test-job')).toHaveLength(2);
  });

  it('respects maxEntriesPerJob limit', () => {
    const history = createJobHistory(3);
    for (let i = 0; i < 5; i++) {
      history.record(makeRun({ startedAt: new Date(Date.now() + i * 1000) }));
    }
    expect(history.getAll('test-job')).toHaveLength(3);
  });

  it('clears runs for a specific job', () => {
    const history = createJobHistory();
    history.record(makeRun({ jobName: 'job-a' }));
    history.record(makeRun({ jobName: 'job-b' }));
    history.clear('job-a');
    expect(history.getAll('job-a')).toHaveLength(0);
    expect(history.getAll('job-b')).toHaveLength(1);
  });

  it('clears all runs when no job name given', () => {
    const history = createJobHistory();
    history.record(makeRun({ jobName: 'job-a' }));
    history.record(makeRun({ jobName: 'job-b' }));
    history.clear();
    expect(history.getAll()).toHaveLength(0);
  });
});
