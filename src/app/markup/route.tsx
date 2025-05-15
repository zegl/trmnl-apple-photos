import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Extract data from POST request as form data
  const formData = await request.formData();

  // Create URL with query parameters from form data
  const url = new URL('/markup-get', request.url);

  // Add each form field as a query parameter
  for (const [key, value] of formData.entries()) {
    url.searchParams.append(key, String(value));
  }

  const response = await fetch(url, {
    method: 'GET',
  });

  const responseBody = await response.text();
  return NextResponse.json({
    markup: responseBody,
  });
}
