import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Playfair_Display, Noto_Serif_SC } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "法脉 JuriPulse — 法学研究情报平台",
  description:
    "看清学术脉络，掌握量化方法，把握前沿动态。CLSCI研究态势分析、交互式统计学教学、双语法学简报。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${notoSerifSC.variable} font-sans antialiased`}
      >
        <Nav />
        <main>{children}</main>
        <footer className="border-t px-6 py-10" style={{ borderColor: 'var(--border)' }}>
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12h4l3-8 4 16 3-8h6" stroke="var(--navy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-serif text-sm font-medium" style={{ color: 'var(--navy)' }}>法脉 JuriPulse</span>
              </div>
              <div className="text-center text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                由中国人民大学法学院 <a href="https://aryella-byte.github.io/pengyali/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--navy)', textDecoration: 'underline' }}>彭雅丽</a> 开发
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                © 2025 JuriPulse
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
