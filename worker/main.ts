import 'module-alias/register';
import path from 'path';
import moduleAlias from 'module-alias';

// Add path aliases
moduleAlias.addAliases({
  '@': path.join(__dirname, '../src'),
});

import {
  ConcurrencyLimitStrategy,
  Hatchet,
  Priority,
  RateLimitDuration,
  type TaskFn,
} from '@hatchet-dev/typescript-sdk';
import { AppleBlobRepository } from '@/apple/blobs';
import { crawlAlbum } from '@/apple/crawl';
import { getGenericSupabaseClient } from '@/supabase';

export const hatchet = Hatchet.init();

export type RefreshAlbumInput = {
  user_uuid: string;
  concurrency_group?: string;
};

export type RefreshAlbumOutput = {
  success: boolean;
  error?: string;
};

const refreshAlbumFn: TaskFn<RefreshAlbumInput, RefreshAlbumOutput> = async (
  input,
  ctx
) => {
  const { user_uuid } = input;
  return await crawlAlbum({
    user_uuid,
    logger: ctx.logger,
  });
};

export type RefreshAlbumBulkInput = {
  user_uuids: string[];
  concurrency_group: string;
};

export type RefreshAlbumBulkOutput = {
  success: boolean;
};

const refreshAlbumBulkFn: TaskFn<
  RefreshAlbumBulkInput,
  RefreshAlbumBulkOutput
> = async (input, ctx) => {
  const { user_uuids } = input;
  for (const user_uuid of user_uuids) {
    ctx.logger.info(`BULK: Refreshing album for user ${user_uuid}`);
    try {
      await crawlAlbum({
        user_uuid,
        logger: ctx.logger,
      });
      ctx.logger.info(
        `BULK: Successfully refreshed album for user ${user_uuid}`
      );
    } catch (error) {
      ctx.logger.error(
        `BULK: Error refreshing album for user ${user_uuid}: ${error}`
      );
    }
  }
  return { success: true };
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
      limitStrategy: ConcurrencyLimitStrategy.CANCEL_IN_PROGRESS,
    },
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
      limitStrategy: ConcurrencyLimitStrategy.GROUP_ROUND_ROBIN,
    },
  ],
  fn: refreshAlbumFn,
});

export const trmnlApplePhotosRefreshAlbumCronBulk = hatchet.task({
  name: 'trmnl-apple-photos-refresh-album-cron-bulk',
  retries: 2,
  executionTimeout: '6h',
  scheduleTimeout: '12h',
  concurrency: [
    {
      expression: 'input.concurrency_group',
      maxRuns: 1,
      limitStrategy: ConcurrencyLimitStrategy.GROUP_ROUND_ROBIN,
    },
  ],
  fn: refreshAlbumBulkFn,
});

const chunked = (arr: string[], size: number) => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
};

export const onCron = hatchet.workflow({
  name: 'trmnl-apple-photos-cron',
  onCrons: ['0 0 * * *'], // once per day at midnight
});

onCron.task({
  name: 'trigger-all',
  fn: async (_, ctx) => {
    const supabase = getGenericSupabaseClient();
    const appleBlobRepository = new AppleBlobRepository(supabase);
    const users = await appleBlobRepository.listAlbumsToRefresh();

    if (!users.success) {
      throw new Error('Error listing all users', { cause: users.error });
    }

    // Split into chunks of 100
    const chunks = chunked(users.data, 100);

    for (const chunk of chunks) {
      await ctx.runNoWaitChild<RefreshAlbumBulkInput, RefreshAlbumBulkOutput>(
        trmnlApplePhotosRefreshAlbumCronBulk,
        {
          user_uuids: chunk,
          concurrency_group: 'cron',
        },
        {
          priority: Priority.LOW,
        }
      );
    }
  },
});

const getHostname = () => {
  if (process.env.FLY_APP_NAME && process.env.FLY_MACHINE_ID) {
    return `${process.env.FLY_APP_NAME}-${process.env.FLY_MACHINE_ID}`;
  }
  return 'trmnl-apple-photos-worker';
};

async function main() {
  console.log('Registering worker');

  await hatchet.ratelimits.upsert({
    key: 'trmnl-apple-photos-refresh-album-cron',
    limit: 1,
    duration: RateLimitDuration.MINUTE,
  });

  const hostname = getHostname();

  const worker = await hatchet.worker(hostname, {
    workflows: [
      trmnlApplePhotosRefreshAlbum,
      trmnlApplePhotosRefreshAlbumCron,
      trmnlApplePhotosRefreshAlbumCronBulk,
      onCron,
    ],
    slots: 20,
  });

  console.log('Starting worker');

  await worker.start();
}

if (require.main === module) {
  main();
}
