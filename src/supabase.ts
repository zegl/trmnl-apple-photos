import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// These should be set in your environment variables
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_ANON_KEY || '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET || '';

if (!supabaseUrl) {
  throw new Error('Supabase URL is missing');
}

if (!supabaseKey) {
  throw new Error('Supabase API key is missing');
}

if (!supabaseJwtSecret) {
  throw new Error('Supabase JWT secret is missing');
}

const _createUserJwt = (user_uuid: string) => {
  return jwt.sign(
    {
      sub: user_uuid,
      iat: Date.now() / 1000,
    },
    supabaseJwtSecret
  );
};

export const getSupabaseClientForUser = (_user_uuid: string) => {
  // const jwt = createUserJwt(user_uuid);
  // const headers = { Authorization: `Bearer ${jwt}` };

  return createClient(supabaseUrl, supabaseKey, {
    // global: {
    //   headers: headers,
    // },
  });
};

export const getGenericSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseKey);
};
