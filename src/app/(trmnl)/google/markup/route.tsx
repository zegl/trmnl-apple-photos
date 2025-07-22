import { NextResponse } from 'next/server';
import { getSupabaseClientForUser } from '@/supabase';
import Render from '@/app/Render';
import { GoogleBlobRepository } from '@/google/blobs';
import { getClient } from '@/google/auth';
import { listImagesInAlbum } from '@/google/album';
import { put } from '@vercel/blob';
import { onGoogleClientTokens } from '@/google/auth-refresher';

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

  const googleTokens = await googleBlobRepository.getGoogleTokens(user_uuid);
  const googlePickSession =
    await googleBlobRepository.getGooglePickSession(user_uuid);

  if (
    !googleTokens.success ||
    !googlePickSession.success ||
    !googlePickSession.data.google_pick_session_id
  ) {
    show_message = 'This album is not connected to Google Photos';
  } else {
    const client = getClient();

    client.setCredentials({
      access_token: googleTokens.data.google_access_token,
      refresh_token: googleTokens.data.google_refresh_token,
    });

    // Save tokens if they change
    client.on(
      'tokens',
      onGoogleClientTokens({ googleBlobRepository, user_uuid })
    );

    const mediaItems = await listImagesInAlbum({
      client,
      google_pick_session_id: googlePickSession.data.google_pick_session_id,
    });

    if (!mediaItems.success) {
      show_message = 'Failed to get media items';
    } else {
      const photos = mediaItems.data.filter((item) => item.type === 'PHOTO');
      if (photos.length === 0) {
        show_message = 'No photos found in this album';
      } else {
        const randomIndex = Math.floor(Math.random() * photos.length);
        const randomImage = photos[randomIndex];

        // Download the image from Google Photos

        const photoBytes = await client.request({
          url: randomImage.mediaFile.baseUrl + '=w1024-h1024',
          method: 'GET',
        });

        console.log('photoBytes', photoBytes);

        // Upload to Vercel Blobs
        // generate a random name
        // const randomName = Math.random().toString(36).substring(2, 15);
        const { url } = await put(
          user_uuid + '.jpg',
          photoBytes.data as string,
          {
            access: 'public',
            addRandomSuffix: true,
            token: process.env.BLOB_GOOGLE_READ_WRITE_TOKEN,
          }
        );

        image_url = url;
      }
    }
  }

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
