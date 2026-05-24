import {
  createScheduler,
  Scheduler,
  defineJob,
  parseSchedule,
  describeCron,
  describeRetry,
} from './index';

describe('schedul8 public API', () => {
  it('should export createScheduler', () => {
    expect(typeof createScheduler).toBe('function');
  });

  it('should export Scheduler class', () => {
    expect(typeof Scheduler).toBe('function');
  });

  it('should export defineJob', () => {
    expect(typeof defineJob).toBe('function');
  });

  it('should export parseSchedule', () => {
    expect(typeof parseSchedule).toBe('function');
  });

  it('should export describeCron', () => {
    expect(typeof describeCron).toBe('function');
  });

  it('should export describeRetry', () => {
    expect(typeof describeRetry).toBe('function');
  });

  it('should create a working scheduler from the public API', () => {
    const scheduler = createScheduler({ timezone: 'UTC' });
    const job = defineJob({
      name: 'api-test-job',
      schedule: 'every 15 minutes',
      handler: async () => {},
    });

    const scheduled = scheduler.register(job);
    expect(scheduled.name).toBe('api-test-job');
    expect(parseSchedule('every 15 minutes')).toBe('*/15 * * * *');
    scheduler.stopAll();
  });

  it('should describe a cron expression via public API', () => {
    const description = describeCron('0 9 * * 1');
    expect(typeof description).toBe('string');
    expect(description.length).toBeGreaterThan(0);
  });
});
