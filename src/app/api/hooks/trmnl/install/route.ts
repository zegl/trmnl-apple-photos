import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();

  const path = `trmnl-apple-photos-${body.user.uuid}-user.json`;

  const blob = await put(path, JSON.stringify(body), {
    access: 'public',
    allowOverwrite: true,
  });

  console.log('Installed user', body.user.uuid);

  return NextResponse.json({ message: 'Installation successful' });
}
