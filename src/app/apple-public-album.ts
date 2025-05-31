import { z } from 'zod';

export const getPublicAlbumId = (sharedAlbumUrl: string) => {
  const albumId = sharedAlbumUrl.split('#')[1];
  return albumId;
};

const webStreamDerivativeSchema = z.object({
  fileSize: z.string(),
  checksum: z.string(),
  width: z.string(),
  height: z.string(),
});

export const webStreamSchema = z.object({
  streamName: z.string(),
  photos: z.array(
    z.object({
      batchGuid: z.string().optional(),
      derivatives: z.record(z.string(), webStreamDerivativeSchema),
      photoGuid: z.string(),
      width: z.string().optional(),
      height: z.string().optional(),
      mediaAssetType: z.string().optional(),
    })
  ),
});

const webStreamRedirectSchema = z.object({
  'X-Apple-MMe-Host': z.string(),
});

const getHostPartition = (host: string) => {
  // p159-sharedstreams.icloud.com
  return host.split('-')[0];
};

const webStreamOrRedirectSchema = z.union([
  webStreamSchema,
  webStreamRedirectSchema,
]);

export type PublicAlbumWebStream = z.infer<typeof webStreamSchema>;

export const fetchPublicAlbumWebStream = async (
  partition: string,
  albumId: string
): Promise<{ webStream: PublicAlbumWebStream; partition: string }> => {
  const url = `https://${partition}-sharedstreams.icloud.com/${albumId}/sharedstreams/webstream`;
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      streamCtag: null,
    }),
  });
  const data = await response.json();
  const result = webStreamOrRedirectSchema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Failed to fetch public album web stream: url=${url} status=${response.status} error=${result.error}`
    );
  }
  if ('X-Apple-MMe-Host' in result.data) {
    return fetchPublicAlbumWebStream(
      getHostPartition(result.data['X-Apple-MMe-Host']),
      albumId
    );
  }
  return { webStream: result.data, partition: partition };
};

export const publicAlbumWebAssetSchema = z.object({
  items: z.record(
    z.string(),
    z.object({
      url_expiry: z.string(),
      url_location: z.string(),
      url_path: z.string(),
    })
  ),
});

type PublicAlbumWebAsset = z.infer<typeof publicAlbumWebAssetSchema>;

export const fetchPublicAlbumWebAsset = async (
  partition: string,
  albumId: string,
  photoGuid: string
): Promise<PublicAlbumWebAsset> => {
  const url = `https://${partition}-sharedstreams.icloud.com/${albumId}/sharedstreams/webasseturls`;
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      photoGuids: [photoGuid],
    }),
  });

  if (response.status !== 200) {
    const text = await response.text();
    throw new Error(
      `Failed to fetch public album web asset: url=${url} status=${response.status} text=${text}`
    );
  }

  try {
    const data = await response.json();
    return publicAlbumWebAssetSchema.parse(data);
  } catch (error) {
    console.error(
      `Failed to parse public album web asset: url=${url} status=${response.status} error=${error}`
    );
    throw error;
  }
};
