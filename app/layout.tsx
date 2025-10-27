import type { Metadata } from "next";
import { Inter, Ubuntu } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

// Configure the Inter font
const ubuntu = Ubuntu({
  weight: "500",
  subsets: ["cyrillic"]
});

export const metadata: Metadata = {
  title: "MemoMind - AI-Powered Document Intelligence",
  description: "Chat with your documents using advanced AI. Upload PDFs, Word documents, and text files to have intelligent conversations and extract insights from your content with MemoMind.",
  keywords: ["MemoMind", "AI", "document chat", "PDF analysis", "AI assistant", "document processing", "chat with documents", "document intelligence"],
  authors: [{ name: "MemoMind Team" }],
  robots: "index, follow",
  openGraph: {
    title: "MemoMind - AI-Powered Document Intelligence",
    description: "Intelligent AI-powered conversations with your documents. Extract insights and get answers from your PDFs, Word files, and more with MemoMind.",
    type: "website",
    locale: "en_US",
    siteName: "MemoMind",
  },
  twitter: {
    card: "summary_large_image",
    title: "MemoMind - AI-Powered Document Intelligence",
    description: "Chat with your documents using advanced AI technology powered by MemoMind",
    creator: "@memomind",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={ubuntu.className}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${ubuntu.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}