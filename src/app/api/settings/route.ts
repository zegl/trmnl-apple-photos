import { SettingsSchema } from '@/app/settings/types';
import { BlobRepository } from '@/blobs';
import { NextResponse } from 'next/server';
import { getSupabaseClientForUser } from '@/supabase';
import Hatchet, { Priority } from '@hatchet-dev/typescript-sdk';

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

    // Trigger hatchet refresh
    await hatchet.runNoWait("trmnl-apple-photos-refresh-album", {
      user_uuid: parsedBody.uuid,
    }, {
      priority: Priority.HIGH,
    });

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
