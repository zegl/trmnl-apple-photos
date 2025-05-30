import { BlobRepository } from '@/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import { Hatchet } from '@hatchet-dev/typescript-sdk';

export const hatchet = Hatchet.init();

export type RefreshAlbumInput = {
  uuid: string;
};

export const refreshAlbum = hatchet.task({
  name: 'refreshAlbum',
  retries: 1,
  fn: async (input: RefreshAlbumInput) => {
    const { uuid } = input;
    console.log(`Refreshing album ${uuid}`);

    const supabase = getSupabaseClientForUser(uuid);

    const blobRepository = new BlobRepository(supabase);

    const userSettings = await blobRepository.getUserSettings(uuid);

    console.log(userSettings);
  },
});

async function main() {
  console.log('Registering worker');

  const worker = await hatchet.worker('trmnl-apple-photos-worker', {
    workflows: [refreshAlbum],
    slots: 10,
  });

  console.log("Starting worker")

  await worker.start();
}

if (require.main === module) {
  main();
}
