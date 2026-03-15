import type { Metadata } from 'next';
import { Bebas_Neue } from 'next/font/google';
import './globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
});

export const metadata: Metadata = {
  title: 'Dictator Smackdown',
  description:
    'A satirical claymation boxing game featuring fictional political archetypes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body className={`${bebasNeue.variable} antialiased`}>{children}</body>
    </html>
  );
}
