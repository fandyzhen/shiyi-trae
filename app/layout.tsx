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
      <body>
        {children}
        <footer style={{ textAlign: 'center', padding: '16px', fontSize: '14px', color: '#888' }}>
          有任何问题，请联系我们：
          <a href="mailto:ask@dzqjiaju.com" style={{ color: '#888' }}>
            ask@dzqjiaju.com
          </a>
        </footer>
      </body>
    </html>
  );
}
