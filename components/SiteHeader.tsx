import Link from 'next/link';
import Atom from './Atom';
import { getSetting } from '@/lib/db';
import { currentMember } from '@/lib/members';

export default function SiteHeader({ active }: { active?: 'curriculum' | 'resources' | 'book' | 'teachers' }) {
  const member = currentMember();
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/" className="brand">
          <Atom />
          <span>{getSetting('teacher_name')}</span>
        </Link>
        <nav className="topnav">
          <Link className={`navlink ${active === 'curriculum' ? 'on' : ''}`} href="/curriculum">
            المناهج والمكتبة
          </Link>
          <Link className={`navlink ${active === 'teachers' ? 'on' : ''}`} href="/teachers">
            شبكة المعلمين
          </Link>
          {member ? (
            <Link className="navlink" href="/me">
              👤 {member.name.split(' ')[0]}
            </Link>
          ) : (
            <Link className="navlink" href="/auth/login">
              دخول الأعضاء
            </Link>
          )}
          <Link href="/book" className="btn btn-primary btn-sm">
            احجز حصة
          </Link>
        </nav>
      </div>
    </header>
  );
}
