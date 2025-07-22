import { z } from 'zod';

export const AppleRediscoverImagesRequestSchema = z.object({
  user_uuid: z.string(),
});

export type AppleRediscoverImagesRequest = z.infer<
  typeof AppleRediscoverImagesRequestSchema
>;
