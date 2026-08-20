import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'فيزياء IGCSE مع أ. منى مرسي — مكتبة ودروس خصوصية في الكويت',
  description:
    'مكتبة فيزياء IGCSE مجانية — عروض تقديمية وخطط دروس وأوراق عمل، ودروس خصوصية أونلاين وحضورياً في الكويت.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
