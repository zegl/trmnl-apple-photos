import { NextResponse } from 'next/server';
import { BlobRepository } from '@/blobs';
import { getSupabaseClientForUser } from '@/supabase';
import { getPhotos } from '../photos';

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

  if (photos.success) {
    const { url } = photos.data;
    params.append('url', url);
  } else {
    params.append('show_message', photos.error);
  }

  await blobRepository.increaseRenderCount(user_uuid);

  const res = await Promise.all(
    sizes.map(async (size) => {
      const url = new URL('/markup-get', request.url);

      // Copy params to url.searchParams
      for (const [key, value] of params.entries()) {
        url.searchParams.append(key, value);
      }
      url.searchParams.append('size', size.size);

      const response = await fetch(url, {
        method: 'GET',
      });

      return {
        json_name: size.json_name,
        markup: await response.text(),
      };
    })
  );

  const json: Record<string, string> = {};
  for (const size of res) {
    json[size.json_name] = size.markup;
  }

  return NextResponse.json(json);
}
