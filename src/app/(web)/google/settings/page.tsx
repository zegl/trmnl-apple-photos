import { GoogleBlobRepository } from '@/google/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import FullScreenMessage from '@/app/FullScreenMessage';

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Client from './Client';
import { getDynamoDBClient } from '@/dynamodb';

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

  const dynamoDBClient = getDynamoDBClient();
  const googleBlobRepository = new GoogleBlobRepository(dynamoDBClient);

  const user = await googleBlobRepository.getUserBlob(uuid);
  if (!user.success) {
    console.log('user', user);
    return <FullScreenMessage message="User not found :-(" />;
  }

  const backToTrmnlUrl = `https://usetrmnl.com/plugin_settings/${user.data.user.plugin_setting_id}/edit?force_refresh=true`;

  return (
    <div className="flex flex-col gap-4 w-full">
      <Suspense fallback={<div>Loading...</div>}>
        <Client
          user_uuid={uuid}
          backToTrmnlUrl={backToTrmnlUrl}
          user={user.data}
        />
      </Suspense>
    </div>
  );
}
