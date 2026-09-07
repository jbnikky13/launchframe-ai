import { createClient } from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error('Missing Supabase worker environment.');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {error}=await db.from('launchframe_render_jobs').select('id').limit(1);
if(error)throw error;
console.log('LaunchFrame worker healthcheck: OK');
