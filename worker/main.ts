import {
  fetchPublicAlbumWebAsset,
  fetchPublicAlbumWebStream,
  getPublicAlbumId,
} from '@/app/apple-public-album';
import { BlobRepository } from '@/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import { Hatchet } from '@hatchet-dev/typescript-sdk';

export const hatchet = Hatchet.init();

export type RefreshAlbumInput = {
  user_uuid: string;
};

export const trmnlApplePhotosRefreshAlbum = hatchet.task({
  name: 'trmnl-apple-photos:refresh-album',
  retries: 1,
  fn: async (input: RefreshAlbumInput) => {
    const { user_uuid } = input;
    console.log(`Refreshing album ${user_uuid}`);

    const supabase = getSupabaseClientForUser(user_uuid);

    const blobRepository = new BlobRepository(supabase);

    const userSettings = await blobRepository.getUserSettings(user_uuid);
    if (!userSettings) {
      return {
        success: false,
        error: 'The album has not been set up yet.',
      };
    }

    const getPartitionAndWebStreamResult =
      await blobRepository.getPartitionAndWebStream(user_uuid);
    let request_partition = 'p123';
    if (
      getPartitionAndWebStreamResult.success &&
      getPartitionAndWebStreamResult.data.apple_partition
    ) {
      request_partition = getPartitionAndWebStreamResult.data.apple_partition;
    }

    const albumId = getPublicAlbumId(userSettings.sharedAlbumUrl);

    const { webStream, partition } = await fetchPublicAlbumWebStream(
      request_partition,
      albumId
    );

    await blobRepository.setPartitionAndWebStream({
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

    const allImageUrls: string[] = [];

    // Crawl all images
    for (const photo of webStream.photos) {
      const webAsset = await fetchPublicAlbumWebAsset(
        partition,
        albumId,
        photo.photoGuid
      );
      console.log({ guid: photo.photoGuid, webAsset });

      // Largest derivative
      const largestDerivative = Object.values(photo.derivatives).reduce(
        (a, b) => {
          return Number.parseInt(a.width) > Number.parseInt(b.width) ? a : b;
        }
      );

      const item = webAsset.items[largestDerivative.checksum];
      const url = `https://${item.url_location}${item.url_path}`;
      allImageUrls.push(url);
    }

    await blobRepository.setPhotos({
      uuid: user_uuid,
      photos: {
        urls: allImageUrls,
      },
    });

    console.log(`Found ${allImageUrls.length} images`);

    return {
      success: true,
      data: {
        urls: allImageUrls,
      },
    };
  },
});

async function main() {
  console.log('Registering worker');

  const worker = await hatchet.worker('trmnl-apple-photos-worker', {
    workflows: [trmnlApplePhotosRefreshAlbum],
    slots: 10,
  });

  console.log('Starting worker');

  await worker.start();
}

if (require.main === module) {
  main();
}
