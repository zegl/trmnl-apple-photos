import { Credentials } from 'google-auth-library';
import { GoogleBlobRepository } from './blobs';

export const onGoogleClientTokens =
  ({
    googleBlobRepository,
    user_uuid,
  }: {
    googleBlobRepository: GoogleBlobRepository;
    user_uuid: string;
  }) =>
  async (tokens: Credentials) => {
    if (tokens.refresh_token) {
      await googleBlobRepository.setGoogleRefreshToken({
        user_uuid,
        google_refresh_token: tokens.refresh_token,
      });
    }
    if (tokens.access_token) {
      await googleBlobRepository.setGoogleAccessToken({
        user_uuid,
        google_access_token: tokens.access_token,
      });
    }
  };
