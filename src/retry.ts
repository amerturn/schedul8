export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
}

const DEFAULT_BACKOFF_MULTIPLIER = 2;
const DEFAULT_MAX_DELAY_MS = 30_000;

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<RetryResult<T>> {
  const {
    maxAttempts,
    initialDelayMs,
    backoffMultiplier = DEFAULT_BACKOFF_MULTIPLIER,
    maxDelayMs = DEFAULT_MAX_DELAY_MS,
    onRetry,
  } = options;

  let lastError: Error | undefined;
  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return { success: true, result, attempts: attempt };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxAttempts) {
        onRetry?.(attempt, lastError);
        await sleep(delayMs);
        delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
      }
    }
  }

  return { success: false, error: lastError, attempts: maxAttempts };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function describeRetry(options: RetryOptions): string {
  const { maxAttempts, initialDelayMs, backoffMultiplier = DEFAULT_BACKOFF_MULTIPLIER } = options;
  return `retry up to ${maxAttempts} attempts, starting at ${initialDelayMs}ms delay with ${backoffMultiplier}x backoff`;
}
