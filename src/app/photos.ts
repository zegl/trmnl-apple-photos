import type { AppleBlobRepository } from '@/apple/blobs';
import { crawlAlbum } from '@/apple/crawl';
import type { Result } from '@/result';
import {
  fetchPublicAlbumWebAsset,
  fetchPublicAlbumWebStream,
  getPublicAlbumId,
  type PublicAlbumWebStream,
} from './apple-public-album';
import type { AppleSettings } from '@/apple/types';

type ImageResult = Result<{
  url: string;
}>;

const _tryCrawlNewImage = async ({
  appleBlobRepository,
  user_uuid,
  settings,
}: {
  appleBlobRepository: AppleBlobRepository;
  user_uuid: string;
  settings: AppleSettings;
}): Promise<ImageResult> => {
  const getPartitionAndWebStreamResult =
    await appleBlobRepository.getPartitionAndWebStream(user_uuid);
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

  await appleBlobRepository.setPartitionAndWebStream({
    uuid: user_uuid,
    apple_partition: partition,
    web_stream_blob: webStream,
  });

  if (!webStream || webStream.photos.length === 0) {
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

export const getRandomPhotoFromWebStream = async ({
  partition,
  albumId,
  web_stream_blob,
}: {
  partition: string;
  albumId: string;
  web_stream_blob: PublicAlbumWebStream;
}): Promise<ImageResult> => {
  const photos = web_stream_blob.photos
    .filter((photo) => photo.mediaAssetType !== 'video')
    .filter((photo) => Object.keys(photo.derivatives).length > 0);
  // .filter(
  //   (photo) =>
  //     photo.width !== undefined &&
  //     Number.parseInt(photo.width) > 100 &&
  //     photo.height !== undefined &&
  //     Number.parseInt(photo.height) > 100
  // );

  if (photos.length === 0) {
    return {
      success: false,
      error: 'No photos found in the shared album. :-/',
    };
  }

  const randomIndex = Math.floor(Math.random() * photos.length);
  const randomPhoto = photos[randomIndex];

  const webAsset = await fetchPublicAlbumWebAsset(
    partition,
    albumId,
    randomPhoto.photoGuid
  );

  const largestDerivative = Object.values(randomPhoto.derivatives).reduce(
    (a, b) => {
      return Number.parseInt(a.width) > Number.parseInt(b.width) ? a : b;
    }
  );

  const item = webAsset.items[largestDerivative.checksum];
  const url = `https://${item.url_location}${item.url_path}`;

  return {
    success: true,
    data: {
      url,
    },
  };
};

export const getPhotos = async ({
  appleBlobRepository,
  user_uuid,
  crawl_if_missing,
}: {
  appleBlobRepository: AppleBlobRepository;
  user_uuid: string;
  crawl_if_missing: boolean;
}): Promise<ImageResult> => {
  const settings = await appleBlobRepository.getUserSettings(user_uuid);
  if (!settings.success) {
    return {
      success: false,
      error: 'The album has not been set up yet.',
    };
  }

  // If we have a web stream blob, use it to get a random photo
  const webStreamResult =
    await appleBlobRepository.getPartitionAndWebStream(user_uuid);

  if (
    webStreamResult.success &&
    webStreamResult.data.apple_partition &&
    webStreamResult.data.web_stream_blob
  ) {
    const imageFromCachedWebStream = await getRandomPhotoFromWebStream({
      partition: webStreamResult.data.apple_partition,
      albumId: getPublicAlbumId(settings.data.sharedAlbumUrl),
      web_stream_blob: webStreamResult.data.web_stream_blob,
    });
    console.log('imageFromCachedWebStream', imageFromCachedWebStream);
    if (imageFromCachedWebStream.success) {
      return imageFromCachedWebStream;
    }
    return {
      success: false,
      error: imageFromCachedWebStream.error,
    };
  }

  // Try on-demand crawl
  if (crawl_if_missing) {
    const crawlResult = await crawlAlbum({
      user_uuid,
      logger: {
        info: console.log,
        error: console.error,
      },
    });

    if (crawlResult.success) {
      return await getPhotos({
        appleBlobRepository,
        user_uuid,
        crawl_if_missing: false,
      });
    }
  }

  return {
    success: false,
    error:
      'No photos found. If you recently added this album, please wait a few minutes and try again.',
  };
};
