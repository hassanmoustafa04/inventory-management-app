import {
  changePasswordAction,
  saveOfferingAction,
  saveSettingsAction,
} from '@/lib/actions';
import { allOfferings, getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function SettingsPage({ searchParams }: { searchParams: { msg?: string } }) {
  const settings = getSettings();
  const offerings = allOfferings();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>الإعدادات</h1>
          <div className="sub">بياناتك وأسعارك وطريقة عمل الحجز</div>
        </div>
      </div>

      {searchParams.msg && <div className="form-ok">{searchParams.msg}</div>}

      <div className="card" style={{ marginBottom: 22 }}>
        <h3 style={{ marginBottom: 16 }}>🧑‍🏫 بياناتي</h3>
        <form action={saveSettingsAction}>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="s-name">الاسم الظاهر للطلاب</label>
              <input id="s-name" name="teacher_name" className="input" defaultValue={settings.teacher_name} />
            </div>
            <div className="field">
              <label htmlFor="s-tagline">الوصف المختصر</label>
              <input id="s-tagline" name="tagline" className="input" defaultValue={settings.tagline} />
            </div>
            <div className="field">
              <label htmlFor="s-wa">رقم الواتساب</label>
              <input id="s-wa" name="whatsapp" className="input ltr" defaultValue={settings.whatsapp} />
              <div className="hint">عليه توصل رسائل الطلاب — بصيغة 965XXXXXXXX</div>
            </div>
            <div className="field">
              <label htmlFor="s-loc">المنطقة (للحصص الحضورية)</label>
              <input id="s-loc" name="location" className="input" defaultValue={settings.location} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="s-bio">نبذة تعريفية (تظهر في الصفحة الرئيسية)</label>
            <textarea id="s-bio" name="bio" className="textarea" defaultValue={settings.bio} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="s-lead">أقل مدة قبل الحصة يُسمح فيها بالحجز (بالساعات)</label>
              <input
                id="s-lead"
                name="min_lead_hours"
                type="number"
                min={0}
                max={48}
                className="input ltr"
                defaultValue={settings.min_lead_hours}
              />
            </div>
            <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 26 }}>
              <input
                id="s-auto"
                type="checkbox"
                name="auto_confirm"
                defaultChecked={settings.auto_confirm === '1'}
                style={{ width: 18, height: 18 }}
              />
              <label htmlFor="s-auto" style={{ margin: 0 }}>
                تأكيد الحجوزات تلقائياً (بدون مراجعتي)
              </label>
            </div>
          </div>
          <button type="submit" className="btn btn-navy">
            حفظ البيانات
          </button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <h3 style={{ marginBottom: 6 }}>💰 الباقات والأسعار</h3>
        <p className="muted small" style={{ marginBottom: 16 }}>
          عطّل الباقة إذا ما تبيها تظهر للطلاب. الأسعار بالدينار الكويتي.
        </p>
        <div className="stack">
          {offerings.map((o) => (
            <form action={saveOfferingAction} className="day-block" key={o.id} style={{ marginBottom: 0 }}>
              <input type="hidden" name="id" value={o.id} />
              <span className="day-name" style={{ minWidth: 220, flex: 1 }}>
                {o.mode === 'online' ? '🖥️' : '🏠'} {o.name_ar}
              </span>
              <label className="small muted">السعر (د.ك)</label>
              <input
                name="price_kwd"
                type="number"
                step="0.5"
                min="0.5"
                className="input ltr"
                style={{ width: 100 }}
                defaultValue={o.price_kwd}
              />
              <label className="small muted">المدة</label>
              <select name="duration_min" className="select" style={{ width: 'auto' }} defaultValue={o.duration_min}>
                <option value={45}>٤٥ دقيقة</option>
                <option value={60}>ساعة</option>
                <option value={90}>ساعة ونصف</option>
                <option value={120}>ساعتان</option>
              </select>
              <label className="small muted row-flex" style={{ gap: 6 }}>
                <input type="checkbox" name="active" defaultChecked={o.active === 1} /> فعّالة
              </label>
              <button type="submit" className="btn btn-sm btn-navy">
                حفظ
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>🔒 تغيير كلمة المرور</h3>
        <form action={changePasswordAction}>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="pw-cur">كلمة المرور الحالية</label>
              <input id="pw-cur" name="current" type="password" className="input ltr" required />
            </div>
            <div className="field">
              <label htmlFor="pw-new">كلمة المرور الجديدة (٨ أحرف على الأقل)</label>
              <input id="pw-new" name="next" type="password" className="input ltr" minLength={8} required />
            </div>
          </div>
          <button type="submit" className="btn btn-navy">
            تغيير كلمة المرور
          </button>
        </form>
      </div>
    </>
  );
}
