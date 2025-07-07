import { z } from 'zod';

export const UserBlobSchema = z.object({
  user: z.object({
    name: z.string(),
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    locale: z.string(),
    time_zone: z.string(),
    time_zone_iana: z.string(),
    utc_offset: z.number(),
    plugin_setting_id: z.number(),
    uuid: z.string(),
  }),
});

export type UserBlob = z.infer<typeof UserBlobSchema>;
