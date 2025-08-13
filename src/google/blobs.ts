import type { Result } from '../result';
import { UserBlobSchema, type UserBlob } from '@/app/types';
import { Table } from 'dynamodb-toolbox/table';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { item, s } from 'dynamodb-toolbox/schema';
import { Entity } from 'dynamodb-toolbox/entity';
import { GetItemCommand } from 'dynamodb-toolbox/entity/actions/get';
import { PutItemCommand } from 'dynamodb-toolbox/entity/actions/put';
import {
  $add,
  UpdateItemCommand,
} from 'dynamodb-toolbox/entity/actions/update';

const googlePhotosSchema = item({
  id: s.string().key(),

  user: s.string().optional(),

  created_at: s.number().optional(),

  uninstalled_at: s.number().optional(),

  render_count: s.number().optional(),
  last_render_at: s.number().optional(),

  google_access_token: s.string().optional(),
  google_refresh_token: s.string().optional(),
  google_scope: s.string().optional(),
  google_album_id: s.string().optional(),
  google_album_url: s.string().optional(),

  google_pick_session_id: s.string().optional(),
  google_pick_session_done: s.boolean().optional(),
});

export class GoogleBlobRepository {
  private googlePhotosTable: Table;

  private googlePhotosEntity: Entity;

  constructor(private readonly dynamoDBClient: DynamoDBClient) {
    this.googlePhotosTable = new Table({
      name: 'trmnl_google_photos',
      partitionKey: { name: 'id', type: 'string' },
      documentClient: DynamoDBDocumentClient.from(dynamoDBClient),
    });

    this.googlePhotosEntity = new Entity({
      name: 'trmnl_google_photos',
      table: this.googlePhotosTable,
      schema: googlePhotosSchema,
      computeKey: ({ id }) => ({
        id: id,
      }),
    });
  }

  getUserBlob = async (uuid: string): Promise<Result<UserBlob>> => {
    const command = this.googlePhotosEntity
      .build(GetItemCommand)
      .key({ id: uuid })
      .options({
        consistent: true,
        attributes: ['user'],
      });

    const x = await command.send();
    if (!x.Item || !x.Item['user']) {
      return {
        success: false,
        error: 'User blob not found',
      };
    }

    const user = UserBlobSchema.safeParse(JSON.parse(x.Item['user'] as string));

    if (!user.success) {
      return {
        success: false,
        error: 'User blob is not valid: ' + user.error.message,
      };
    }

    return {
      success: true,
      data: user.data,
    };
  };

  createUserBlob = async (uuid: string, user: UserBlob) => {
    const command = this.googlePhotosEntity.build(PutItemCommand).item({
      id: uuid,
      user: JSON.stringify(user),
    });

    console.log(command.params());

    await command.send();
  };

  setUninstalledAt = async (uuid: string) => {
    const command = this.googlePhotosEntity.build(UpdateItemCommand).item({
      id: uuid,
      uninstalled_at: Date.now(),
    });

    await command.send();

    // await this.supabaseClient
    //   .from(googlePhotosTableName)
    //   .update({ uninstalled_at: new Date() })
    // .eq('id', uuid);
  };

  increaseRenderCount = async (uuid: string) => {
    const command = this.googlePhotosEntity.build(UpdateItemCommand).item({
      id: uuid,
      // render_count: s.number().default(0).transform((x) => x + 1),
      render_count: $add(1),
      last_render_at: Date.now(),
    });

    await command.send();

    // // current count
    // const { data: currentCount, error: currentCountError } =
    //   await this.supabaseClient
    //     .from(googlePhotosTableName)
    //     .select('render_count')
    //     .eq('id', uuid)
    //     .single();

    // if (currentCountError) {
    //   console.error('Error fetching current render count', currentCountError);
    //   return;
    // }

    // const newCount = currentCount.render_count + 1;

    // const { error } = await this.supabaseClient
    //   .from(googlePhotosTableName)
    //   .update({ render_count: newCount, last_render_at: new Date() })
    //   .eq('id', uuid);

    // if (error) {
    //   console.error('Error increasing render count', error);
    //   throw error;
    // }
  };

  setGoogleTokens = async ({
    user_uuid,
    google_access_token,
    // google_access_token_expires_at,
    google_scope,
  }: {
    user_uuid: string;
    google_access_token: string;
    // google_access_token_expires_at: Date;
    google_scope: string;
  }) => {
    const command = this.googlePhotosEntity.build(UpdateItemCommand).item({
      id: user_uuid,
      google_access_token,
      google_scope,
    });

    await command.send();

    // await this.supabaseClient
    //   .from(googlePhotosTableName)
    //   .update({
    //     google_access_token,
    //     // google_access_token_expires_at,
    //     google_scope,
    //   })
    //   .eq('id', user_uuid);
  };

  setGoogleAccessToken = async ({
    user_uuid,
    google_access_token,
    // google_access_token_expires_at,
    // google_scope,
  }: {
    user_uuid: string;
    google_access_token: string;
    // google_access_token_expires_at: Date;
    // google_scope: string;
  }) => {
    const command = this.googlePhotosEntity.build(UpdateItemCommand).item({
      id: user_uuid,
      google_access_token,
    });

    await command.send();
    // await this.supabaseClient
    //   .from(googlePhotosTableName)
    //   .update({
    //     google_access_token,
    //     // google_access_token_expires_at,
    //     // google_scope,
    //   })
    //   .eq('id', user_uuid);
  };

  setGoogleRefreshToken = async ({
    user_uuid,
    google_refresh_token,
  }: {
    user_uuid: string;
    google_refresh_token: string;
  }) => {
    const command = this.googlePhotosEntity.build(UpdateItemCommand).item({
      id: user_uuid,
      google_refresh_token,
    });

    await command.send();
    // await this.supabaseClient
    //   .from(googlePhotosTableName)
    //   .update({ google_refresh_token })
    //   .eq('id', user_uuid);
  };

  getGoogleTokens = async (
    user_uuid: string
  ): Promise<
    Result<{
      google_access_token: string | null;
      google_refresh_token: string | null;
    }>
  > => {
    const command = this.googlePhotosEntity
      .build(GetItemCommand)
      .key({ id: user_uuid })
      .options({
        consistent: true,
        attributes: ['google_access_token', 'google_refresh_token'],
      });

    const x = await command.send();

    const google_access_token = x.Item?.google_access_token as string | null;
    const google_refresh_token = x.Item?.google_refresh_token as string | null;

    // const { data, error } = await this.supabaseClient
    //   .from(googlePhotosTableName)
    //   .select('google_access_token, google_refresh_token')
    //   .eq('id', user_uuid)
    //   .single();

    // if (error) {
    //   console.error('Error fetching Google tokens', error);
    //   return {
    //     success: false,
    //     error: error.message,
    //   };
    // }

    return {
      success: true,
      data: {
        google_access_token: google_access_token ?? null,
        google_refresh_token: google_refresh_token ?? null,
      },
    };
  };

  setGoogleAlbum = async ({
    user_uuid,
    google_album_id,
    google_album_url,
  }: {
    user_uuid: string;
    google_album_id: string;
    google_album_url: string;
  }) => {
    const command = this.googlePhotosEntity.build(UpdateItemCommand).item({
      id: user_uuid,
      google_album_id,
      google_album_url,
    });

    await command.send();

    // await this.supabaseClient
    //   .from(googlePhotosTableName)
    //   .update({ google_album_id, google_album_url })
    //   .eq('id', user_uuid);
  };

  getGoogleAlbum = async (
    user_uuid: string
  ): Promise<
    Result<{ google_album_id: string | null; google_album_url: string | null }>
  > => {
    const command = this.googlePhotosEntity
      .build(GetItemCommand)
      .key({ id: user_uuid })
      .options({
        consistent: true,
        attributes: ['google_album_id', 'google_album_url'],
      });

    const x = await command.send();

    const google_album_id = x.Item?.google_album_id as string | null;
    const google_album_url = x.Item?.google_album_url as string | null;

    // const { data, error } = await this.supabaseClient
    //   .from(googlePhotosTableName)
    //   .select('google_album_id, google_album_url')
    //   .eq('id', user_uuid)
    //   .single();

    // if (error) {
    //   console.error('Error fetching Google album', error);
    //   return {
    //     success: false,
    //     error: error.message,
    //   };
    // }

    return {
      success: true,
      data: {
        google_album_id: google_album_id ?? null,
        google_album_url: google_album_url ?? null,
      },
    };
  };

  setGooglePickSession = async ({
    user_uuid,
    google_pick_session_id,
    google_pick_session_done,
  }: {
    user_uuid: string;
    google_pick_session_id: string;
    google_pick_session_done: boolean;
  }) => {
    const command = this.googlePhotosEntity.build(UpdateItemCommand).item({
      id: user_uuid,
      google_pick_session_id,
      google_pick_session_done,
    });

    await command.send();
    // await this.supabaseClient
    //   .from(googlePhotosTableName)
    //   .update({ google_pick_session_id, google_pick_session_done })
    //   .eq('id', user_uuid);
  };

  getGooglePickSession = async (
    user_uuid: string
  ): Promise<
    Result<{
      google_pick_session_id: string | null;
      google_pick_session_done: boolean;
    }>
  > => {
    const command = this.googlePhotosEntity
      .build(GetItemCommand)
      .key({ id: user_uuid })
      .options({
        consistent: true,
        attributes: ['google_pick_session_id', 'google_pick_session_done'],
      });

    const x = await command.send();
    const google_pick_session_id = x.Item?.google_pick_session_id as
      | string
      | null;
    const google_pick_session_done = x.Item?.google_pick_session_done as
      | boolean
      | null;

    // if (error) {
    //   console.error('Error fetching Google pick session id', error);
    //   return {
    //     success: false,
    //     error: error.message,
    //   };
    // }

    return {
      success: true,
      data: {
        google_pick_session_id: google_pick_session_id ?? null,
        google_pick_session_done: google_pick_session_done ?? false,
      },
    };
  };
}
