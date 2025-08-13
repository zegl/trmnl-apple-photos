import { NextResponse } from 'next/server';
import { GoogleBlobRepository } from '@/google/blobs';
import { getSupabaseClientForUser } from '@/supabase';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();

  const supabaseClient = getSupabaseClientForUser(body.user.uuid);
  const googleBlobRepository = new GoogleBlobRepository(supabaseClient);

  await googleBlobRepository.saveUserBlob(body.user.uuid, body);

  console.log('Installed user', body.user.uuid);

  return NextResponse.json({ message: 'Installation successful' });
}
