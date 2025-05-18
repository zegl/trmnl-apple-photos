import { SettingsSchema } from '@/app/settings/types';
import { put } from '@vercel/blob';
import { getSettingsBlobName, saveUserSettings } from '@/blobs';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsedBody = SettingsSchema.parse(body);

    await saveUserSettings(parsedBody.uuid, parsedBody);

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
