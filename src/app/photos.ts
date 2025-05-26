import {
  getLastUsedUrl,
  getPartitionAndWebStream,
  getUserSettings,
  setLastUsedUrl,
  setPartitionAndWebStream,
} from '@/blobs';
import {
  fetchPublicAlbumWebAsset,
  fetchPublicAlbumWebStream,
  getPublicAlbumId,
} from './apple-public-album';
import type { Result } from '@/result';
import type { Settings } from './settings/types';

type ImageResult = Result<{
  url: string;
}>;

const tryCrawlNewImage = async ({
  user_uuid,
  settings,
}: { user_uuid: string; settings: Settings }): Promise<ImageResult> => {
  const getPartitionAndWebStreamResult =
    await getPartitionAndWebStream(user_uuid);
  let request_partition = 'p123';
  if (
    getPartitionAndWebStreamResult.success &&
    getPartitionAndWebStreamResult.data.apple_partition
  ) {
    request_partition = getPartitionAndWebStreamResult.data.apple_partition;
  }

  const albumId = getPublicAlbumId(settings.sharedAlbumUrl);

  const { webStream, partition } = await fetchPublicAlbumWebStream(
    request_partition,
    albumId
  );

  await setPartitionAndWebStream({
    uuid: user_uuid,
    apple_partition: partition,
    web_stream_blob: webStream,
  });

  if (webStream.photos.length === 0) {
    return {
      success: false,
      error: 'No photos found in the shared album. :-/',
    };
  }

  const randomIndex = Math.floor(Math.random() * webStream.photos.length);

  const photo = webStream.photos[randomIndex];

  const webAsset = await fetchPublicAlbumWebAsset(
    partition,
    albumId,
    photo.photoGuid
  );

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

export const getPhotos = async (user_uuid: string): Promise<ImageResult> => {
  const settings = await getUserSettings(user_uuid);
  if (!settings) {
    return {
      success: false,
      error: 'The album has not been set up yet.',
    };
  }

  const tryCrawlNewImageResult = await tryCrawlNewImage({
    user_uuid,
    settings,
  });
  if (tryCrawlNewImageResult.success) {
    await setLastUsedUrl({
      uuid: user_uuid,
      url: tryCrawlNewImageResult.data.url,
    });
    return tryCrawlNewImageResult;
  }

  // Fallback to last used url if crawl fails
  const lastUsedUrlResult = await getLastUsedUrl(user_uuid);
  if (lastUsedUrlResult.success) {
    return {
      success: true,
      data: {
        url: lastUsedUrlResult.data,
      },
    };
  }

  // Crawl failed and no last used url
  return {
    success: false,
    error: 'Fetching photos failed. :-(',
  };
};
