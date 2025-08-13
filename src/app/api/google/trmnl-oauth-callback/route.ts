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
  formData.append('client_id', getEnvOrThrow('TRMNL_GOOGLE_PHOTOS_CLIENT_ID'));
  formData.append(
    'client_secret',
    getEnvOrThrow('TRMNL_GOOGLE_PHOTOS_CLIENT_SECRET')
  );
  formData.append('grant_type', 'authorization_code');

  const fetchTokenResponse = await fetch('https://usetrmnl.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });
  const fetchTokenData = await fetchTokenResponse.json();
  const _accessToken = fetchTokenData.access_token;
  console.log('fetchTokenData', fetchTokenData);

  if (fetchTokenData.error) {
    return NextResponse.json({ ...fetchTokenData }, { status: 400 });
  }

  return NextResponse.redirect(installationCallbackUrl);
}
