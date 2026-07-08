'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Offering } from '@/lib/db';
import {
  fmtDateAr,
  fmtDayMonthAr,
  fmtDurationAr,
  fmtKWD,
  fmtTimeAr,
  fmtWeekdayAr,
} from '@/lib/kwtime';

type Day = { date: string; slots: string[] };

const GRADES = [
  'الصف العاشر',
  'الحادي عشر — علمي',
  'الثاني عشر — علمي',
  'IGCSE / GCSE',
  'SAT Physics',
  'فيزياء جامعية',
  'أخرى',
];

const STEPS = ['نوع الحصة', 'الموعد', 'بياناتك', 'التأكيد'];

export default function BookingWizard({
  offerings,
  preselectedId,
}: {
  offerings: Offering[];
  preselectedId: number | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(preselectedId ? 1 : 0);
  const [offeringId, setOfferingId] = useState<number | null>(preselectedId);
  const [days, setDays] = useState<Day[] | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const offering = useMemo(
    () => offerings.find((o) => o.id === offeringId) ?? null,
    [offerings, offeringId]
  );

  const loadAvailability = useCallback(async (id: number) => {
    setDays(null);
    try {
      const res = await fetch(`/api/availability?offeringId=${id}`);
      const data = await res.json();
      setDays(data.days ?? []);
    } catch {
      setDays([]);
      setError('تعذر تحميل المواعيد، حدّث الصفحة وحاول مرة أخرى');
    }
  }, []);

  useEffect(() => {
    if (offeringId != null) loadAvailability(offeringId);
  }, [offeringId, loadAvailability]);

  const goto = (s: number) => {
    setError('');
    setStep(s);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pickOffering = (id: number) => {
    setOfferingId(id);
    setDate(null);
    setTime(null);
    goto(1);
  };

  const availableDays = days?.filter((d) => d.slots.length > 0) ?? [];
  const selectedDay = days?.find((d) => d.date === date) ?? null;

  const validateDetails = () => {
    if (name.trim().length < 2) return 'اكتب اسمك الكامل';
    const digits = phone.replace(/[\s\-()+]/g, '').replace(/^(00965|965)/, '');
    if (!/^[569]\d{7}$/.test(digits)) return 'اكتب رقم واتساب كويتي صحيح (٨ أرقام تبدأ بـ 5 أو 6 أو 9)';
    if (!grade) return 'اختر الصف الدراسي';
    return '';
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offeringId, date, time, name, phone, grade, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'حدث خطأ، حاول مرة أخرى');
        if (data.slotTaken && offeringId != null) {
          setTime(null);
          await loadAvailability(offeringId);
          goto(1);
        }
        setSubmitting(false);
        return;
      }
      router.push(`/booking/${data.code}`);
    } catch {
      setError('تعذر الاتصال بالخادم، تأكد من الإنترنت وحاول مرة أخرى');
      setSubmitting(false);
    }
  };

  return (
    <div ref={topRef}>
      <div className="stepper" aria-label="خطوات الحجز">
        {STEPS.map((label, i) => (
          <span key={label} style={{ display: 'contents' }}>
            {i > 0 && <span className="bar" />}
            <span className={`st ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <span className="dot">{i < step ? '✓' : i + 1}</span>
              <span>{label}</span>
            </span>
          </span>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}

      {step === 0 && (
        <div className="card">
          <h2 style={{ marginBottom: 4 }}>شنو نوع الحصة اللي تبيها؟</h2>
          <p className="muted small" style={{ marginBottom: 18 }}>
            كل الأسعار نهائية — الدفع بعد تأكيد الحجز.
          </p>
          <div className="stack">
            {offerings.map((o) => (
              <button key={o.id} className="opt-card" onClick={() => pickOffering(o.id)}>
                <div className="opt-main">
                  <b>
                    {o.mode === 'online' ? '🖥️' : '🏠'} {o.name_ar}
                  </b>
                  <small>
                    {fmtDurationAr(o.duration_min)} · {o.desc_ar}
                  </small>
                </div>
                <div className="opt-price">
                  <b>{fmtKWD(o.price_kwd)}</b>
                  {o.kind === 'group' && <small>للطالب</small>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && offering && (
        <div className="card">
          <div className="spread" style={{ marginBottom: 4 }}>
            <h2>اختر اليوم والوقت</h2>
            <button className="btn btn-light btn-sm" onClick={() => goto(0)}>
              تغيير نوع الحصة
            </button>
          </div>
          <p className="muted small" style={{ marginBottom: 18 }}>
            {offering.name_ar} · {fmtDurationAr(offering.duration_min)} — الأوقات بتوقيت الكويت.
          </p>

          {days === null && <div className="empty">⏳ نجهز لك المواعيد المتاحة…</div>}

          {days !== null && availableDays.length === 0 && (
            <div className="empty">
              <div className="big">😔</div>
              ما فيه مواعيد متاحة حالياً لهذي الباقة — تواصل معي واتساب ونرتب موعد يناسبك.
            </div>
          )}

          {days !== null && availableDays.length > 0 && (
            <>
              <div className="date-scroller">
                {availableDays.map((d) => (
                  <button
                    key={d.date}
                    className={`date-pill ${date === d.date ? 'selected' : ''}`}
                    onClick={() => {
                      setDate(d.date);
                      setTime(null);
                    }}
                  >
                    <small>{fmtWeekdayAr(d.date)}</small>
                    <b>{fmtDayMonthAr(d.date)}</b>
                  </button>
                ))}
              </div>

              {selectedDay && (
                <>
                  <p className="small" style={{ margin: '10px 0 10px', fontWeight: 700 }}>
                    الأوقات المتاحة يوم {fmtDateAr(selectedDay.date)}:
                  </p>
                  <div className="slot-grid">
                    {selectedDay.slots.map((s) => (
                      <button
                        key={s}
                        className={`slot-btn ${time === s ? 'selected' : ''}`}
                        onClick={() => setTime(s)}
                      >
                        {fmtTimeAr(s)}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {!selectedDay && (
                <p className="muted small" style={{ marginTop: 6 }}>
                  👆 اختر يوماً لعرض الأوقات المتاحة
                </p>
              )}
            </>
          )}

          <div className="wizard-nav">
            <button className="btn btn-light" onClick={() => goto(0)}>
              رجوع
            </button>
            <button className="btn btn-primary" disabled={!date || !time} onClick={() => goto(2)}>
              التالي
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h2 style={{ marginBottom: 4 }}>بياناتك</h2>
          <p className="muted small" style={{ marginBottom: 18 }}>
            بدون تسجيل ولا كلمات مرور — بس نحتاج نعرف منو أنت.
          </p>

          <div className="field">
            <label htmlFor="f-name">اسم الطالب *</label>
            <input
              id="f-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: يوسف أحمد"
              autoComplete="name"
            />
          </div>

          <div className="field">
            <label htmlFor="f-phone">رقم الواتساب *</label>
            <input
              id="f-phone"
              className="input ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5XXXXXXX"
              inputMode="tel"
              autoComplete="tel"
            />
            <div className="hint">نتواصل معك عليه لتأكيد الحجز وإرسال التفاصيل</div>
          </div>

          <div className="field">
            <label htmlFor="f-grade">الصف الدراسي *</label>
            <select
              id="f-grade"
              className="select"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="">— اختر الصف —</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="f-notes">ملاحظات (اختياري)</label>
            <textarea
              id="f-notes"
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: أبي أركز على وحدة الكهرباء، عندي اختبار الأسبوع الجاي"
            />
          </div>

          <div className="wizard-nav">
            <button className="btn btn-light" onClick={() => goto(1)}>
              رجوع
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                const err = validateDetails();
                if (err) setError(err);
                else goto(3);
              }}
            >
              التالي
            </button>
          </div>
        </div>
      )}

      {step === 3 && offering && date && time && (
        <div className="card">
          <h2 style={{ marginBottom: 16 }}>راجع حجزك قبل الإرسال</h2>
          <div className="summary-box">
            <div className="row">
              <span>الحصة</span>
              <b>{offering.name_ar}</b>
            </div>
            <div className="row">
              <span>الموعد</span>
              <b>
                {fmtDateAr(date)} — {fmtTimeAr(time)}
              </b>
            </div>
            <div className="row">
              <span>المدة</span>
              <b>{fmtDurationAr(offering.duration_min)}</b>
            </div>
            <div className="row">
              <span>الطالب</span>
              <b>
                {name} · {grade}
              </b>
            </div>
            <div className="row">
              <span>السعر</span>
              <b className="total">
                {fmtKWD(offering.price_kwd)}
                {offering.kind === 'group' ? ' / للطالب' : ''}
              </b>
            </div>
          </div>
          <p className="muted small" style={{ margin: '14px 2px 0' }}>
            ما راح تدفع شي الآن — الدفع يكون بعد تأكيد الحجز عبر لينك KNET أو نقداً.
          </p>
          <div className="wizard-nav">
            <button className="btn btn-light" onClick={() => goto(2)} disabled={submitting}>
              رجوع
            </button>
            <button className="btn btn-primary btn-lg" onClick={submit} disabled={submitting}>
              {submitting ? '⏳ نرسل حجزك…' : '✅ أكّد الحجز'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
