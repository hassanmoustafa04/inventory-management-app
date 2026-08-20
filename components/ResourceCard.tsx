import Link from 'next/link';
import { ACCESS_LABELS, Resource, typeLabel } from '@/lib/db';
import { fmtNumAr } from '@/lib/kwtime';

export default function ResourceCard({ resource }: { resource: Resource }) {
  const t = typeLabel(resource.type);
  const acc = ACCESS_LABELS[resource.access];
  return (
    <Link href={`/resources/${resource.slug}`} className="res-card">
      <div className="res-top">
        <span className="res-icon">{t.icon}</span>
        <span className={`badge ${acc.cls}`}>{acc.short}</span>
      </div>
      <h3>{resource.title}</h3>
      <p>{resource.description}</p>
      <div className="res-meta">
        <span>{resource.subject}</span>
        <span>·</span>
        <span>{resource.level}</span>
        <span>·</span>
        <span>{t.label}</span>
      </div>
      <div className="res-foot">
        <span className="muted small">⬇ {fmtNumAr(resource.downloads)} تحميل</span>
        <span className="res-cta">عرض الملف ←</span>
      </div>
    </Link>
  );
}
