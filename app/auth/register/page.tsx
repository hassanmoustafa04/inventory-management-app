import RegisterPageClient from '@/components/RegisterForm';
import { allTracks } from '@/lib/content';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إنشاء حساب' };

export default function RegisterPage() {
  const tracks = allTracks()
    .filter((t) => t.active === 1)
    .map((t) => ({
      id: t.id,
      slug: t.slug,
      curriculum: t.curriculum,
      name_ar: t.name_ar,
      name_en: t.name_en,
    }));
  return <RegisterPageClient tracks={tracks} />;
}
