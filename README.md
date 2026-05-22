# schedul8

> Simple cron-as-code library for Node.js with human-readable schedule definitions and built-in retry logic

## Installation

```bash
npm install schedul8
```

## Usage

```typescript
import { Scheduler } from 'schedul8';

const scheduler = new Scheduler();

scheduler.define({
  name: 'send-daily-report',
  schedule: 'every day at 08:00',
  retries: 3,
  handler: async () => {
    await sendReport();
  },
});

scheduler.define({
  name: 'cleanup-temp-files',
  schedule: 'every 30 minutes',
  handler: async () => {
    await cleanupTempFiles();
  },
});

scheduler.start();
```

### Schedule Syntax

| Expression | Description |
|---|---|
| `every 5 minutes` | Run every 5 minutes |
| `every hour` | Run once per hour |
| `every day at 09:00` | Run daily at 9 AM |
| `every monday at 12:00` | Run every Monday at noon |

### Retry Logic

Pass a `retries` count to automatically retry failed jobs with exponential backoff. Failed jobs emit an `error` event you can subscribe to for logging or alerting.

```typescript
scheduler.on('error', (job, err) => {
  console.error(`Job "${job.name}" failed:`, err);
});
```

## License

MIT