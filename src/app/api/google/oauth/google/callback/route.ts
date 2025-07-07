import { getClient } from '@/google/auth';
import { GoogleBlobRepository } from '@/google/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json(
      { error: 'Missing code or state' },
      { status: 400 }
    );
  }

  const supabaseClient = getSupabaseClientForUser(state);
  const googleBlobRepository = new GoogleBlobRepository(supabaseClient);

  // Exchange code for tokens
  const client = getClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.expiry_date || !tokens.scope) {
    return NextResponse.json(
      { error: 'Missing access token, expires at, or scope' },
      { status: 400 }
    );
  }

  await googleBlobRepository.setGoogleTokens({
    user_uuid: state,
    google_access_token: tokens.access_token,
    google_access_token_expires_at: new Date(tokens.expiry_date),
    google_scope: tokens.scope,
  });

  // If has refresh token, set it
  if (tokens.refresh_token) {
    await googleBlobRepository.setGoogleRefreshToken({
      user_uuid: state,
      google_refresh_token: tokens.refresh_token,
    });
  }

  // redirect to the home page
  return NextResponse.redirect(new URL(`/settings?uuid=${state}`, request.url));
}
