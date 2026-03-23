import { z } from 'zod';

export const AppleSettingsSchema = z.object({
  uuid: z.string(),
  sharedAlbumUrl: z.string(),
  colorPreference: z.enum(['grayscale', 'original']).default('grayscale'),
});

export type AppleSettings = z.infer<typeof AppleSettingsSchema>;
