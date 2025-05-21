import { z } from 'zod';

export const getPublicAlbumId = (sharedAlbumUrl: string) => {
  const albumId = sharedAlbumUrl.split('#')[1];
  return albumId;
};

const webStreamSchema = z.object({
  streamName: z.string(),
  photos: z.array(
    z.object({
      photoGuid: z.string(),
      derivatives: z.record(
        z.string(),
        z.object({
          fileSize: z.string(),
          checksum: z.string(),
          width: z.string(),
          height: z.string(),
        })
      ),
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

type PublicAlbumWebStream = z.infer<typeof webStreamSchema>;

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
  const result = webStreamOrRedirectSchema.parse(data);
  if ('X-Apple-MMe-Host' in result) {
    return fetchPublicAlbumWebStream(
      getHostPartition(result['X-Apple-MMe-Host']),
      albumId
    );
  }
  return { webStream: result, partition: partition };
};

const publicAlbumWebAssetSchema = z.object({
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
  const data = await response.json();
  return publicAlbumWebAssetSchema.parse(data);
};
