import type { Metadata } from 'next';
import exampleImage from './example.png';

export const metadata: Metadata = {
  title: 'Apple Photos for TRMNL',
  description: 'Display images from Apple Photos on TRMNL',
  authors: [{ name: 'Gustav Westling', url: 'https://westling.dev' }],
};

export default function Home() {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-bold">
        This plugin has been acquired by TRMNL and is now a{' '}
        <a
          className="text-blue-500"
          href="https://trmnl.com/integrations/apple-photos"
        >
          first-party plugin
        </a>
        .
      </p>

      <p>
        Hey! This is a plugin for TRMNL, that displays a random photo from a
        Apple Photos album.
      </p>

      <img
        src={exampleImage.src}
        height={exampleImage.height}
        width={exampleImage.width}
        alt="Picture of a bird, as shown using the Apple Photos plugin on a TRMNL device"
      />

      <p>
        Install the plugin from{' '}
        <a
          className="text-blue-500"
          href="https://trmnl.com/plugin_settings/new?keyname=apple_photos"
        >
          the TRMNL plugin page
        </a>
        .
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
        This plugin is not affiliated with Apple or Apple Photos.
      </p>
    </div>
  );
}
