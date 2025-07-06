import { Suspense } from 'react';
import { BlobRepository } from '@/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import FullScreenMessage from '../../FullScreenMessage';
import AlbumForm from './AlbumForm';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apple Photos for TRMNL',
  description: 'Display images from Apple Photos on TRMNL',
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
  const blobRepository = new BlobRepository(supabaseClient);

  const user = await blobRepository.getUserBlob(uuid);
  if (!user.success) {
    return <FullScreenMessage message="User not found :-(" />;
  }

  const settings = await blobRepository.getUserSettings(uuid);

  const initialSettings = settings.success ? settings.data : undefined;

  return (
    <div className="flex flex-col gap-4 w-full">
      <p>
        Hello <strong className="text-gray-900">{user.data.user.name}</strong>,
        let's get you set up!
      </p>

      <Suspense fallback={<div>Loading...</div>}>
        <AlbumForm
          uuid={uuid}
          initialSettings={initialSettings}
          user={user.data}
        />
      </Suspense>
    </div>
  );
}
