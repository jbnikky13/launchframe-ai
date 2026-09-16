import { createWorkerClient, claimJobById, claimNextJob, processJob } from './supabase-worker';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const requestedJobId = process.env.JOB_ID?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const client = createWorkerClient({ supabaseUrl, serviceRoleKey });

// repository_dispatch supplies the exact job ID. Scheduled/manual runs do not,
// so they safely fall back to the atomic next-job claim RPC.
const job = requestedJobId
  ? await claimJobById(client, requestedJobId)
  : await claimNextJob(client);

if (!job) {
  if (requestedJobId) {
    console.log(`[LaunchFrame] Requested job ${requestedJobId} is no longer queued; nothing to render.`);
  } else {
    console.log('[LaunchFrame] No queued render job. Worker exiting.');
  }
  process.exit(0);
}

console.log(`[LaunchFrame] Claimed job ${job.id}; rendering immediately.`);
const outputUrl = await processJob(client, job);
console.log(`[LaunchFrame] Completed job ${job.id}: ${outputUrl}`);
