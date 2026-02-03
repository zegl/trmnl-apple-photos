import { NextResponse } from 'next/server';

const getEnvOrThrow = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set.`);
  }
  return value;
};

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const installationCallbackUrl = searchParams.get('installation_callback_url');

  if (!code || !installationCallbackUrl) {
    return NextResponse.json(
      { error: 'Missing code or installation_callback_url' },
      { status: 400 }
    );
  }

  const formData = new URLSearchParams();
  formData.append('code', code);
  formData.append('client_id', getEnvOrThrow('TRMNL_CLIENT_ID'));
  formData.append('client_secret', getEnvOrThrow('TRMNL_CLIENT_SECRET'));
  formData.append('grant_type', 'authorization_code');

  const fetchTokenResponse = await fetch('https://trmnl.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  try {
    const fetchTokenData = await fetchTokenResponse.json();
    const _accessToken = fetchTokenData.access_token;
    console.log('fetchTokenData', fetchTokenData);

    return NextResponse.redirect(installationCallbackUrl);
  } catch (error) {
    console.error('Error parsing token response', error);
    const errorResponse = await fetchTokenResponse.text();
    console.error('Error response', errorResponse);
    return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 });
  }
}
