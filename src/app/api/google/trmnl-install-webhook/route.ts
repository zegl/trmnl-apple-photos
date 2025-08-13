import { NextResponse } from 'next/server';
import { GoogleBlobRepository } from '@/google/blobs';
import { getDynamoDBClient } from '@/dynamodb';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();

  const dynamoDBClient = getDynamoDBClient();
  const googleBlobRepository = new GoogleBlobRepository(dynamoDBClient);

  await googleBlobRepository.createUserBlob(body.user.uuid, body);

  return NextResponse.json({ message: 'Installation successful' });
}
