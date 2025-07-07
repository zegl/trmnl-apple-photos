import { BlobRepository } from '@/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import FullScreenMessage from '@/app/FullScreenMessage';
import { getPhotos } from '@/app/photos';
import Render from '@/app/Render';
import LinkButton from '@/app/LinkButton';
import './trmnl-mini.css';

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
  const params = await searchParams;
  const user_uuid = params.user_uuid;
  if (!user_uuid) {
    return <FullScreenMessage message="Bad Request: No user_uuid" />;
  }
  if (typeof user_uuid !== 'string') {
    return (
      <FullScreenMessage message="Bad Request: user_uuid is not a string" />
    );
  }

  const size = params.size ?? 'full';
  if (typeof size !== 'string') {
    return <FullScreenMessage message="Bad Request: size is not a string" />;
  }

  const supabaseClient = getSupabaseClientForUser(user_uuid);
  const blobRepository = new BlobRepository(supabaseClient);

  const user = await blobRepository.getUserBlob(user_uuid);
  if (!user.success) {
    return <FullScreenMessage message="User not found :-(" />;
  }

  const photos = await getPhotos({
    blobRepository,
    user_uuid,
    crawl_if_missing: true,
  });
  if (!photos.success) {
    return <FullScreenMessage message={photos.error} />;
  }

  const crawlStatus = await blobRepository.getCrawlStatus(user_uuid);

  const lastUpdatedAt = crawlStatus.success
    ? crawlStatus.data.web_stream_blob_fetched_at
    : null;
  const lastUpdatedAtMessage = lastUpdatedAt
    ? `Album last updated at: ${lastUpdatedAt.toISOString().replace('T', ' ').slice(0, 16)} (UTC)`
    : '';

  const { url } = photos.data;

  const backToTrmnlUrl = `https://usetrmnl.com/plugin_settings/${user.data.user.plugin_setting_id}/edit?force_refresh=true`;

  return (
    <div className="flex flex-col gap-4">
      <p>
        Preview of your album, in the different plugin sizes. Reload the page to
        see a new picture.
      </p>

      <div className="flex flex-row gap-4">
        <LinkButton href={backToTrmnlUrl}>↩️ Back to TRMNL</LinkButton>

        <LinkButton href={`/settings?uuid=${user_uuid}`}>
          ⚙️ Plugin Settings
        </LinkButton>
      </div>

      {lastUpdatedAtMessage && <p>{lastUpdatedAtMessage}</p>}

      <h2 className="text-lg text-gray-500">full</h2>

      <div className="w-fit border-2 border-gray-300 rounded-md overflow-hidden">
        <Render url={url} size="full" />
      </div>

      <h2 className="text-lg text-gray-500">half_vertical</h2>
      <div className="w-fit border-2 border-gray-300 rounded-md overflow-hidden">
        <Render url={url} size="half_vertical" />
      </div>

      <h2 className="text-lg text-gray-500">half_horizontal</h2>
      <div className="w-fit border-2 border-gray-300 rounded-md overflow-hidden">
        <Render url={url} size="half_horizontal" />
      </div>

      <h2 className="text-lg text-gray-500">quadrant</h2>
      <div className="w-fit border-2 border-gray-300 rounded-md overflow-hidden">
        <Render url={url} size="quadrant" />
      </div>
    </div>
  );
}
