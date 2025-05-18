import {
  SettingsSchema,
  Settings,
  UserBlobSchema,
  UserBlob,
} from './app/settings/types';
import { supabase } from './supabase';

const baseUrl = 'https://2yaxofh7gqnbsbms.public.blob.vercel-storage.com/';

export const getUserBlobName = (uuid: string) => {
  return `trmnl-apple-photos-${uuid}-user.json`;
};

export const getSettingsBlobName = (uuid: string) => {
  return `trmnl-apple-photos-${uuid}-settings.json`;
};

export const getUserBlobFromVercel = async (
  uuid: string
): Promise<UserBlob | undefined> => {
  try {
    const path = getUserBlobName(uuid);
    const url = baseUrl + path;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      return undefined;
    }
    const data = await response.json();
    return UserBlobSchema.parse(data);
  } catch (error) {
    console.error('Error getting user blob', error);
    throw error;
  }
};

const migrateUserBlobFromVercel = async (
  uuid: string
): Promise<UserBlob | undefined> => {
  const vercelBlob = await getUserBlobFromVercel(uuid);
  if (!vercelBlob) {
    return;
  }

  await supabase
    .from('trmnl_apple_photos')
    .upsert({ id: uuid, user: vercelBlob }, { onConflict: 'id' });

  return vercelBlob;
};

export const getUserBlob = async (
  uuid: string
): Promise<UserBlob | undefined> => {
  try {
    const { data, error } = await supabase
      .from('trmnl_apple_photos')
      .select('user')
      .eq('id', uuid)
      .single();

    if (error) {
      console.error('Error fetching from Supabase:', error);
      throw error;
    }

    if (!data.user) {
      return migrateUserBlobFromVercel(uuid);
    }

    return UserBlobSchema.parse(data.user);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'PGRST116'
    ) {
      return migrateUserBlobFromVercel(uuid);
    }

    // On not found, fallback to legacy implementation
    console.error('Error getting user blob from Supabase', error);
    // throw error;
    return undefined;
  }
};

export const saveUserBlob = async (uuid: string, user: UserBlob) => {
  await supabase
    .from('trmnl_apple_photos')
    .upsert({ id: uuid, user }, { onConflict: 'id' });
};

export const getUserSettingsFromVercel = async (
  uuid: string
): Promise<Settings | undefined> => {
  try {
    const path = getSettingsBlobName(uuid);
    const url = baseUrl + path;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      return undefined;
    }
    const data = await response.json();
    return SettingsSchema.parse(data);
  } catch (error) {
    return undefined;
  }
};

const migrateSettingsFromVercel = async (
  uuid: string
): Promise<Settings | undefined> => {
  const vercelSettings = await getUserSettingsFromVercel(uuid);
  if (!vercelSettings) {
    return;
  }

  await supabase
    .from('trmnl_apple_photos')
    .upsert({ id: uuid, settings: vercelSettings }, { onConflict: 'id' });

  return vercelSettings;
};

export const getUserSettings = async (
  uuid: string
): Promise<Settings | undefined> => {
  try {
    const { data, error } = await supabase
      .from('trmnl_apple_photos')
      .select('settings')
      .eq('id', uuid)
      .single();

    if (error) {
      console.error('Error fetching from Supabase:', error);
      throw error;
    }

    if (!data.settings) {
      return migrateSettingsFromVercel(uuid);
    }

    return SettingsSchema.parse(data.settings);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'PGRST116'
    ) {
      return migrateSettingsFromVercel(uuid);
    }

    console.error('Error getting user settings from Supabase', error);
    return undefined;
  }
};

export const saveUserSettings = async (uuid: string, settings: Settings) => {
  await supabase
    .from('trmnl_apple_photos')
    .upsert(
      { id: uuid, settings, updated_settings_at: new Date() },
      { onConflict: 'id' }
    );
};

export const setUninstalledAt = async (uuid: string) => {
  await supabase
    .from('trmnl_apple_photos')
    .update({ uninstalled_at: new Date() })
    .eq('id', uuid);
};

export const increaseRenderCount = async (uuid: string) => {
  // current count
  const { data: currentCount, error: currentCountError } = await supabase
    .from('trmnl_apple_photos')
    .select('render_count')
    .eq('id', uuid)
    .single();

  if (currentCountError) {
    console.error('Error fetching current render count', currentCountError);
    return;
  }

  const newCount = currentCount.render_count + 1;

  const { data, error } = await supabase
    .from('trmnl_apple_photos')
    .update({ render_count: newCount, last_render_at: new Date() })
    .eq('id', uuid);

  if (error) {
    console.error('Error increasing render count', error);
    throw error;
  }
};
