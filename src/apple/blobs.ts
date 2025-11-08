import {
  type PublicAlbumWebStream,
  webStreamSchema,
} from './apple-public-album';
import { type AppleSettings, AppleSettingsSchema } from '@/apple/types';
import { type UserBlob, UserBlobSchema } from '@/app/types';
import type { Result } from '../result';
import { Table } from 'dynamodb-toolbox/table';
import type { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { item, s } from 'dynamodb-toolbox/schema';
import { Entity } from 'dynamodb-toolbox/entity';
import { GetItemCommand } from 'dynamodb-toolbox/entity/actions/get';
import { PutItemCommand } from 'dynamodb-toolbox/entity/actions/put';
import {
  $add,
  UpdateItemCommand,
} from 'dynamodb-toolbox/entity/actions/update';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ScanCommand } from 'dynamodb-toolbox/table/actions/scan';

const applePhotosTable = new Table({
  name: 'trmnl_apple_photos',
  partitionKey: { name: 'id', type: 'string' },
});

const applePhotosEntity = new Entity({
  name: 'trmnl_apple_photos',
  table: applePhotosTable,
  schema: item({
    id: s.string().key(),
    user: s.string().optional(),
    settings: s.string().optional(),
    uninstalled_at: s.number().optional(),
    updated_settings_at: s.number().optional(),
    render_count: s.number().optional(),
    last_render_at: s.number().optional(),
    apple_partition: s.string().optional(),
    web_stream_blob_fetched_at: s.number().optional(),
    crawl_status: s.string().optional(),
    web_stream_status: s.string().optional(),
  }),
});

const applePhotosTableName = 'trmnl_apple_photos';

type WebStreamStatus = 'not_found' | 'found' | 'error';

export class AppleBlobRepository {
  constructor(
    private readonly dynamoDBClient: DynamoDBClient,
    // private readonly supabaseClient: SupabaseClient,
    private readonly s3Client: S3Client
  ) {
    applePhotosTable.documentClient =
      DynamoDBDocumentClient.from(dynamoDBClient);
  }

  getUserBlob = async (uuid: string): Promise<Result<UserBlob>> => {
    const { Item } = await applePhotosEntity
      .build(GetItemCommand)
      .key({ id: uuid })
      .options({
        consistent: true,
        attributes: ['user'],
      })
      .send();

    if (!Item || !Item.user) {
      return {
        success: false,
        error: 'User blob not found xx',
      };
    }

    const user = UserBlobSchema.safeParse(JSON.parse(Item.user));

    if (!user.success) {
      return {
        success: false,
        error: `User blob is not valid: ${user.error.message}`,
      };
    }

    return {
      success: true,
      data: user.data,
    };
  };

  // migrateAllSupabaseUsersToDynamoDB = async (): Promise<void> => {
  //   let lastId = '';

  //   while (true) {
  //     const query = this.supabaseClient
  //       .from(applePhotosTableName)
  //       .select('id')
  //       .order('id', { ascending: true });

  //     if (lastId) {
  //       query.gt('id', lastId);
  //     }

  //     const { data: listData, error: listError } = await query.limit(5);

  //     if (listError) {
  //       throw listError;
  //     }

  //     console.log('listData', listData.length, lastId);

  //     if (listData.length === 0) {
  //       break;
  //     }
  //     lastId = listData[listData.length - 1].id;

  //     // Iterate and write to dynamodb
  //     for (const listUser of listData) {
  //       const { data: user, error } = await this.supabaseClient
  //         .from(applePhotosTableName)
  //         .select('*')
  //         .eq('id', listUser.id)
  //         .single();

  //       if (error) {
  //         console.error('Error fetching user', error);
  //         throw error;
  //       }

  //       console.log('Migrating user', listUser.id, {
  //         webStreamSize: JSON.stringify(user.web_stream_blob).length,
  //       });

  //       if (user.web_stream_blob) {
  //         const pubBlobCommand = new PutObjectCommand({
  //           Bucket: 'trmnl-apple-photos',
  //           Key: `${listUser.id}/web_stream_blob.json`,
  //           Body: JSON.stringify(user.web_stream_blob),
  //         });

  //         await this.s3Client.send(pubBlobCommand);
  //       }

  //       const command = applePhotosEntity.build(PutItemCommand).item({
  //         id: user.id,
  //         user: user.user ? JSON.stringify(user.user) : undefined,
  //         settings: user.settings ? JSON.stringify(user.settings) : undefined,
  //         uninstalled_at: user.uninstalled_at
  //           ? new Date(user.uninstalled_at).getTime()
  //           : undefined,
  //         updated_settings_at: user.updated_settings_at
  //           ? new Date(user.updated_settings_at).getTime()
  //           : undefined,
  //         render_count: user.render_count ?? 0,
  //         last_render_at: user.last_render_at
  //           ? new Date(user.last_render_at).getTime()
  //           : undefined,
  //         apple_partition: user.apple_partition ?? undefined,
  //         web_stream_blob_fetched_at: user.web_stream_blob_fetched_at
  //           ? new Date(user.web_stream_blob_fetched_at).getTime()
  //           : undefined,
  //         crawl_status: user.crawl_status ?? undefined,
  //         web_stream_status: user.web_stream_status ?? undefined,
  //       });
  //       await command.send();
  //     }
  //   }
  // };

  createUserBlob = async (uuid: string, user: UserBlob) => {
    const command = applePhotosEntity.build(PutItemCommand).item({
      id: uuid,
      user: JSON.stringify(user),
    });

    await command.send();
  };

  getUserSettings = async (uuid: string): Promise<Result<AppleSettings>> => {
    const command = applePhotosEntity
      .build(GetItemCommand)
      .key({ id: uuid })
      .options({
        consistent: true,
        attributes: ['settings'],
      });

    const x = await command.send();
    if (!x.Item || !x.Item.settings) {
      return {
        success: false,
        error: 'User settings not found',
      };
    }

    const user = AppleSettingsSchema.safeParse(JSON.parse(x.Item.settings));

    if (!user.success) {
      return {
        success: false,
        error: `User settings is not valid: ${user.error.message}`,
      };
    }

    return {
      success: true,
      data: user.data,
    };
  };

  saveUserSettings = async (uuid: string, settings: AppleSettings) => {
    const command = applePhotosEntity.build(UpdateItemCommand).item({
      id: uuid,
      settings: JSON.stringify(settings),
      updated_settings_at: Date.now(),
    });
    await command.send();
  };

  setUninstalledAt = async (uuid: string) => {
    const command = applePhotosEntity.build(UpdateItemCommand).item({
      id: uuid,
      uninstalled_at: Date.now(),
    });
    await command.send();
  };

  increaseRenderCount = async (uuid: string) => {
    const command = applePhotosEntity.build(UpdateItemCommand).item({
      id: uuid,
      render_count: $add(1),
      last_render_at: Date.now(),
    });
    await command.send();
  };

  setWebStreamStatus = async ({
    uuid,
    web_stream_status,
  }: {
    uuid: string;
    web_stream_status: WebStreamStatus;
  }) => {
    const command = applePhotosEntity.build(UpdateItemCommand).item({
      id: uuid,
      web_stream_status,
    });
    await command.send();
  };

  setPartitionAndWebStream = async ({
    uuid,
    apple_partition,
    web_stream_blob,
  }: {
    uuid: string;
    apple_partition: string;
    web_stream_blob: PublicAlbumWebStream | undefined;
  }) => {
    // Upload blob to S3 if present
    if (web_stream_blob) {
      const pubBlobCommand = new PutObjectCommand({
        Bucket: 'trmnl-apple-photos',
        Key: `${uuid}/web_stream_blob.json`,
        Body: JSON.stringify(web_stream_blob),
      });

      await this.s3Client.send(pubBlobCommand);
    }

    const command = applePhotosEntity.build(UpdateItemCommand).item({
      id: uuid,
      apple_partition,
      web_stream_blob_fetched_at: Date.now(),
    });
    await command.send();
  };

  getPartitionAndWebStream = async (
    uuid: string
  ): Promise<
    Result<{
      apple_partition: string | undefined;
      web_stream_blob: PublicAlbumWebStream;
      web_stream_blob_fetched_at: Date | undefined;
    }>
  > => {
    const { Item } = await applePhotosEntity
      .build(GetItemCommand)
      .key({ id: uuid })
      .options({
        consistent: true,
        attributes: ['apple_partition', 'web_stream_blob_fetched_at'],
      })
      .send();

    if (!Item) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Get blob from S3
    try {
      const getBlobCommand = new GetObjectCommand({
        Bucket: 'trmnl-apple-photos',
        Key: `${uuid}/web_stream_blob.json`,
      });

      const { Body } = await this.s3Client.send(getBlobCommand);
      const web_stream_blob = await Body?.transformToString();
      const parsed = webStreamSchema.safeParse(
        JSON.parse(web_stream_blob ?? '{}')
      );

      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error.message,
        };
      }

      return {
        success: true,
        data: {
          apple_partition: Item.apple_partition,
          web_stream_blob: parsed.data,
          web_stream_blob_fetched_at: Item.web_stream_blob_fetched_at
            ? new Date(Item.web_stream_blob_fetched_at)
            : undefined,
        },
      };
    } catch (e) {
      console.error('Error getting web stream blob', e);
      return {
        success: false,
        error: `Error getting web stream blob: ${e}`,
      };
    }
  };

  setCrawlStatus = async ({
    uuid,
    status,
  }: {
    uuid: string;
    status: string;
  }) => {
    const command = applePhotosEntity.build(UpdateItemCommand).item({
      id: uuid,
      crawl_status: status,
    });
    await command.send();
  };

  getCrawlStatus = async (
    uuid: string
  ): Promise<
    Result<{ status: string; web_stream_blob_fetched_at: Date | null }>
  > => {
    const { Item } = await applePhotosEntity
      .build(GetItemCommand)
      .key({ id: uuid })
      .options({
        consistent: true,
        attributes: ['crawl_status', 'web_stream_blob_fetched_at'],
      })
      .send();

    if (!Item) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    return {
      success: true,
      data: {
        status: Item.crawl_status ?? 'not_found',
        web_stream_blob_fetched_at: Item.web_stream_blob_fetched_at
          ? new Date(Item.web_stream_blob_fetched_at)
          : null,
      },
    };
  };

  listAlbumsToRefresh = async (): Promise<Result<string[]>> => {
    const command = applePhotosTable
      .build(ScanCommand)
      .entities(applePhotosEntity)
      .options({
        attributes: [
          'id',
          'uninstalled_at',
          'settings',
          'web_stream_blob_fetched_at',
        ],
      });

    let lastEvaluatedKey: Record<string, unknown> | undefined;

    const userIdsToRefresh: string[] = [];

    do {
      const page = await command
        .options({ exclusiveStartKey: lastEvaluatedKey })
        .send();

      const refreshableUsers = (page.Items ?? []).filter(
        (item) => item.uninstalled_at === null && item.settings !== null
      );
      userIdsToRefresh.push(
        ...refreshableUsers.map((item) => item.id as string)
      );

      lastEvaluatedKey = page.LastEvaluatedKey;
    } while (lastEvaluatedKey !== undefined);

    return {
      success: true,
      data: userIdsToRefresh,
    };
  };
}
