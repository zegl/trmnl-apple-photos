import { Suspense } from 'react';
import { AppleBlobRepository } from '@/apple/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import FullScreenMessage from '@/app/FullScreenMessage';
import AlbumForm from './AlbumForm';

import type { Metadata } from 'next';
import { getDynamoDBClient, getS3Client } from '@/dynamodb';

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
  const s3Client = getS3Client();
  const dynamodbClient = getDynamoDBClient();
  const appleBlobRepository = new AppleBlobRepository(
    dynamodbClient,
    supabaseClient,
    s3Client
  );

  const user = await appleBlobRepository.getUserBlob(uuid);
  if (!user.success) {
    return <FullScreenMessage message="User not found :-(" />;
  }

  const settings = await appleBlobRepository.getUserSettings(uuid);

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
