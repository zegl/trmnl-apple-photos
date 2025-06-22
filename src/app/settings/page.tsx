import { Suspense } from 'react';
import { BlobRepository } from '@/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import FullScreenMessage from '../FullScreenMessage';
import AlbumForm from './AlbumForm';

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
    <div
      className="screen"
      style={{
        background: 'white',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '100%',
        }}
      >
        <div>
          <h1>Settings</h1>
          <p>Hello {user.data.user.name}, let's get you set up.</p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <AlbumForm
            uuid={uuid}
            initialSettings={initialSettings}
            user={user.data}
          />
        </Suspense>
      </div>
    </div>
  );
}
