import { getClient } from '@/google/auth';
import { GoogleBlobRepository } from '@/google/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import { NextResponse } from 'next/server';
import {
  CreatePickSessionResponse,
  GooglePickingSessionResponseSchema,
} from './type';
import { onGoogleClientTokens } from '@/google/auth-refresher';

export async function POST(
  request: Request
): Promise<NextResponse<CreatePickSessionResponse>> {
  const body = await request.json();
  const { user_uuid } = body;

  if (!user_uuid) {
    return NextResponse.json(
      { success: false, error: 'Missing user_uuid' },
      { status: 400 }
    );
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
      { success: false, error: 'Failed to get Google tokens' },
      { status: 500 }
    );
  }

  const client = getClient();

  client.setCredentials({
    access_token: googleTokens.data.google_access_token,
    refresh_token: googleTokens.data.google_refresh_token,
  });

  // Save tokens if they change
  client.on(
    'tokens',
    onGoogleClientTokens({ googleBlobRepository, user_uuid })
  );

  const create = await client.request({
    url: 'https://photospicker.googleapis.com/v1/sessions',
    method: 'POST',
  });

  const createResponse = GooglePickingSessionResponseSchema.parse(create.data);

  await googleBlobRepository.setGooglePickSession({
    user_uuid: user_uuid,
    google_pick_session_id: createResponse.id,
    google_pick_session_done: false,
  });

  return NextResponse.json({
    success: true,
    id: createResponse.id,
    pickerUri: createResponse.pickerUri,
  });
}
