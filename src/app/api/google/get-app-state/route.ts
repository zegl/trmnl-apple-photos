import { getAuthURL, getClient } from '@/google/auth';
import { GoogleBlobRepository } from '@/google/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AppState } from './type';
import { listImagesInAlbum } from '@/google/album';
import { Credentials } from 'google-auth-library';
import { onGoogleClientTokens } from '@/google/auth-refresher';

const GooglePickingSessionResponseSchema = z.object({
  id: z.string(),
  pickerUri: z.string().optional(),
  mediaItemsSet: z.boolean(),
  pollingConfig: z
    .object({
      pollInterval: z.string(),
    })
    .optional(),
});

export async function POST(request: Request): Promise<NextResponse<AppState>> {
  const body = await request.json();
  const { user_uuid } = body;

  if (!user_uuid) {
    return NextResponse.json(
      { state: 'error', error: 'Missing user_uuid' },
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
      { state: 'not-connected', signInUrl: getAuthURL({ user_uuid }) },
      { status: 200 }
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

  const googlePickSession =
    await googleBlobRepository.getGooglePickSession(user_uuid);

  if (
    !googlePickSession.success ||
    !googlePickSession.data.google_pick_session_id
  ) {
    return NextResponse.json({
      state: 'connected-no-pictures',
    });
  }

  if (googlePickSession.data.google_pick_session_done) {
    const mediaItems = await listImagesInAlbum({
      client,
      google_pick_session_id: googlePickSession.data.google_pick_session_id,
    });

    if (!mediaItems.success) {
      if (mediaItems.error.includes('invalid_grant')) {
        return NextResponse.json(
          { state: 'not-connected', signInUrl: getAuthURL({ user_uuid }) },
          { status: 200 }
        );
      }

      if (
        mediaItems.error.includes('Access to the requested session has expired')
      ) {
        return NextResponse.json({
          state: 'connected-no-pictures',
        });
      }

      return NextResponse.json(
        { state: 'error', error: mediaItems.error },
        { status: 500 }
      );
    }

    const imageCount = mediaItems.data.filter(
      (item) => item.type === 'PHOTO'
    ).length;

    return NextResponse.json(
      { state: 'connected-pictures', imageCount },
      { status: 200 }
    );
  }

  const getPickSession = await client.request({
    url: `https://photospicker.googleapis.com/v1/sessions/${googlePickSession.data.google_pick_session_id}`,
    method: 'GET',
  });

  const getPickSessionResponse = GooglePickingSessionResponseSchema.safeParse(
    getPickSession.data
  );

  if (!getPickSessionResponse.success) {
    console.error(
      'Failed to parse get pick session response',
      getPickSessionResponse.error
    );
    return NextResponse.json(
      { state: 'error', error: 'Failed to parse get pick session response' },
      { status: 500 }
    );
  }

  if (getPickSessionResponse.data.mediaItemsSet) {
    await googleBlobRepository.setGooglePickSession({
      user_uuid: user_uuid,
      google_pick_session_id: getPickSessionResponse.data.id,
      google_pick_session_done: true,
    });
    return NextResponse.json(
      { state: 'connected-pictures', imageCount: 0 },
      { status: 200 }
    );
  }

  return NextResponse.json({
    state: 'connected-picking',
    pickerUri: getPickSessionResponse.data.pickerUri ?? '',
  });
}
