// Client-safe curriculum vocabulary. Content is split by curriculum; everything
// else in the platform (bookings, students, schedule, settings) stays shared.

export type CurriculumKey = 'kuwaiti' | 'british';

export const CURRICULA: {
  key: CurriculumKey;
  flag: string;
  name_ar: string;
  short_ar: string;
  blurb_ar: string;
  accent: string;
}[] = [
  {
    key: 'kuwaiti',
    flag: '🇰🇼',
    name_ar: 'المنهج الحكومي الكويتي',
    short_ar: 'المنهج الحكومي',
    blurb_ar: 'الصفوف العاشر و الحادي عشر علمي و الثاني عشر علمي',
    accent: 'kw',
  },
  {
    key: 'british',
    flag: '🇬🇧',
    name_ar: 'المنهج البريطاني',
    short_ar: 'المنهج البريطاني',
    blurb_ar: 'Cambridge IGCSE Physics',
    accent: 'uk',
  },
];

export function curriculumOf(key: string) {
  return CURRICULA.find((c) => c.key === key) ?? CURRICULA[0];
}

/**
 * The sections a lesson can hold. The two curricula ask for different things —
 * a Kuwaiti lesson wants «المذكرة» and «بنك أسئلة», a Cambridge lesson wants
 * mark schemes and paper-split past questions — so each kind declares which
 * curricula offer it.
 */
export type MaterialKind = {
  key: string;
  icon: string;
  ar: string;
  en: string;
  curricula: CurriculumKey[];
};

export const MATERIAL_KINDS: MaterialKind[] = [
  // Kuwaiti flow
  { key: 'explanation', icon: '📖', ar: 'شرح الدرس', en: 'Explanation', curricula: ['kuwaiti'] },
  { key: 'video', icon: '🎥', ar: 'فيديو الشرح', en: 'Video Lesson', curricula: ['kuwaiti', 'british'] },
  { key: 'notes', icon: '📝', ar: 'المذكرة', en: 'Notes', curricula: ['kuwaiti', 'british'] },
  { key: 'key_ideas', icon: '💡', ar: 'أهم الأفكار والقوانين', en: 'Key Ideas & Formulas', curricula: ['kuwaiti'] },
  { key: 'experiments', icon: '🧪', ar: 'التجارب', en: 'Experiments', curricula: ['kuwaiti'] },
  { key: 'exercises', icon: '✏️', ar: 'تدريبات', en: 'Exercises', curricula: ['kuwaiti'] },
  { key: 'question_bank', icon: '📚', ar: 'بنك أسئلة', en: 'Question Bank', curricula: ['kuwaiti'] },
  { key: 'quiz', icon: '✅', ar: 'اختبار قصير', en: 'Quiz', curricula: ['kuwaiti', 'british'] },
  { key: 'past_exams', icon: '📑', ar: 'اختبارات سابقة', en: 'Past Exams', curricula: ['kuwaiti'] },
  { key: 'final_review', icon: '🎯', ar: 'مراجعة نهائية', en: 'Final Revision', curricula: ['kuwaiti', 'british'] },
  // Cambridge flow
  { key: 'teacher_explanation', icon: '👩‍🏫', ar: 'شرح المعلمة', en: 'Teacher Explanation', curricula: ['british'] },
  { key: 'cambridge_tips', icon: '📌', ar: 'إرشادات كامبريدج', en: 'Cambridge Tips', curricula: ['british'] },
  { key: 'misconceptions', icon: '⚠️', ar: 'أخطاء شائعة', en: 'Common Misconceptions', curricula: ['british'] },
  { key: 'practical', icon: '🧪', ar: 'التجربة العملية', en: 'Practical', curricula: ['british'] },
  { key: 'worksheet', icon: '📝', ar: 'ورقة عمل', en: 'Worksheet', curricula: ['british'] },
  { key: 'past_paper_1', icon: '❓', ar: 'أسئلة امتحانات — Paper 1', en: 'Past Paper Questions — Paper 1', curricula: ['british'] },
  { key: 'past_paper_3', icon: '❓', ar: 'أسئلة امتحانات — Paper 3', en: 'Past Paper Questions — Paper 3', curricula: ['british'] },
  { key: 'past_paper_6', icon: '❓', ar: 'أسئلة امتحانات — Paper 6', en: 'Past Paper Questions — Paper 6', curricula: ['british'] },
  { key: 'mark_scheme', icon: '✅', ar: 'نموذج الإجابة', en: 'Mark Scheme', curricula: ['british'] },
];

export function kindsFor(curriculum: string): MaterialKind[] {
  return MATERIAL_KINDS.filter((k) => k.curricula.includes(curriculum as CurriculumKey));
}

export function kindInfo(key: string): MaterialKind {
  return (
    MATERIAL_KINDS.find((k) => k.key === key) ?? {
      key,
      icon: '📄',
      ar: key,
      en: key,
      curricula: ['kuwaiti', 'british'],
    }
  );
}

/** Cambridge sections read better in English; Kuwaiti ones in Arabic. */
export function kindLabel(key: string, curriculum: string): string {
  const k = kindInfo(key);
  return curriculum === 'british' ? k.en : k.ar;
}

/** Turn a YouTube/Vimeo link into something embeddable; null if unrecognised. */
export function embedUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}
