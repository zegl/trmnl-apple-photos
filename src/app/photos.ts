import { getUserSettings } from '@/blobs';
import { fetchPublicAlbumWebAsset, fetchPublicAlbumWebStream, getPublicAlbumId } from './apple-public-album';

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
      error: 'The album has not been set up yet.',
    };
  }

  const albumId = getPublicAlbumId(settings.sharedAlbumUrl);

  const {webStream, partition} = await fetchPublicAlbumWebStream("p123", albumId);

  if (webStream.photos.length === 0) {
    return {
      success: false,
      error: 'No photos found in the shared album. :-/',
    };
  }

  const randomIndex = Math.floor(Math.random() * webStream.photos.length);

  const photo = webStream.photos[randomIndex];

  const webAsset = await fetchPublicAlbumWebAsset(partition, albumId, photo.photoGuid);

  // Largest derivative
  const largestDerivative = Object.values(photo.derivatives).reduce((a, b) => {
    return Number.parseInt(a.width) > Number.parseInt(b.width) ? a : b;
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
