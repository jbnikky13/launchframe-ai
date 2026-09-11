import { createWorkerClient, claimNextJob, processJob } from './supabase-worker';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const client = createWorkerClient({ supabaseUrl, serviceRoleKey });

// A dispatch is already the signal that a job exists. Do not poll for minutes:
// claim immediately and let the scheduled workflow remain the safety net.
const job = await claimNextJob(client);

if (!job) {
  console.log('[LaunchFrame] No queued render job. Worker exiting.');
  process.exit(0);
}

console.log(`[LaunchFrame] Claimed job ${job.id}; rendering immediately.`);
const outputUrl = await processJob(client, job);
console.log(`[LaunchFrame] Completed job ${job.id}: ${outputUrl}`);
