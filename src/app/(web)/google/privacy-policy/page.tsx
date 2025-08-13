import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Google Photos for TRMNL',
  description: 'Display images from Google Photos on TRMNL',
};

export default async function Page() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <p className="text-lg font-bold">Google Photos for TRMNL</p>
      <p>This plugin is not affiliated with Google.</p>
      <h2 className="text-lg font-bold">Privacy Policy</h2>

      <ul className="list-disc list-inside">
        <li>
          The plugin stores data on AWS in the Europan Union, and on Vercel in the USA.
        </li>
        <li>
          The plugin stores the following data from the connected TRMNL account: The full user object, including name, email, user time zone, and plugin setting id.
        </li>
        <li>
          The plugin stores the following data from the connected Google account: Oauth access and refresh tokens, linked "Google Photos" picking session id. The latest image rendered on the TRMNL is stored on Vercel Blobs (CDN).
        </li>
        <li>
          The plugin stores the following data about usage: The number of times the plugin plugin has been "rendered", when it was last rendered, and when the plugin was first installed.
        </li>
      </ul>
    </div>
  );
}
