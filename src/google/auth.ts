import { OAuth2Client } from 'google-auth-library';

const getEnvOrThrow = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set.`);
  }
  return value;
};

const GOOGLE_CLIENT_ID = getEnvOrThrow('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = getEnvOrThrow('GOOGLE_CLIENT_SECRET');

export function getClient(): OAuth2Client {
  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    process.env.VERCEL === '1'
      ? 'https://trmnl-google-photos.vercel.app/api/google/oauth/google/callback'
      : 'http://localhost:3003/api/google/oauth/google/callback'
  );
}

export function getAuthURL({ user_uuid }: { user_uuid: string }) {
  const authorizeUrl = getClient().generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/photospicker.mediaitems.readonly'],
    state: user_uuid,
    prompt: 'consent', // this is required to get a refresh token
  });

  return authorizeUrl;
}
