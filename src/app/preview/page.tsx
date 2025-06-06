import { BlobRepository } from '@/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import FullScreenMessage from '../FullScreenMessage';
import { getPhotos } from '../photos';
import Render from '../Render';

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
    ? crawlStatus.data.photos_updated_at
    : null;
  const lastUpdatedAtMessage = lastUpdatedAt
    ? `Album last updated at: ${lastUpdatedAt.toISOString().replace('T', ' ').slice(0, 16)} (UTC)`
    : '';

  const { url } = photos.data;

  const backToTrmnlUrl = `https://usetrmnl.com/plugin_settings/${user.data.user.plugin_setting_id}/edit?force_refresh=true`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '10px',
        background: '#eee',
      }}
    >
      <p>
        Preview of your album, in the different plugin sizes. Reload the page to
        see a new picture.
      </p>

      <a href={`/settings?uuid=${user_uuid}`} className="button">
        Plugin Settings
      </a>

      <a href={backToTrmnlUrl} className="button">
        Back to TRMNL
      </a>

      {lastUpdatedAtMessage && <p>{lastUpdatedAtMessage}</p>}

      <h1>full</h1>

      <div className="screen">
        <Render url={url} size="full" />
      </div>

      <h1>half_vertical</h1>
      <div className="screen">
        <Render url={url} size="half_vertical" />
      </div>

      <h1>half_horizontal</h1>
      <div className="screen">
        <Render url={url} size="half_horizontal" />
      </div>

      <h1>quadrant</h1>
      <div className="screen">
        <Render url={url} size="quadrant" />
      </div>
    </div>
  );
}
