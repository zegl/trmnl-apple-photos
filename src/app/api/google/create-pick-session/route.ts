import { getClient } from '@/google/auth';
import { GoogleBlobRepository } from '@/google/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const GooglePickingSessionResponseSchema = z.object({
  id: z.string(),
  pickerUri: z.string(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { user_uuid } = body;

  if (!user_uuid) {
    return NextResponse.json({ error: 'Missing user_uuid' }, { status: 400 });
  }

  const supabaseClient = getSupabaseClientForUser(user_uuid);
  const googleBlobRepository = new GoogleBlobRepository(supabaseClient);

  const googleTokens = await googleBlobRepository.getGoogleTokens(user_uuid);

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
