import type { SupabaseClient } from '@supabase/supabase-js';
import { type UserBlob, UserBlobSchema } from '@/app/types';
import type { Result } from '../result';

const googlePhotosTableName = 'trmnl_google_photos';

export class GoogleBlobRepository {
  constructor(private readonly supabaseClient: SupabaseClient) {}

  getUserBlob = async (uuid: string): Promise<Result<UserBlob>> => {
    const { data, error } = await this.supabaseClient
      .from(googlePhotosTableName)
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
    const x = await this.supabaseClient
      .from(googlePhotosTableName)
      .upsert({ id: uuid, user }, { onConflict: 'id' });

    console.log('saveUserBlob', x);
  };

  setUninstalledAt = async (uuid: string) => {
    await this.supabaseClient
      .from(googlePhotosTableName)
      .update({ uninstalled_at: new Date() })
      .eq('id', uuid);
  };

  increaseRenderCount = async (uuid: string) => {
    // current count
    const { data: currentCount, error: currentCountError } =
      await this.supabaseClient
        .from(googlePhotosTableName)
        .select('render_count')
        .eq('id', uuid)
        .single();

    if (currentCountError) {
      console.error('Error fetching current render count', currentCountError);
      return;
    }

    const newCount = currentCount.render_count + 1;

    const { error } = await this.supabaseClient
      .from(googlePhotosTableName)
      .update({ render_count: newCount, last_render_at: new Date() })
      .eq('id', uuid);

    if (error) {
      console.error('Error increasing render count', error);
      throw error;
    }
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
    await this.supabaseClient
      .from(googlePhotosTableName)
      .update({
        google_access_token,
        // google_access_token_expires_at,
        google_scope,
      })
      .eq('id', user_uuid);
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
    await this.supabaseClient
      .from(googlePhotosTableName)
      .update({
        google_access_token,
        // google_access_token_expires_at,
        // google_scope,
      })
      .eq('id', user_uuid);
  };

  setGoogleRefreshToken = async ({
    user_uuid,
    google_refresh_token,
  }: {
    user_uuid: string;
    google_refresh_token: string;
  }) => {
    await this.supabaseClient
      .from(googlePhotosTableName)
      .update({ google_refresh_token })
      .eq('id', user_uuid);
  };

  getGoogleTokens = async (
    user_uuid: string
  ): Promise<
    Result<{
      google_access_token: string | null;
      google_refresh_token: string | null;
    }>
  > => {
    const { data, error } = await this.supabaseClient
      .from(googlePhotosTableName)
      .select('google_access_token, google_refresh_token')
      .eq('id', user_uuid)
      .single();

    if (error) {
      console.error('Error fetching Google tokens', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: {
        google_access_token: data.google_access_token ?? null,
        google_refresh_token: data.google_refresh_token ?? null,
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
    await this.supabaseClient
      .from(googlePhotosTableName)
      .update({ google_album_id, google_album_url })
      .eq('id', user_uuid);
  };

  getGoogleAlbum = async (
    user_uuid: string
  ): Promise<
    Result<{ google_album_id: string | null; google_album_url: string | null }>
  > => {
    const { data, error } = await this.supabaseClient
      .from(googlePhotosTableName)
      .select('google_album_id, google_album_url')
      .eq('id', user_uuid)
      .single();

    if (error) {
      console.error('Error fetching Google album', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: {
        google_album_id: data.google_album_id ?? null,
        google_album_url: data.google_album_url ?? null,
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
    await this.supabaseClient
      .from(googlePhotosTableName)
      .update({ google_pick_session_id, google_pick_session_done })
      .eq('id', user_uuid);
  };

  getGooglePickSession = async (
    user_uuid: string
  ): Promise<
    Result<{
      google_pick_session_id: string | null;
      google_pick_session_done: boolean;
    }>
  > => {
    const { data, error } = await this.supabaseClient
      .from(googlePhotosTableName)
      .select('google_pick_session_id, google_pick_session_done')
      .eq('id', user_uuid)
      .single();

    if (error) {
      console.error('Error fetching Google pick session id', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: {
        google_pick_session_id: data.google_pick_session_id ?? null,
        google_pick_session_done: data.google_pick_session_done ?? false,
      },
    };
  };
}
