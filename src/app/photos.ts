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
import { getUserSettings } from '@/blobs';
import { z } from 'zod';

type Result<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

export const getPhotos = async (
  user_uuid: string
): Promise<
  Result<{
    url: string;
  }>
> => {
  const settings = await getUserSettings(user_uuid);
  if (!settings) {
    return {
      success: false,
      error: 'The album is not set up yet.',
    };
  }

  const albumId = getAlbumId(settings.sharedAlbumUrl);
  const webStream = await fetchWebStream(albumId);

  if (webStream.photos.length === 0) {
    return {
      success: false,
      error: 'No photos found in the shared album.',
    };
  }

  const randomIndex = Math.floor(Math.random() * webStream.photos.length);

  const photo = webStream.photos[randomIndex];

  const webAsset = await fetchWebAsset(albumId, photo.photoGuid);

  // Largest derivative
  const largestDerivative = Object.values(photo.derivatives).reduce((a, b) => {
    return parseInt(a.width) > parseInt(b.width) ? a : b;
  });

  const item = webAsset.items[largestDerivative.checksum];
  const url = `https://${item.url_location}${item.url_path}`;

  return {
    success: true,
    data: {
      url,
    },
  };
};

export const getAllUrls = async (
  user_uuid: string
): Promise<
  Result<{
    urls: string[];
  }>
> => {
  const settings = await getUserSettings(user_uuid);
  if (!settings) {
    return {
      success: false,
      error: 'The album is not set up yet.',
    };
  }

  const albumId = getAlbumId(settings.sharedAlbumUrl);
  const webStream = await fetchWebStream(albumId);

  if (webStream.photos.length === 0) {
    return {
      success: false,
      error: 'No photos found in the shared album.',
    };
  }

  const urls = [];

  for (const photo of webStream.photos) {
    const webAsset = await fetchWebAsset(albumId, photo.photoGuid);

    // Largest derivative
    const largestDerivative = Object.values(photo.derivatives).reduce(
      (a, b) => {
        return parseInt(a.width) > parseInt(b.width) ? a : b;
      }
    );

    const item = webAsset.items[largestDerivative.checksum];
    const url = `https://${item.url_location}${item.url_path}`;
    urls.push(url);
  }

  return {
    success: true,
    data: {
      urls,
    },
  };
};
