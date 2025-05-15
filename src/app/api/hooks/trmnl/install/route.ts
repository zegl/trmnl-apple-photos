import { put } from '@vercel/blob';
import { getUserBlobName } from '@/blobs';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();

  const path = getUserBlobName(body.user.uuid);

  const blob = await put(path, JSON.stringify(body), {
    access: 'public',
    allowOverwrite: true,
  });

  console.log('Installed user', body.user.uuid);

  return NextResponse.json({ message: 'Installation successful' });
}
