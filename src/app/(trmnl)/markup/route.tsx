import { NextResponse } from 'next/server';
import { BlobRepository } from '@/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import { getPhotos } from '../../photos';
import Render from '@/app/Render';

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
  const blobRepository = new BlobRepository(supabaseClient);

  const photos = await getPhotos({
    blobRepository,
    user_uuid,
    crawl_if_missing: true,
  });

  const show_message = photos.success ? undefined : photos.error;
  const url = photos.success ? photos.data.url : undefined;

  await blobRepository.increaseRenderCount(user_uuid);

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
          <body className="environment trmnl">
              <Render url={url} size={size.size} show_message={show_message} />
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
