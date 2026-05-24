export type JobMiddlewareFn = (
  jobName: string,
  fn: () => Promise<void>,
  next: () => Promise<void>
) => Promise<void>;

export interface MiddlewareContext {
  jobName: string;
  startedAt: Date;
  attempt: number;
}

export function createLoggingMiddleware(
  logger: Pick<Console, 'log' | 'error'> = console
): JobMiddlewareFn {
  return async (jobName, _fn, next) => {
    const start = Date.now();
    logger.log(`[schedul8] Job "${jobName}" started at ${new Date().toISOString()}`);
    try {
      await next();
      const duration = Date.now() - start;
      logger.log(`[schedul8] Job "${jobName}" completed in ${duration}ms`);
    } catch (err) {
      const duration = Date.now() - start;
      logger.error(`[schedul8] Job "${jobName}" failed after ${duration}ms:`, err);
      throw err;
    }
  };
}

export function createTimeoutMiddleware(timeoutMs: number): JobMiddlewareFn {
  return async (jobName, _fn, next) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Job "${jobName}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    try {
      await Promise.race([next(), timeoutPromise]);
    } finally {
      clearTimeout(timer);
    }
  };
}

export function composeMiddleware(
  middlewares: JobMiddlewareFn[],
  jobName: string,
  fn: () => Promise<void>
): () => Promise<void> {
  const dispatch = (index: number): Promise<void> => {
    if (index >= middlewares.length) {
      return fn();
    }
    const middleware = middlewares[index];
    return middleware(jobName, fn, () => dispatch(index + 1));
  };
  return () => dispatch(0);
}
