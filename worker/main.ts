import {
  fetchPublicAlbumWebStream,
  getPublicAlbumId,
} from '@/app/apple-public-album';
import { BlobRepository } from '@/blobs';
import { getGenericSupabaseClient, getSupabaseClientForUser } from '@/supabase';
import { Hatchet, Priority } from '@hatchet-dev/typescript-sdk';

export const hatchet = Hatchet.init();

export type RefreshAlbumInput = {
  user_uuid: string;
};

export type RefreshAlbumOutput = {
  success: boolean;
  error?: string;
};

export const trmnlApplePhotosRefreshAlbum = hatchet.task({
  name: 'trmnl-apple-photos-refresh-album',
  retries: 2,
  executionTimeout: '10m',
  scheduleTimeout: '12h',
  fn: async (input: RefreshAlbumInput, ctx) => {
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

    return {
      success: true,
    };
  },
});

export const onCron = hatchet.workflow({
  name: 'trmnl-apple-photos-cron',
    on: {
      cron: '0 0 * * *' // once per day at midnight
    },
  });

onCron.task({
  name: 'trigger-all',
  fn: async (_, ctx) => {
    const supabase = getGenericSupabaseClient();
    const blobRepository = new BlobRepository(supabase);
    const users = await blobRepository.listAllUsers();

    if (!users.success) {
      throw new Error('Error listing all users', { cause: users.error });
    }

    // For each user, run the refresh album workflow
    for (const user of users.data) {
      await ctx.runNoWaitChild<RefreshAlbumInput, RefreshAlbumOutput>(trmnlApplePhotosRefreshAlbum, {
        user_uuid: user,
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

  const worker = await hatchet.worker('trmnl-apple-photos-worker', {
    workflows: [trmnlApplePhotosRefreshAlbum, onCron],
    slots: 2,
  });

  console.log('Starting worker');

  await worker.start();
}

if (require.main === module) {
  main();
}
