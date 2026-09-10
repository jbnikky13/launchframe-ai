import { createWorkerClient, claimNextJob, processJob } from './supabase-worker';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const client = createWorkerClient({ supabaseUrl, serviceRoleKey });
const attempts = 5;
const waitMs = 30_000;

for (let attempt = 1; attempt <= attempts; attempt++) {
  const job = await claimNextJob(client);

  if (job) {
    console.log(`[LaunchFrame] Claimed job ${job.id}`);
    const outputUrl = await processJob(client, job);
    console.log(`[LaunchFrame] Completed job ${job.id}: ${outputUrl}`);
    process.exit(0);
  }

  if (attempt < attempts) {
    console.log(`[LaunchFrame] No queued job yet (${attempt}/${attempts}). Waiting ${waitMs / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

console.log('[LaunchFrame] No pending render jobs after polling window. Worker exiting normally.');
process.exit(0);
