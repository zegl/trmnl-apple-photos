import type { Metadata } from 'next';
import exampleImage from './example.png';

export const metadata: Metadata = {
  title: 'Google Photos for TRMNL',
  description: 'Display images from Google Photos on TRMNL',
  authors: [{ name: 'Gustav Westling', url: 'https://westling.dev' }],
};

export default function Home() {
  return (
    <div className="flex flex-col gap-4">
      <p>
        Hey! This is a plugin for TRMNL, that displays a random photo from a
        Google Photos album.
      </p>

      <img
        src={exampleImage.src}
        height={exampleImage.height}
        width={exampleImage.width}
        alt="Picture of a bird, as shown using the Google Photos plugin on a TRMNL device"
      />

      <p>
        Install the plugin from{' '}
        <a
          className="text-blue-500"
          href="https://trmnl.com/plugin_settings/new?keyname=google_photos"
        >
          the TRMNL plugin page
        </a>
        .
      </p>

      <p>
        No bugs?{' '}
        <a
          className="text-blue-500"
          href="https://buy.polar.sh/polar_cl_I7pc5Mh2nCfQk3cyLow5mxm6qg0ncpb3Ru8bu0qRKzy"
        >
          Donate
        </a>{' '}
        to support it's development. ❤️
      </p>

      <p>
        Bugs? Open an{' '}
        <a
          className="text-blue-500"
          href="https://github.com/zegl/trmnl-apple-photos"
        >
          issue
        </a>{' '}
        on GitHub 💚
      </p>

      <p className="text-sm text-gray-500">
        This plugin is not affiliated with Google or Google Photos. See the{' '}
        <a className="text-blue-500" href="/terms-of-service">
          Terms of Service
        </a>{' '}
        and the{' '}
        <a className="text-blue-500" href="/privacy-policy">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
