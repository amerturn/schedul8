import { Middleware } from './middleware';
import { createJobHistory, JobHistory, JobRun } from './history';

export interface HistoryMiddlewareOptions {
  history?: JobHistory;
  maxEntriesPerJob?: number;
}

export function createHistoryMiddleware(options: HistoryMiddlewareOptions = {}): {
  middleware: Middleware;
  history: JobHistory;
} {
  const history = options.history ?? createJobHistory(options.maxEntriesPerJob);

  const middleware: Middleware = (job, next) => {
    return async () => {
      const startedAt = new Date();
      const run: JobRun = {
        jobName: job.name,
        status: 'running',
        startedAt,
        attempt: 1,
      };

      history.record(run);

      try {
        await next();
        const finishedAt = new Date();
        const completed: JobRun = {
          ...run,
          status: 'success',
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
        };
        history.record(completed);
      } catch (err) {
        const finishedAt = new Date();
        const failed: JobRun = {
          ...run,
          status: 'failure',
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          error: err instanceof Error ? err.message : String(err),
        };
        history.record(failed);
        throw err;
      }
    };
  };

  return { middleware, history };
}
