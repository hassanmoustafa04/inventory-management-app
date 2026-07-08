import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="login-wrap">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>🔭</div>
        <h1 style={{ fontWeight: 900, fontSize: '1.3rem', marginBottom: 8 }}>الصفحة غير موجودة</h1>
        <p className="muted small" style={{ marginBottom: 20 }}>
          يمكن الرابط غلط، أو رقم الحجز غير صحيح.
        </p>
        <Link href="/" className="btn btn-navy btn-block">
          الرجوع للصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
