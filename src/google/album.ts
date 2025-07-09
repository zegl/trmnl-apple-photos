import { Result } from '@/result';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';

const GoogleMediaItemsResponseSchema = z.object({
  mediaItems: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['PHOTO', 'VIDEO', 'TYPE_UNSPECIFIED']),
      mediaFile: z.object({
        baseUrl: z.string(),
      }),
    })
  ),
  nextPageToken: z.string().optional(),
});

export type GoogleMediaItemsResponse = z.infer<
  typeof GoogleMediaItemsResponseSchema
>;

export type MediaItem = GoogleMediaItemsResponse['mediaItems'][number];

export const listImagesInAlbum = async ({
  client,
  google_pick_session_id,
}: {
  client: OAuth2Client;
  google_pick_session_id: string;
}): Promise<Result<MediaItem[]>> => {
  const mediaItems: MediaItem[] = [];
  let nextPageToken: string | undefined;

  while (true) {
    const url = `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${google_pick_session_id}&pageSize=100${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;

    console.log('url', url);
    const media = await client.request({
      url,
      method: 'GET',
    });

    console.log('media', media);

    const mediaItemsResponse = GoogleMediaItemsResponseSchema.safeParse(
      media.data
    );

    if (!mediaItemsResponse.success) {
      return { success: false, error: 'Failed to parse media items response' };
    }

    mediaItems.push(...mediaItemsResponse.data.mediaItems);

    nextPageToken = mediaItemsResponse.data.nextPageToken;

    if (!nextPageToken || mediaItemsResponse.data.mediaItems.length === 0) {
      break;
    }
  }

  return { success: true, data: mediaItems };
};
