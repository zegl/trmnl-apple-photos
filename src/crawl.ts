import {
  fetchPublicAlbumWebStream,
  getPublicAlbumId,
} from './app/apple-public-album';
import { BlobRepository } from './blobs';
import { getSupabaseClientForUser } from './supabase';

export const crawlAlbum = async ({
  user_uuid,
  logger,
}: {
  user_uuid: string;
  logger: {
    info: (_: string) => void;
    error: (_: string) => void;
  };
}): Promise<{
  success: boolean;
  error?: string;
}> => {
  const t0 = Date.now();

  logger.info(`Refreshing album: ${JSON.stringify({ user_uuid })}`);

  const supabase = getSupabaseClientForUser(user_uuid);

  const blobRepository = new BlobRepository(supabase);

  await blobRepository.setCrawlStatus({
    uuid: user_uuid,
    status: 'Refresh started',
  });

  const userSettings = await blobRepository.getUserSettings(user_uuid);
  if (!userSettings) {
    logger.error('The album has not been set up yet.');
    await blobRepository.setCrawlStatus({
      uuid: user_uuid,
      status: 'Refresh failed, album not set up',
    });
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

  const { webStream, partition, notFound } = await fetchPublicAlbumWebStream(
    request_partition,
    albumId
  );

  await blobRepository.setWebStreamStatus({
    uuid: user_uuid,
    web_stream_status: notFound ? 'not_found' : 'found',
  });

  await blobRepository.setPartitionAndWebStream({
    uuid: user_uuid,
    apple_partition: partition,
    web_stream_blob: webStream,
  });

  if (webStream === undefined || webStream.photos.length === 0) {
    logger.error('No photos found in the shared album. :-/');
    await blobRepository.setCrawlStatus({
      uuid: user_uuid,
      status: 'Refresh failed, no photos found',
    });
    return {
      success: false,
      error: 'No photos found in the shared album. :-/',
    };
  }

  logger.info(`Fetched ${webStream.photos.length} photos`);

  await blobRepository.setCrawlStatus({
    uuid: user_uuid,
    status: 'Updated',
  });

  const t1 = Date.now();
  logger.info(`Refresh took ${t1 - t0}ms`);

  return {
    success: true,
  };
};
