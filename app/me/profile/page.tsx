import Link from 'next/link';
import { redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { updateMemberProfileAction } from '@/lib/actions';
import { currentMember } from '@/lib/members';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'بياناتي' };

export default function ProfilePage({
  searchParams,
}: {
  searchParams: { msg?: string; err?: string };
}) {
  const member = currentMember();
  if (!member) redirect('/auth/login');

  return (
    <>
      <SiteHeader />
      <div className="container-narrow" style={{ padding: '30px 20px 70px' }}>
        <Link href="/me" className="muted small">← رجوع لحسابي</Link>
        <div className="card" style={{ marginTop: 14 }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 18 }}>بياناتي</h1>
          {searchParams.msg && <div className="form-ok">{searchParams.msg}</div>}
          {searchParams.err && <div className="form-error">{searchParams.err}</div>}
          <form action={updateMemberProfileAction}>
            <div className="field">
              <label htmlFor="p-name">الاسم الكامل</label>
              <input id="p-name" name="name" className="input" defaultValue={member.name} required />
            </div>
            <div className="field">
              <label>البريد الإلكتروني</label>
              <input className="input ltr" value={member.email} disabled />
              <div className="hint">لا يمكن تغيير البريد — تواصل معنا إذا احتجت ذلك.</div>
            </div>
            <div className="field">
              <label htmlFor="p-phone">رقم الواتساب</label>
              <input id="p-phone" name="phone" className="input ltr" defaultValue={member.phone} placeholder="5XXXXXXX" />
              <div className="hint">نربط حجوزاتك بحسابك عن طريق هذا الرقم.</div>
            </div>
            {member.role === 'teacher' && (
              <>
                <div className="field">
                  <label htmlFor="p-school">المدرسة / جهة العمل</label>
                  <input id="p-school" name="school" className="input" defaultValue={member.school} />
                </div>
                <div className="field">
                  <label htmlFor="p-bio">نبذة عنك (تظهر في صفحة شبكة المعلمين)</label>
                  <textarea id="p-bio" name="bio" className="textarea" defaultValue={member.bio} />
                </div>
              </>
            )}
            <button type="submit" className="btn btn-navy">حفظ البيانات</button>
          </form>
        </div>
      </div>
    </>
  );
}
