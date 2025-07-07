import '../../../globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex flex-col gap-4 py-10">
        <header className="">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Apple Photos
            </h1>
          </div>
        </header>
        <main>
          <div className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      <footer>
        <div className="bg-gray-100 text-center py-4 text-sm text-gray-500">
          Enjoying this plugin? Please{' '}
          <a
            className="text-blue-500"
            href="https://buy.polar.sh/polar_cl_I7pc5Mh2nCfQk3cyLow5mxm6qg0ncpb3Ru8bu0qRKzy"
          >
            donate to support it
          </a>{' '}
          ☕
        </div>
      </footer>
    </div>
  );
}
