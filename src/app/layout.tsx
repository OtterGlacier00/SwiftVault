import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "SwiftVault", template: "%s · SwiftVault" },
  description: "Archivio personale dei corsi Swift di Sean Allen, con progressi e note.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <div className="mx-auto w-full max-w-[980px] px-5 pt-5 pb-10">
          <header className="flex flex-wrap items-baseline gap-3.5 mb-7">
            <Link href="/" className="text-xl font-extrabold tracking-[0.3px] text-accent hover:no-underline">
              Swift&nbsp;Vault
            </Link>
            <span className="text-sm text-muted">archivio personale · corsi Sean Allen</span>
          </header>
          <main>{children}</main>
          <footer className="mt-12 border-t border-hairline pt-3.5 text-xs text-muted">
            materiale © Sean Allen · sito privato per uso personale
          </footer>
        </div>
      </body>
    </html>
  );
}
