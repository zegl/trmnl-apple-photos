import { put } from '@vercel/blob';
import { getUserBlobName, saveUserSettings } from '@/blobs';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();

  await saveUserSettings(body.user.uuid, body);

  console.log('Installed user', body.user.uuid);

  return NextResponse.json({ message: 'Installation successful' });
}
