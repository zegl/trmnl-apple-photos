import type { AppleBlobRepository } from '@/apple/blobs';
import { crawlAlbum } from '@/apple/crawl';
import type { Result } from '@/result';
import {
  fetchPublicAlbumWebAsset,
  getPublicAlbumId,
  type PublicAlbumWebStream,
} from '@/apple/apple-public-album';
import sharp from 'sharp';

type ImageResult = Result<{
  url: string;
}>;

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

  const derivatives = Object.values(randomPhoto.derivatives);
  const preferred = derivatives.filter((d) => {
    const w = Number.parseInt(d.width);
    return w >= 800 && w <= 2000;
  });
  const largestOf = (arr: typeof derivatives) =>
    arr.reduce((a, b) =>
      Number.parseInt(a.width) > Number.parseInt(b.width) ? a : b
    );
  const largestDerivative =
    preferred.length > 0 ? largestOf(preferred) : largestOf(derivatives);

  const item = webAsset.items[largestDerivative.checksum];
  const imageUrl = `https://${item.url_location}${item.url_path}`;

  // Fetch the image server-side and convert to base64 JPEG data URI.
  // This avoids issues with: URL expiry, unsupported formats (HEIC), and
  // race conditions where the renderer screenshots before the image loads.
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    return {
      success: false,
      error: `Failed to fetch image: ${imageResponse.status}`,
    };
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const jpegBuffer = await sharp(imageBuffer)
    .resize(1872, 1404, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 60 })
    .toBuffer();
  const base64 = jpegBuffer.toString('base64');
  const url = `data:image/jpeg;base64,${base64}`;

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
