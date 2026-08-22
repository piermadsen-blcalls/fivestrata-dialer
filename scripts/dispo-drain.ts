// Drain the disposition outbox once: claim due rows, POST to Lead Intake,
// mark delivered / schedule retries. Idempotent and concurrency-safe (claim
// is SKIP LOCKED + leased) — safe to run from cron, a loop, or by hand.
// Run: npm run dispo:drain  [limit]
import { drainOutbox } from '../src/services/dispoOutbox.js';

const limit = process.argv[2] === undefined ? 25 : Number(process.argv[2]);
if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
  console.error(`invalid limit "${process.argv[2]}" — pass an integer 1-500`);
  process.exit(1);
}
const r = await drainOutbox({ limit });
console.log(
  `claimed ${r.claimed}  delivered ${r.delivered}  retried ${r.retried}  failed ${r.failed}  lostLease ${r.lostLease}`,
);
process.exitCode = 0;
