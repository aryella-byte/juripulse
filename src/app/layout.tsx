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
        <footer style={{ textAlign: 'center', padding: '2rem 1rem 1.5rem', color: '#888', fontSize: '0.85rem', borderTop: '1px solid #eee', marginTop: '3rem' }}>
          由中国人民大学法学院 <a href="https://aryella-byte.github.io/pengyali/" target="_blank" rel="noopener noreferrer" style={{ color: '#666', textDecoration: 'underline' }}>彭雅丽</a> 开发
        </footer>
      </body>
    </html>
  );
}
