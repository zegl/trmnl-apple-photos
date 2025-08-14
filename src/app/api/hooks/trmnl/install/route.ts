import { NextResponse } from 'next/server';
import { AppleBlobRepository } from '@/apple/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import { getS3Client } from '@/dynamodb';
import { getDynamoDBClient } from '@/dynamodb';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();

  const supabaseClient = getSupabaseClientForUser(body.user.uuid);
  const s3Client = getS3Client();
  const dynamodbClient = getDynamoDBClient();
  const appleBlobRepository = new AppleBlobRepository(
    dynamodbClient,
    supabaseClient,
    s3Client
  );

  await appleBlobRepository.createUserBlob(body.user.uuid, body);

  console.log('Installed user', body.user.uuid);

  return NextResponse.json({ message: 'Installation successful' });
}
