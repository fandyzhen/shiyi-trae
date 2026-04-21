import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '虚拟试衣 - Virtual Try-On',
  description: 'AI虚拟试衣，让你在网购前看到穿上衣服的效果',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
