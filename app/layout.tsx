import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import AuthProvider from "@/components/AuthProvider";
import { CreditsProvider } from "@/components/CreditsContext";
import { LanguageProvider } from "@/components/LanguageContext";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CallingGen — AI Voice Calling Platform",
  description:
    "Automate sales calls, lead qualification, appointment reminders, customer support and follow-ups with human-like AI voice agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* BUG-022/027: Apply saved theme before hydration to prevent flash */}
        <script
          id="theme-script"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <LanguageProvider>
          <AuthProvider>
            <CreditsProvider>{children}</CreditsProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

