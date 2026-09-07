import './globals.css';

export const metadata = {
  title: 'LaunchFrame AI',
  description: 'Turn any project URL into a polished promotional video.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
