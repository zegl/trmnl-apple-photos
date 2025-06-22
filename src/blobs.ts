import type { SupabaseClient } from '@supabase/supabase-js';
import {
  type PublicAlbumWebStream,
  webStreamSchema,
} from './app/apple-public-album';
import {
  type Settings,
  SettingsSchema,
  type UserBlob,
  UserBlobSchema,
} from './app/settings/types';
import type { Result } from './result';

const applePhotosTableName = 'trmnl_apple_photos';

type WebStreamStatus = 'not_found' | 'found' | 'error';

export class BlobRepository {
  constructor(private readonly supabaseClient: SupabaseClient) {}

  getUserBlob = async (uuid: string): Promise<Result<UserBlob>> => {
    const { data, error } = await this.supabaseClient
      .from(applePhotosTableName)
      .select('user')
      .eq('id', uuid)
      .single();

    if (error) {
      console.error('Error fetching user blob from Supabase', error);
      return {
        success: false,
        error: error.message,
      };
    }

    const parsed = UserBlobSchema.safeParse(data.user);

    if (parsed.success) {
      return {
        success: true,
        data: parsed.data,
      };
    }

    return {
      success: false,
      error: 'User blob not found',
    };
  };

  saveUserBlob = async (uuid: string, user: UserBlob) => {
    await this.supabaseClient
      .from(applePhotosTableName)
      .upsert({ id: uuid, user }, { onConflict: 'id' });
  };

  getUserSettings = async (uuid: string): Promise<Result<Settings>> => {
    const { data, error } = await this.supabaseClient
      .from(applePhotosTableName)
      .select('settings')
      .eq('id', uuid)
      .single();

    if (error) {
      console.error('Error fetching user settings from Supabase', error);
      return {
        success: false,
        error: error.message,
      };
    }

    const parsed = SettingsSchema.safeParse(data.settings);

    if (!parsed.success) {
      console.error(
        'Error parsing user settings (falling back to no settings)',
        parsed.error
      );
      return {
        success: false,
        error: parsed.error.message,
      };
    }

    return {
      success: true,
      data: parsed.data,
    };
  };

  saveUserSettings = async (uuid: string, settings: Settings) => {
    await this.supabaseClient
      .from(applePhotosTableName)
      .upsert(
        { id: uuid, settings, updated_settings_at: new Date() },
        { onConflict: 'id' }
      );
  };

  setUninstalledAt = async (uuid: string) => {
    await this.supabaseClient
      .from(applePhotosTableName)
      .update({ uninstalled_at: new Date() })
      .eq('id', uuid);
  };

  increaseRenderCount = async (uuid: string) => {
    // current count
    const { data: currentCount, error: currentCountError } =
      await this.supabaseClient
        .from(applePhotosTableName)
        .select('render_count')
        .eq('id', uuid)
        .single();

    if (currentCountError) {
      console.error('Error fetching current render count', currentCountError);
      return;
    }

    const newCount = currentCount.render_count + 1;

    const { error } = await this.supabaseClient
      .from(applePhotosTableName)
      .update({ render_count: newCount, last_render_at: new Date() })
      .eq('id', uuid);

    if (error) {
      console.error('Error increasing render count', error);
      throw error;
    }
  };

  setWebStreamStatus = async ({
    uuid,
    web_stream_status,
  }: {
    uuid: string;
    web_stream_status: WebStreamStatus;
  }) => {
    const { error } = await this.supabaseClient
      .from(applePhotosTableName)
      .update({ web_stream_status })
      .eq('id', uuid);

    if (error) {
      console.error('Error setting web stream status', error);
      throw error;
    }
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
    const { error } = await this.supabaseClient
      .from(applePhotosTableName)
      .update({
        apple_partition,
        web_stream_blob: web_stream_blob ?? null,
        web_stream_blob_fetched_at: new Date(),
      })
      .eq('id', uuid);

    if (error) {
      console.error('Error setting partition and web stream', error);
      throw error;
    }
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
    const { data, error } = await this.supabaseClient
      .from(applePhotosTableName)
      .select('apple_partition, web_stream_blob, web_stream_blob_fetched_at')
      .eq('id', uuid)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const parsed = webStreamSchema.safeParse(data.web_stream_blob);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.message,
      };
    }

    return {
      success: true,
      data: {
        apple_partition: data.apple_partition,
        web_stream_blob: parsed.data,
        web_stream_blob_fetched_at: data.web_stream_blob_fetched_at,
      },
    };
  };

  setLastUsedUrl = async ({ uuid, url }: { uuid: string; url: string }) => {
    const { error } = await this.supabaseClient
      .from(applePhotosTableName)
      .update({ last_used_url: url, last_used_url_updated_at: new Date() })
      .eq('id', uuid);

    if (error) {
      console.error('Error setting last used url', error);
      throw error;
    }
  };

  getLastUsedUrl = async (uuid: string): Promise<Result<string>> => {
    const { data, error } = await this.supabaseClient
      .from(applePhotosTableName)
      .select('last_used_url')
      .eq('id', uuid)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data.last_used_url,
    };
  };

  setCrawlStatus = async ({
    uuid,
    status,
  }: {
    uuid: string;
    status: string;
  }) => {
    const { error } = await this.supabaseClient
      .from(applePhotosTableName)
      .update({ crawl_status: status })
      .eq('id', uuid);

    if (error) {
      console.error('Error setting crawl status', error);
      throw error;
    }
  };

  getCrawlStatus = async (
    uuid: string
  ): Promise<
    Result<{ status: string; web_stream_blob_fetched_at: Date | null }>
  > => {
    const { data, error } = await this.supabaseClient
      .from(applePhotosTableName)
      .select('crawl_status, web_stream_blob_fetched_at')
      .eq('id', uuid)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: {
        status: data.crawl_status,
        web_stream_blob_fetched_at: data.web_stream_blob_fetched_at
          ? new Date(data.web_stream_blob_fetched_at)
          : null,
      },
    };
  };

  listAlbumsToRefresh = async (): Promise<Result<string[]>> => {
    const { data, error } = await this.supabaseClient
      .from(applePhotosTableName)
      .select('id')
      .is('uninstalled_at', null)
      .not('settings', 'is', null)
      .order('web_stream_blob_fetched_at', { ascending: true })
      .limit(10_000);

    if (error) {
      console.error('Error listing albums to refresh', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data.map((user) => user.id),
    };
  };
}
