'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/teacher', icon: '🏠', label: 'الرئيسية' },
  { href: '/teacher/bookings', icon: '📋', label: 'الحجوزات' },
  { href: '/teacher/schedule', icon: '🗓️', label: 'جدول أوقاتي' },
  { href: '/teacher/resources', icon: '📚', label: 'المكتبة' },
  { href: '/teacher/review', icon: '📥', label: 'المراجعة' },
  { href: '/teacher/students', icon: '👥', label: 'الطلاب' },
  { href: '/teacher/settings', icon: '⚙️', label: 'الإعدادات' },
];

export default function TeacherNav() {
  const pathname = usePathname();
  return (
    <>
      {ITEMS.map((item) => {
        const active =
          item.href === '/teacher' ? pathname === '/teacher' : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`navitem ${active ? 'active' : ''}`}>
            <span>{item.icon}</span>
            <span className="navtext">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}
