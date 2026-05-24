import { withRetry, describeRetry, RetryOptions } from './retry';

describe('withRetry', () => {
  it('returns result immediately on first success', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 });

    expect(result.success).toBe(true);
    expect(result.result).toBe('ok');
    expect(result.attempts).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds eventually', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, { maxAttempts: 5, initialDelayMs: 1 });

    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(3);
  });

  it('returns failure after exhausting all attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));

    const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 1 });

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('always fails');
    expect(result.attempts).toBe(3);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('calls onRetry callback with attempt number and error', async () => {
    const onRetry = jest.fn();
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('oops'))
      .mockResolvedValue('done');

    await withRetry(fn, { maxAttempts: 3, initialDelayMs: 1, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('wraps non-Error rejections in an Error object', async () => {
    const fn = jest.fn().mockRejectedValue('string error');

    const result = await withRetry(fn, { maxAttempts: 1, initialDelayMs: 1 });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('string error');
  });
});

describe('describeRetry', () => {
  it('returns human-readable retry description', () => {
    const options: RetryOptions = { maxAttempts: 5, initialDelayMs: 500, backoffMultiplier: 2 };
    const description = describeRetry(options);

    expect(description).toContain('5 attempts');
    expect(description).toContain('500ms');
    expect(description).toContain('2x backoff');
  });

  it('uses default backoff multiplier when not specified', () => {
    const description = describeRetry({ maxAttempts: 3, initialDelayMs: 100 });
    expect(description).toContain('2x backoff');
  });
});
