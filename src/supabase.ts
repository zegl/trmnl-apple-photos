import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// These should be set in your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET || '';

if (!supabaseUrl || !supabaseKey || !supabaseJwtSecret) {
  throw new Error('Supabase URL or API key is missing');
}

const createUserJwt = (user_uuid: string) => {
  return jwt.sign(
    {
      sub: user_uuid,
      iat: new Date().getTime() / 1000,
    },
    supabaseJwtSecret
  );
};

export const getSupabaseClientForUser = (user_uuid: string) => {
  const jwt = createUserJwt(user_uuid);
  const headers = { Authorization: `Bearer ${jwt}` };

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: headers,
    },
  });
};
