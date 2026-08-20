'use client';

import Link from 'next/link';
import Atom from './Atom';

/** Lightweight header for client pages (no DB access). */
export default function SiteHeaderClient() {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/" className="brand">
          <Atom />
          <span>المكتبة التعليمية</span>
        </Link>
        <nav className="topnav">
          <Link className="navlink" href="/resources">المكتبة</Link>
          <Link className="navlink" href="/me">حسابي</Link>
        </nav>
      </div>
    </header>
  );
}
