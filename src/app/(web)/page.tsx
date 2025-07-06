import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apple Photos',
  description: 'Display images from Apple Photos on TRMNL',
};

export default function Home() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        Hello. Install this plugin from{' '}
        <a
          style={{ textDecoration: 'underline' }}
          href="https://usetrmnl.com/plugin_settings/new?keyname=apple_photos"
        >
          the TRMNL plugin page
        </a>
        .
      </div>

      <div>
        Bugs?{' '}
        <a
          style={{ textDecoration: 'underline' }}
          href="https://github.com/zegl/trmnl-apple-photos"
        >
          Open an issue on GitHub
        </a>
      </div>
    </div>
  );
}
