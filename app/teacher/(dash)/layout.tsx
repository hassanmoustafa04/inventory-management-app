import Atom from '@/components/Atom';
import TeacherNav from '@/components/TeacherNav';
import { requireTeacher } from '@/lib/auth';
import { logoutAction } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  requireTeacher();
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <Atom />
          <span>لوحة المعلم</span>
        </div>
        <TeacherNav />
        <div className="spacer" />
        <form action={logoutAction}>
          <button type="submit" className="navitem">
            <span>🚪</span>
            <span className="navtext">تسجيل الخروج</span>
          </button>
        </form>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
