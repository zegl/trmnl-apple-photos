import Hatchet, { Priority } from '@hatchet-dev/typescript-sdk';
import { NextResponse } from 'next/server';
import { AppleSettingsSchema } from '@/apple/types';
import { AppleBlobRepository } from '@/apple/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import { Result } from '@/result';

export async function POST(
  request: Request
): Promise<NextResponse<Result<void>>> {
  try {
    const body = await request.json();
    const parsedBody = AppleSettingsSchema.parse(body);

    const supabaseClient = getSupabaseClientForUser(parsedBody.uuid);
    const appleBlobRepository = new AppleBlobRepository(supabaseClient);

    await appleBlobRepository.saveUserSettings(parsedBody.uuid, parsedBody);

    const hatchet = Hatchet.init();

    await appleBlobRepository.setCrawlStatus({
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

    return NextResponse.json({ success: true, data: undefined });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
