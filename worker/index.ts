import { runWorker } from './supabase-worker';
const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!supabaseUrl||!serviceRoleKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
await runWorker({supabaseUrl,serviceRoleKey,pollMs:Number(process.env.WORKER_POLL_MS||5000)});
