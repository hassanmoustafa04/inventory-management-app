import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'فيزياء مع أ. حسن — دروس خصوصية في الكويت',
  description:
    'دروس فيزياء خصوصية في الكويت — أونلاين وحضورياً. احجز حصتك في أقل من دقيقة، لمناهج وزارة التربية و IGCSE.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
