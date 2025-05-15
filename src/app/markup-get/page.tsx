import { getUserSettings } from '@/blobs';
import { z } from 'zod';

const getAlbumId = (sharedAlbumUrl: string) => {
  const albumId = sharedAlbumUrl.split('#')[1];
  return albumId;
};

const webStreamSchema = z.object({
  streamName: z.string(),
  photos: z.array(
    z.object({
      photoGuid: z.string(),
      derivatives: z.record(
        z.string(),
        z.object({
          fileSize: z.string(),
          checksum: z.string(),
          width: z.string(),
          height: z.string(),
        })
      ),
    })
  ),
});

type WebStream = z.infer<typeof webStreamSchema>;

const fetchWebStream = async (albumId: string): Promise<WebStream> => {
  const url = `https://p142-sharedstreams.icloud.com/${albumId}/sharedstreams/webstream`;
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      streamCtag: null,
    }),
  });
  const data = await response.json();
  return webStreamSchema.parse(data);
};

const webAssetSchema = z.object({
  items: z.record(
    z.string(),
    z.object({
      url_expiry: z.string(),
      url_location: z.string(),
      url_path: z.string(),
    })
  ),
});

type WebAsset = z.infer<typeof webAssetSchema>;

const fetchWebAsset = async (
  albumId: string,
  photoGuid: string
): Promise<WebAsset> => {
  const url = `https://p142-sharedstreams.icloud.com/${albumId}/sharedstreams/webasseturls`;
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      photoGuids: [photoGuid],
    }),
  });
  const data = await response.json();
  return webAssetSchema.parse(data);
};

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

  const settings = await getUserSettings(user_uuid);
  if (!settings) {
    return <div className="screen">The album is not set up yet.</div>;
  }

  const albumId = getAlbumId(settings.sharedAlbumUrl);
  const webStream = await fetchWebStream(albumId);

  const randomIndex = Math.floor(Math.random() * webStream.photos.length);

  const photo = webStream.photos[randomIndex];

  const webAsset = await fetchWebAsset(albumId, photo.photoGuid);

  // Largest derivative
  const largestDerivative = Object.values(photo.derivatives).reduce((a, b) => {
    return parseInt(a.width) > parseInt(b.width) ? a : b;
  });

  const item = webAsset.items[largestDerivative.checksum];
  const url = `https://${item.url_location}${item.url_path}`;

  return (
    <div
      className={`view view--${size}`}
      style={{
        overflow: 'hidden',
        justifyContent: 'center',
      }}
    >
      <img src={url} alt="Photo" className="image-dither" />

      <div
        style={{
          backdropFilter: 'grayscale(100%)',
          backgroundColor: 'rgba(255, 255, 255, 0.0)',
          height: '100%',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      ></div>
    </div>
  );
}
