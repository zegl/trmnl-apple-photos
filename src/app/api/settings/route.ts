import { SettingsSchema } from '@/app/settings/types';
import { BlobRepository } from '@/blobs';
import { NextResponse } from 'next/server';
import { getSupabaseClientForUser } from '@/supabase';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsedBody = SettingsSchema.parse(body);

    const supabaseClient = getSupabaseClientForUser(parsedBody.uuid);
    const blobRepository = new BlobRepository(supabaseClient);

    await blobRepository.saveUserSettings(parsedBody.uuid, parsedBody);

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
