import {
  fetchPublicAlbumWebStream,
  getPublicAlbumId,
} from '@/app/apple-public-album';
import { AppleBlobRepository } from '@/apple/blobs';
import { getDynamoDBClient, getS3Client } from '@/dynamodb';
import { getSupabaseClientForUser } from '@/supabase';

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

  const supabaseClient = getSupabaseClientForUser(user_uuid);
  const s3Client = getS3Client();
  const dynamodbClient = getDynamoDBClient();
  const appleBlobRepository = new AppleBlobRepository(
    dynamodbClient,
    supabaseClient,
    s3Client
  );

  await appleBlobRepository.setCrawlStatus({
    uuid: user_uuid,
    status: 'Refresh started',
  });

  const userSettings = await appleBlobRepository.getUserSettings(user_uuid);
  if (!userSettings.success) {
    logger.error('The album has not been set up yet.');
    await appleBlobRepository.setCrawlStatus({
      uuid: user_uuid,
      status: 'Refresh failed, album not set up',
    });
    return {
      success: false,
      error: 'The album has not been set up yet.',
    };
  }

  const getPartitionAndWebStreamResult =
    await appleBlobRepository.getPartitionAndWebStream(user_uuid);
  let request_partition = 'p123';
  if (
    getPartitionAndWebStreamResult.success &&
    getPartitionAndWebStreamResult.data.apple_partition
  ) {
    request_partition = getPartitionAndWebStreamResult.data.apple_partition;
  }

  const albumId = getPublicAlbumId(userSettings.data.sharedAlbumUrl);

  const { webStream, partition, notFound } = await fetchPublicAlbumWebStream(
    request_partition,
    albumId
  );

  await appleBlobRepository.setWebStreamStatus({
    uuid: user_uuid,
    web_stream_status: notFound ? 'not_found' : 'found',
  });

  await appleBlobRepository.setPartitionAndWebStream({
    uuid: user_uuid,
    apple_partition: partition,
    web_stream_blob: webStream,
  });

  if (webStream === undefined || webStream.photos.length === 0) {
    logger.error('No photos found in the shared album. :-/');
    await appleBlobRepository.setCrawlStatus({
      uuid: user_uuid,
      status: 'Refresh failed, no photos found',
    });
    return {
      success: false,
      error: 'No photos found in the shared album. :-/',
    };
  }

  logger.info(`Fetched ${webStream.photos.length} photos`);

  await appleBlobRepository.setCrawlStatus({
    uuid: user_uuid,
    status: 'Updated',
  });

  const t1 = Date.now();
  logger.info(`Refresh took ${t1 - t0}ms`);

  return {
    success: true,
  };
};
