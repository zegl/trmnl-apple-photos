import { NextResponse } from 'next/server';

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
  ]

  const res = await Promise.all(sizes.map(async (size) => {
    const url = new URL('/markup-get', request.url);
    url.searchParams.append('size', size.size);
    url.searchParams.append('user_uuid', formData.get('user_uuid') as string);

    const response = await fetch(url, {
      method: 'GET',
    });

    return {
      json_name: size.json_name,
      markup: await response.text(),
    };
  }));

  let json: Record<string, string> = {};
  for (const size of res) {
    json[size.json_name] = size.markup;
  }

  return NextResponse.json(json);
}