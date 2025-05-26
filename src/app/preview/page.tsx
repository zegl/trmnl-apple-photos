import { BlobRepository } from '@/blobs';
import FullScreenMessage from '../FullScreenMessage';
import Render from '../Render';
import { getPhotos } from '../photos';
import { getSupabaseClientForUser } from '@/supabase';

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
  if (!user) {
    return <FullScreenMessage message="User not found :-(" />;
  }

  const photos = await getPhotos({ blobRepository, user_uuid });
  if (!photos.success) {
    return <FullScreenMessage message={photos.error} />;
  }

  const { url } = photos.data;

  const backToTrmnlUrl = `https://usetrmnl.com/plugin_settings/${user.user.plugin_setting_id}/edit?force_refresh=true`;

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
