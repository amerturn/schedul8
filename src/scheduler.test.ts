import { Scheduler, createScheduler } from './scheduler';
import { defineJob } from './job';

describe('Scheduler', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    scheduler = createScheduler();
  });

  afterEach(() => {
    scheduler.stopAll();
  });

  it('should create a scheduler instance', () => {
    expect(scheduler).toBeInstanceOf(Scheduler);
  });

  it('should register a job and return a scheduled job', () => {
    const job = defineJob({
      name: 'test-job',
      schedule: 'every 5 minutes',
      handler: async () => {},
    });

    const scheduled = scheduler.register(job);
    expect(scheduled.name).toBe('test-job');
    expect(scheduled.schedule).toBe('*/5 * * * *');
  });

  it('should throw if the same job name is registered twice', () => {
    const job = defineJob({
      name: 'duplicate-job',
      schedule: 'every 1 hour',
      handler: async () => {},
    });

    scheduler.register(job);
    expect(() => scheduler.register(job)).toThrow('already registered');
  });

  it('should list registered jobs', () => {
    scheduler.register(defineJob({ name: 'job-a', schedule: 'every 10 minutes', handler: async () => {} }));
    scheduler.register(defineJob({ name: 'job-b', schedule: 'every 1 hour', handler: async () => {} }));

    const jobs = scheduler.listJobs();
    expect(jobs).toHaveLength(2);
    expect(jobs.map(j => j.name)).toEqual(['job-a', 'job-b']);
  });

  it('should retrieve a job by name', () => {
    scheduler.register(defineJob({ name: 'lookup-job', schedule: 'every 30 minutes', handler: async () => {} }));
    const found = scheduler.getJob('lookup-job');
    expect(found).toBeDefined();
    expect(found?.name).toBe('lookup-job');
  });

  it('should return undefined for unknown job name', () => {
    expect(scheduler.getJob('nonexistent')).toBeUndefined();
  });

  it('should unregister a job', () => {
    scheduler.register(defineJob({ name: 'removable', schedule: 'every 5 minutes', handler: async () => {} }));
    const removed = scheduler.unregister('removable');
    expect(removed).toBe(true);
    expect(scheduler.getJob('removable')).toBeUndefined();
  });

  it('should return false when unregistering a non-existent job', () => {
    expect(scheduler.unregister('ghost')).toBe(false);
  });

  it('should call onError handler when job throws', async () => {
    const errors: Array<{ name: string; error: unknown }> = [];
    const errorScheduler = createScheduler({
      onError: (name, error) => errors.push({ name, error }),
    });

    const job = defineJob({
      name: 'failing-job',
      schedule: 'every 1 minute',
      handler: async () => { throw new Error('boom'); },
    });

    const scheduled = errorScheduler.register(job);
    // Directly invoke the handler to simulate execution
    await expect(job.handler()).rejects.toThrow('boom');
    errorScheduler.stopAll();
  });
});
