import Hatchet, { Priority } from '@hatchet-dev/typescript-sdk';
import { NextResponse } from 'next/server';
import { AppleBlobRepository } from '@/apple/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import { AppleRediscoverImagesRequestSchema } from './type';
import { Result } from '@/result';

export async function POST(
  request: Request
): Promise<NextResponse<Result<void>>> {
  try {
    const body = await request.json();
    const parsedBody = AppleRediscoverImagesRequestSchema.parse(body);

    const supabaseClient = getSupabaseClientForUser(parsedBody.user_uuid);
    const appleBlobRepository = new AppleBlobRepository(supabaseClient);

    const hatchet = Hatchet.init();

    await appleBlobRepository.setCrawlStatus({
      uuid: parsedBody.user_uuid,
      status: 'Refresh scheduled',
    });

    try {
      await hatchet.runNoWait(
        'trmnl-apple-photos-refresh-album',
        {
          user_uuid: parsedBody.user_uuid,
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
