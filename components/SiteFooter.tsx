import Link from 'next/link';
import { getSettings } from '@/lib/db';

export default function SiteFooter() {
  const s = getSettings();
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <b style={{ color: '#fff' }}>{s.teacher_name}</b> — {s.tagline}
          <div className="small">📍 {s.location}</div>
        </div>
        <div className="row-flex">
          <Link href="/resources">المكتبة</Link>
          <span style={{ opacity: 0.3 }}>|</span>
          <Link href="/teachers">شبكة المعلمين</Link>
          <span style={{ opacity: 0.3 }}>|</span>
          <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener">واتساب</a>
          <span style={{ opacity: 0.3 }}>|</span>
          <Link href="/teacher/login">دخول المعلمة</Link>
        </div>
      </div>
    </footer>
  );
}
