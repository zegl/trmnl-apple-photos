import {
  SettingsSchema,
  Settings,
  UserBlobSchema,
  UserBlob,
} from './app/settings/types';

const baseUrl = 'https://2yaxofh7gqnbsbms.public.blob.vercel-storage.com/';

export const getUserBlobName = (uuid: string) => {
  return `trmnl-apple-photos-${uuid}-user.json`;
};

export const getSettingsBlobName = (uuid: string) => {
  return `trmnl-apple-photos-${uuid}-settings.json`;
};

export const getUserBlob = async (uuid: string): Promise<UserBlob> => {
  try {
    const path = getUserBlobName(uuid);
    const url = baseUrl + path;
    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();
    return UserBlobSchema.parse(data);
  } catch (error) {
    console.error('Error getting user blob', error);
    throw error;
  }
};

export const getUserSettings = async (
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
