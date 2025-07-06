import Hatchet, { Priority } from '@hatchet-dev/typescript-sdk';
import { NextResponse } from 'next/server';
import { SettingsSchema } from '@/app/types';
import { BlobRepository } from '@/blobs';
import { getSupabaseClientForUser } from '@/supabase';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsedBody = SettingsSchema.parse(body);

    const supabaseClient = getSupabaseClientForUser(parsedBody.uuid);
    const blobRepository = new BlobRepository(supabaseClient);

    await blobRepository.saveUserSettings(parsedBody.uuid, parsedBody);

    const hatchet = Hatchet.init();

    await blobRepository.setCrawlStatus({
      uuid: parsedBody.uuid,
      status: 'Refresh scheduled',
    });

    try {
      await hatchet.runNoWait(
        'trmnl-apple-photos-refresh-album',
        {
          user_uuid: parsedBody.uuid,
        },
        {
          priority: Priority.HIGH,
        }
      );
    } catch (error) {
      console.error('Error triggering hatchet refresh:', error);
    }

    return NextResponse.json({
      status: 'success',
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
