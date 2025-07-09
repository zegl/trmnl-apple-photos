import { z } from 'zod';

export const AppState = z.discriminatedUnion('state', [
  z.object({
    state: z.literal('error'),
    error: z.string(),
  }),
  z.object({
    state: z.literal('not-connected'),
    signInUrl: z.string(),
  }),
  z.object({
    state: z.literal('connected-no-pictures'),
  }),
  z.object({
    state: z.literal('connected-picking'),
    pickerUri: z.string(),
  }),
  z.object({
    state: z.literal('connected-pictures'),
    imageCount: z.number(),
    //   album: {
    //     id: string;
    //     url: string;
    //   }
  }),
]);

export type AppState = z.infer<typeof AppState>;
