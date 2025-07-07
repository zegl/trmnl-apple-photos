import { getClient } from '@/google/auth';
import { GoogleBlobRepository } from '@/google/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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

  const googleTokens = await googleBlobRepository.getGoogleTokens(state);

  if (
    !googleTokens.success ||
    !googleTokens.data.google_access_token ||
    !googleTokens.data.google_refresh_token
  ) {
    return NextResponse.json(
      { error: 'Failed to get Google tokens' },
      { status: 500 }
    );
  }

  const client = getClient();

  client.setCredentials({
    access_token: googleTokens.data.google_access_token,
    refresh_token: googleTokens.data.google_refresh_token,
  });

  const create = await client.request({
    url: 'https://photospicker.googleapis.com/v1/sessions',
    method: 'POST',
    body: JSON.stringify({
      album: {
        title: 'TRMNL',
      },
    }),
  });

  console.log('created google pick session', create.data);

  const createResponse = GooglePickingSessionResponseSchema.parse(create.data);

  await googleBlobRepository.setGooglePickSessionId({
    user_uuid: user_uuid,
    google_pick_session_id: createResponse.id,
  });

  return NextResponse.json({
    status: 'success',
  });
}
