import { GoogleBlobRepository } from '@/google/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import FullScreenMessage from '@/app/FullScreenMessage';
import { getAuthURL } from '@/google/auth';

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Client, { AppState } from './Client';

export const metadata: Metadata = {
  title: 'Google Photos for TRMNL',
  description: 'Display images from Google Photos on TRMNL',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const uuid = (await searchParams).uuid;
  if (!uuid) {
    return <FullScreenMessage message="Bad Request: No UUID" />;
  }
  if (typeof uuid !== 'string') {
    return <FullScreenMessage message="Bad Request: UUID is not a string" />;
  }

  const supabaseClient = getSupabaseClientForUser(uuid);
  const googleBlobRepository = new GoogleBlobRepository(supabaseClient);

  const user = await googleBlobRepository.getUserBlob(uuid);
  if (!user.success) {
    return <FullScreenMessage message="User not found :-(" />;
  }

  const googleTokens = await googleBlobRepository.getGoogleTokens(uuid);

  let appState: AppState;

  if (googleTokens.success) {
    appState = {
      state: 'connected-no-pictures',
      user_uuid: uuid,
    };

    const googlePickSessionId =
      await googleBlobRepository.getGooglePickSessionId(uuid);
    if (
      googlePickSessionId.success &&
      googlePickSessionId.data.google_pick_session_id
    ) {
      appState = {
        state: 'connected-pictures',
        user_uuid: uuid,
      };
    }
  } else {
    appState = {
      state: 'not-connected',
      signInUrl: getAuthURL({ user_uuid: uuid }),
      user_uuid: uuid,
    };
  }

  appState = {
    state: 'not-connected',
    signInUrl: getAuthURL({ user_uuid: uuid }),
    user_uuid: uuid,
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <p>
        Hello <strong className="text-gray-900">{user.data.user.name}</strong>,
        let's get you set up!
      </p>

      <Suspense fallback={<div>Loading...</div>}>
        <Client appState={appState} />
      </Suspense>
    </div>
  );
}
