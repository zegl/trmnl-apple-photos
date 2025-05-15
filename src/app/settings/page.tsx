import { Suspense } from 'react';
import { getUserBlob, getUserSettings } from '@/blobs';
import AlbumForm from './AlbumForm';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const uuid = (await searchParams).uuid;

  if (!uuid) {
    return <div>No UUID</div>;
  }
  if (typeof uuid !== 'string') {
    return <div>UUID is not a string</div>;
  }

  const user = await getUserBlob(uuid);
  const settings = await getUserSettings(uuid);

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
          <p>Hello {user.user.name}, let's get you set up.</p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <AlbumForm uuid={uuid} initialSettings={settings} />
        </Suspense>
      </div>
    </div>
  );
}
