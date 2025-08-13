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
      <h2 className="text-lg font-bold">Terms of Service</h2>

      <ul className="list-disc list-inside">
        <li>
          This plugin uses the Google Photos API to display images on TRMNL.
        </li>
        <li>
          Any images shared with the plugin will be temporarily stored on the
          plugin's servers.
        </li>
        <li>
          The plugin is provided "as is" and "with all faults" without warranty
          of any kind.
        </li>
        <li>
          User data (names, TRMNL account info, Google account info) is stored
          on a database in USA.
        </li>
        <li>
          No data is shared with any third parties except for Google and TRMNL.
        </li>
        <li>
          If you have any questions, please open an issue on{' '}
          <a href="https://github.com/zegl/trmnl-apple-photos">GitHub</a>.
        </li>
      </ul>
    </div>
  );
}
