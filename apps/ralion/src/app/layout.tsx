import React from 'react';
import { DesktopTitleBar } from '@ralion/ui';
import { RalionAuthProvider } from '@/components/RalionAuthProvider';
import { DesktopOAuthListener } from '@/components/DesktopOAuthListener';
import { DesktopNetworkBootstrap } from '@/components/DesktopNetworkBootstrap';
import './globals.css';

export const metadata = {
  title: 'Ralion Adaptive — AMD Developer Hackathon ACT III',
  description: 'One business. Infinite possibilities. Explore Ralion Adaptive, an AMD-powered AI marketing experience by Ras Ali Labs, Botswana.',
  icons: {
    icon: '/assets/images/logo.png',
    shortcut: '/favicon.ico',
    apple: '/assets/images/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-zinc-950 text-zinc-100 font-sans antialiased flex flex-col h-screen overflow-hidden" suppressHydrationWarning>
        <DesktopNetworkBootstrap>
          <RalionAuthProvider>
            <DesktopTitleBar />
            <DesktopOAuthListener />
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </RalionAuthProvider>
        </DesktopNetworkBootstrap>
      </body>
    </html>
  );
}
