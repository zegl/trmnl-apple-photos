import {
  fetchPublicAlbumWebStream,
  getPublicAlbumId,
} from '@/app/apple-public-album';
import { BlobRepository } from '@/blobs';
import { getGenericSupabaseClient, getSupabaseClientForUser } from '@/supabase';
import { Hatchet, Priority, type TaskFn, type Context, RateLimitDuration, ConcurrencyLimitStrategy } from '@hatchet-dev/typescript-sdk';
import { Concurrency } from '@hatchet-dev/typescript-sdk/protoc/v1/workflows';

export const hatchet = Hatchet.init();

export type RefreshAlbumInput = {
  user_uuid: string;
  concurrency_group?: string;
};

export type RefreshAlbumOutput = {
  success: boolean;
  error?: string;
};

const refreshAlbumFn: TaskFn<RefreshAlbumInput, RefreshAlbumOutput> = async (input, ctx) => {
  const t0 = Date.now();

  const { user_uuid } = input;

  ctx.logger.info(`Refreshing album: ${JSON.stringify(input)}`);

  const supabase = getSupabaseClientForUser(user_uuid);

  const blobRepository = new BlobRepository(supabase);

  await blobRepository.setCrawlStatus({
    uuid: user_uuid,
    status: 'Refresh started',
  });

  const userSettings = await blobRepository.getUserSettings(user_uuid);
  if (!userSettings) {
    ctx.logger.error('The album has not been set up yet.');
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
    ctx.logger.error('No photos found in the shared album. :-/');
    await blobRepository.setCrawlStatus({
      uuid: user_uuid,
      status: 'Refresh failed, no photos found',
    });
    return {
      success: false,
      error: 'No photos found in the shared album. :-/',
    };
  }

  ctx.logger.info(`Fetched ${webStream.photos.length} photos`);

  await blobRepository.setCrawlStatus({
    uuid: user_uuid,
    status: 'Updated',
  });

  const t1 = Date.now();
  ctx.logger.info(`Refresh took ${t1 - t0}ms`);

  return {
    success: true,
  };
};

export const trmnlApplePhotosRefreshAlbum = hatchet.task({
  name: 'trmnl-apple-photos-refresh-album',
  retries: 2,
  executionTimeout: '10m',
  scheduleTimeout: '12h',
  concurrency: [
    {
      expression: 'input.user_uuid',
      maxRuns: 1,
      limitStrategy: ConcurrencyLimitStrategy.CANCEL_IN_PROGRESS
    }
  ],
  fn: refreshAlbumFn,
});

export const trmnlApplePhotosRefreshAlbumCron = hatchet.task({
  name: 'trmnl-apple-photos-refresh-album-cron',
  retries: 2,
  executionTimeout: '10m',
  scheduleTimeout: '12h',
  concurrency: [
    {
      expression: 'input.concurrency_group',
      maxRuns: 1,
      limitStrategy: ConcurrencyLimitStrategy.GROUP_ROUND_ROBIN
    }
  ],
  fn: refreshAlbumFn,
});

export const onCron = hatchet.workflow({
  name: 'trmnl-apple-photos-cron',
  on: {
    cron: '0 0 * * *', // once per day at midnight
  },
});

onCron.task({
  name: 'trigger-all',
  fn: async (_, ctx) => {
    const supabase = getGenericSupabaseClient();
    const blobRepository = new BlobRepository(supabase);
    const users = await blobRepository.listAlbumsToRefresh();

    if (!users.success) {
      throw new Error('Error listing all users', { cause: users.error });
    }
    for (const user of users.data) {
      await ctx.runNoWaitChild<RefreshAlbumInput, RefreshAlbumOutput>(
        trmnlApplePhotosRefreshAlbumCron,
        {
          user_uuid: user,
          concurrency_group: 'cron',
        },
        {
          priority: Priority.LOW,
        }
      );
    }
  },
});

async function main() {
  console.log('Registering worker');

  await hatchet.ratelimits.upsert({
    key: 'trmnl-apple-photos-refresh-album-cron',
    limit: 1,
    duration: RateLimitDuration.MINUTE,
  });

  const worker = await hatchet.worker('trmnl-apple-photos-worker', {
    workflows: [trmnlApplePhotosRefreshAlbum, trmnlApplePhotosRefreshAlbumCron, onCron],
    slots: 20,
  });

  console.log('Starting worker');

  await worker.start();
}

if (require.main === module) {
  main();
}
