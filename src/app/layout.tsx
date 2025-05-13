export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://usetrmnl.com/css/latest/plugins.css"
        />
        <script src="https://usetrmnl.com/js/latest/plugins.js"></script>
      </head>
      <body className="environment trmnl">{children}</body>
    </html>
  );
}
