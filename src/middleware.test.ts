import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createLoggingMiddleware,
  createTimeoutMiddleware,
  composeMiddleware,
} from './middleware';

describe('createLoggingMiddleware', () => {
  it('logs start and completion for successful jobs', async () => {
    const logger = { log: vi.fn(), error: vi.fn() };
    const middleware = createLoggingMiddleware(logger);
    const fn = vi.fn().mockResolvedValue(undefined);

    await middleware('testJob', fn, fn);

    expect(logger.log).toHaveBeenCalledTimes(2);
    expect(logger.log.mock.calls[0][0]).toContain('started');
    expect(logger.log.mock.calls[1][0]).toContain('completed');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs error when job throws', async () => {
    const logger = { log: vi.fn(), error: vi.fn() };
    const middleware = createLoggingMiddleware(logger);
    const error = new Error('boom');
    const next = vi.fn().mockRejectedValue(error);

    await expect(middleware('failJob', next, next)).rejects.toThrow('boom');
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0][0]).toContain('failed');
  });
});

describe('createTimeoutMiddleware', () => {
  it('resolves when job completes within timeout', async () => {
    const middleware = createTimeoutMiddleware(1000);
    const next = vi.fn().mockResolvedValue(undefined);

    await expect(middleware('fastJob', next, next)).resolves.toBeUndefined();
  });

  it('rejects when job exceeds timeout', async () => {
    const middleware = createTimeoutMiddleware(50);
    const next = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    );

    await expect(middleware('slowJob', next, next)).rejects.toThrow(
      'timed out after 50ms'
    );
  });
});

describe('composeMiddleware', () => {
  it('calls middlewares in order', async () => {
    const order: string[] = [];
    const m1 = vi.fn(async (_name: string, _fn: any, next: () => Promise<void>) => {
      order.push('m1:before');
      await next();
      order.push('m1:after');
    });
    const m2 = vi.fn(async (_name: string, _fn: any, next: () => Promise<void>) => {
      order.push('m2:before');
      await next();
      order.push('m2:after');
    });
    const fn = vi.fn(async () => { order.push('fn'); });

    const composed = composeMiddleware([m1, m2], 'myJob', fn);
    await composed();

    expect(order).toEqual(['m1:before', 'm2:before', 'fn', 'm2:after', 'm1:after']);
  });

  it('calls fn directly when no middlewares provided', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const composed = composeMiddleware([], 'emptyJob', fn);
    await composed();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
