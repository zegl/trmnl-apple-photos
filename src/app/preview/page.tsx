import Render from '../Render';
import { getPhotos } from '../photos';


export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const user_uuid = params.user_uuid;
  if (!user_uuid) {
    return <div>No user_uuid</div>;
  }
  if (typeof user_uuid !== 'string') {
    return <div>user_uuid is not a string</div>;
  }

  const size = params.size ?? 'full';
  if (typeof size !== 'string') {
    return <div>size is not a string</div>;
  }

  const photos = await getPhotos(user_uuid);
  if (!photos.success) {
    return <div className="screen">{photos.error}</div>;
  }

  const { url } = photos.data;

  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '10px',
  }}>
    <p>Preview of the photo, in the different plugin sizes.</p>

    <a href={`/settings?uuid=${user_uuid}`} className="button">
      Settings
    </a>

    <h1>full</h1>
    <Render url={url} size="full" />

    <h1>half_vertical</h1>
    <Render url={url} size="half_vertical" />

    <h1>half_horizontal</h1>
    <Render url={url} size="half_horizontal" />
    
    <h1>quadrant</h1>
    <Render url={url} size="quadrant" />
  </div>
}
