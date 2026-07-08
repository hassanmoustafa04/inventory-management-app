import Link from 'next/link';
import Atom from '@/components/Atom';
import BookingWizard from '@/components/BookingWizard';
import { activeOfferings, getSetting } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'احجز حصتك — فيزياء مع أ. حسن',
};

export default function BookPage({ searchParams }: { searchParams: { offering?: string } }) {
  const offerings = activeOfferings();
  const preselected = offerings.find((o) => o.slug === searchParams.offering)?.id ?? null;

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/" className="brand">
            <Atom />
            <span>فيزياء مع {getSetting('teacher_name')}</span>
          </Link>
          <nav className="topnav">
            <Link className="navlink" href="/">
              ← الرجوع للرئيسية
            </Link>
          </nav>
        </div>
      </header>
      <div className="container-narrow wizard-wrap">
        <BookingWizard offerings={offerings} preselectedId={preselected} />
      </div>
    </>
  );
}
