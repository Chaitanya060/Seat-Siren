// Worker lease (spec §7) — so overlapping cron runs don't double-work.
// A run takes a short lease in worker_locks; only the holder proceeds.

import { randomToken } from '../util/encoding.js'
import { nowMs } from '../util/time.js'

const DEFAULT_LEASE_MS = 50_000 // < one cron interval

export async function acquireLease(env, lockName = 'poller', leaseMs = DEFAULT_LEASE_MS) {
  const now = nowMs()
  const owner = randomToken(12)
  const until = now + leaseMs
  // Insert if absent, or steal only if the existing lease has expired.
  const res = await env.DB.prepare(
    `INSERT INTO worker_locks (lock_name, owner_token, lease_until, updated_at)
     VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(lock_name) DO UPDATE SET
       owner_token = excluded.owner_token,
       lease_until = excluded.lease_until,
       updated_at  = excluded.updated_at
     WHERE worker_locks.lease_until <= ?4`
  ).bind(lockName, owner, until, now).run()

  return res.meta.changes > 0 ? owner : null
}

export async function releaseLease(env, lockName, owner) {
  await env.DB.prepare(
    'UPDATE worker_locks SET lease_until = 0, updated_at = ? WHERE lock_name = ? AND owner_token = ?'
  ).bind(nowMs(), lockName, owner).run()
}
