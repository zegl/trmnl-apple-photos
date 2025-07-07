import { z } from 'zod';

export const AppleSettingsSchema = z.object({
  uuid: z.string(),
  sharedAlbumUrl: z.string(),
});

export type AppleSettings = z.infer<typeof AppleSettingsSchema>;
