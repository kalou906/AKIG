import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import './globals.css';

const inter = Inter({
    subsets: ['latin', 'latin-ext'],
    variable: '--font-inter',
    display: 'swap',
});

const manrope = Manrope({
    subsets: ['latin'],
    variable: '--font-manrope',
    display: 'swap',
});

export const metadata: Metadata = {
    title: {
        default: 'AKIG v3.0 | Gestion Immobilière IA',
        template: '%s | AKIG v3.0',
    },
    description: 'Système de gestion immobilière ultra-moderne avec intelligence artificielle prédictive, analytics temps réel et automatisation complète',
    keywords: ['immobilier', 'gestion locative', 'IA', 'analytics', 'Guinée', 'AKIG'],
    authors: [{ name: 'AKIG Corp' }],
    creator: 'AKIG Corp',
    publisher: 'AKIG Corp',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon-16x16.png',
        apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#4F46E5' },
        { media: '(prefers-color-scheme: dark)', color: '#818CF8' },
    ],
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
    },
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        type: 'website',
        locale: 'fr_GN',
        url: 'https://app.akig.gn',
        title: 'AKIG v3.0 | Gestion Immobilière IA',
        description: 'Système de gestion immobilière ultra-moderne avec IA prédictive',
        siteName: 'AKIG',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://api.akig.gn" />
                <link rel="dns-prefetch" href="https://api.akig.gn" />
            </head>
            <body
                className={cn(
                    inter.variable,
                    manrope.variable,
                    'min-h-screen bg-background font-sans antialiased'
                )}
                suppressHydrationWarning
            >
                <Providers>
                    {children}
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}
