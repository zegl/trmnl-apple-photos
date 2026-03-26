import { NextResponse } from 'next/server';
import { AppleBlobRepository } from '@/apple/blobs';
import { getDynamoDBClient, getS3Client } from '@/dynamodb';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedPassword = process.env.EXPORT_API_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 500 }
    );
  }

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'WWW-Authenticate': 'Basic' } }
    );
  }

  const decoded = atob(authHeader.slice(6));
  const password = decoded.split(':')[1] ?? '';

  if (password !== expectedPassword) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'WWW-Authenticate': 'Basic' } }
    );
  }

  try {
    const dynamodbClient = getDynamoDBClient();
    const s3Client = getS3Client();
    const repo = new AppleBlobRepository(dynamodbClient, s3Client);

    const result = await repo.listAllUsersAndSettings();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const users = result.data.map((item) => ({
      user_uuid: item.user_uuid,
      settings: item.settings ? JSON.parse(item.settings) : null,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    );
  }
}
