import { SettingsSchema } from '@/app/settings/types';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsedBody = SettingsSchema.parse(body);

    const path = `trmnl-apple-photos-${parsedBody.uuid}-settings.json`;

    const blob = await put(path, JSON.stringify(parsedBody), {
      access: 'public',
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
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
