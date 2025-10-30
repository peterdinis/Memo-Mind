import type { Metadata } from 'next';
import { Inter, Ubuntu } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TransitionProvider } from '@/components/providers/TransitionProvider';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { Toaster } from 'sonner';

// Configure the Inter font
const ubuntu = Ubuntu({
    weight: '500',
    subsets: ['cyrillic'],
});

export const metadata: Metadata = {
    title: 'MemoMind - AI-Powered Document Intelligence',
    description:
        'Chat with your documents using advanced AI. Upload PDFs, Word documents, and text files to have intelligent conversations and extract insights from your content with MemoMind.',
    keywords: [
        'MemoMind',
        'AI',
        'document chat',
        'PDF analysis',
        'AI assistant',
        'document processing',
        'chat with documents',
        'document intelligence',
    ],
    authors: [{ name: 'MemoMind Team' }],
    robots: 'index, follow',
    openGraph: {
        title: 'MemoMind - AI-Powered Document Intelligence',
        description:
            'Intelligent AI-powered conversations with your documents. Extract insights and get answers from your PDFs, Word files, and more with MemoMind.',
        type: 'website',
        locale: 'en_US',
        siteName: 'MemoMind',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en' suppressHydrationWarning className={ubuntu.className}>
            <head>
                <meta name='theme-color' content='#000000' />
            </head>
            <body className={`${ubuntu.className} antialiased`}>
                <ThemeProvider
                    attribute='class'
                    defaultTheme='system'
                    enableSystem
                    disableTransitionOnChange
                >
                    <TransitionProvider>
                        {children}
                        <ScrollToTop />
                        <Toaster />
                    </TransitionProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
