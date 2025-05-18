import { createClient } from '@supabase/supabase-js';

// These should be set in your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or API key is missing');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
