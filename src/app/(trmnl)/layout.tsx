import Script from 'next/script';

import '../../trmnl.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Script src="https://usetrmnl.com/js/latest/plugins.js" />
      {children}
    </>
  );
}
