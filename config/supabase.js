import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

/*
|--------------------------------------------------------------------------

ENV VALIDATION
*/

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
throw new Error(
'❌ Missing SUPABASE_URL in environment variables'
);
}

if (!SUPABASE_ANON_KEY) {
throw new Error(
'❌ Missing SUPABASE_ANON_KEY in environment variables'
);
}

/*
|--------------------------------------------------------------------------

SUPABASE CLIENT
*/

const supabase = createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY,
{
auth: {
autoRefreshToken: false,
persistSession: false,
detectSessionInUrl: false
}
}
);

/*
|--------------------------------------------------------------------------

CONNECTION TEST
*/

export const testSupabaseConnection = async () => {
try {
const { error } = await supabase
.from('users')
.select('id')
.limit(1);

if (error) {
  console.error(
    '❌ Supabase connection failed:',
    error.message
  );
  return false;
}

console.log('✅ Supabase connected successfully');
return true;

} catch (error) {
console.error(
'❌ Supabase connection error:',
error.message
);
return false;
}
};

export default supabase;
