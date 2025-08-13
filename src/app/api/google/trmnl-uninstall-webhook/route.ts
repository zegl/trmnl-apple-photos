import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  console.log('Uninstallation request', body);
  return NextResponse.json({ message: 'Uninstallation successful' });
}
