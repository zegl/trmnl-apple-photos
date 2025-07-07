import { NextResponse } from 'next/server';
import { getSupabaseClientForUser } from '@/supabase';
import Render from '@/app/Render';
import { GoogleBlobRepository } from '@/google/blobs';
import { getClient } from '@/google/auth';

export async function POST(request: Request) {
  // Extract data from POST request as form data
  const formData = await request.formData();

  const sizes = [
    {
      json_name: 'markup',
      size: 'full',
    },
    {
      json_name: 'markup_half_vertical',
      size: 'half_vertical',
    },
    {
      json_name: 'markup_half_horizontal',
      size: 'half_horizontal',
    },
    {
      json_name: 'markup_quadrant',
      size: 'quadrant',
    },
  ];

  const user_uuid = formData.get('user_uuid');
  if (typeof user_uuid !== 'string') {
    return NextResponse.json(
      { error: 'user_uuid is not a string' },
      { status: 400 }
    );
  }

  const params = new URLSearchParams();
  params.append('user_uuid', user_uuid);

  const supabaseClient = getSupabaseClientForUser(user_uuid);
  const googleBlobRepository = new GoogleBlobRepository(supabaseClient);

  let show_message: string | undefined;
  let image_url: string | undefined;

  const googleAlbum = await googleBlobRepository.getGoogleAlbum(user_uuid);
  const googleTokens = await googleBlobRepository.getGoogleTokens(user_uuid);

  if (
    !googleAlbum.success ||
    !googleAlbum.data.google_album_id ||
    !googleAlbum.data.google_album_url
  ) {
    show_message = 'Google album not found';
  } else if (
    !googleTokens.success ||
    !googleTokens.data.google_access_token ||
    !googleTokens.data.google_refresh_token
  ) {
    show_message = 'Google tokens not found';
  } else {
    const client = getClient();
    client.setCredentials({
      access_token: googleTokens.data.google_access_token,
      refresh_token: googleTokens.data.google_refresh_token,
    });

    const request = {
      url: 'https://photoslibrary.googleapis.com/v1/mediaItems:search',
      method: 'POST',
      body: JSON.stringify({
        albumId: googleAlbum.data.google_album_id,
      }),
    };

    const response = await client.request(request);

    console.log('req', request);

    console.log('response', response.data);

    show_message = 'TODO';
  }

  // const show_message = photos.success ? undefined : photos.error;
  // const url = photos.success ? photos.data.url : undefined;

  await googleBlobRepository.increaseRenderCount(user_uuid);

  const { renderToString } = await import('react-dom/server');

  const res = await Promise.all(
    sizes.map(async (size) => {
      const markup = renderToString(
        <html lang="en">
          <head>
            <script src="https://usetrmnl.com/js/latest/plugins.js" />
            <link
              rel="stylesheet"
              href="https://usetrmnl.com/css/latest/plugins.css"
            />
          </head>
          <body>
            <Render
              url={image_url}
              size={size.size}
              show_message={show_message}
            />
          </body>
        </html>
      );

      return {
        json_name: size.json_name,
        markup: markup,
      };
    })
  );

  const json: Record<string, string> = {};
  for (const size of res) {
    json[size.json_name] = size.markup;
  }

  return NextResponse.json(json);
}
