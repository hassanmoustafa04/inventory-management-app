// Client-safe copies of the taxonomy (lib/db.ts pulls in better-sqlite3, which
// must never be imported from a client component).
export const SUBJECTS = ['الفيزياء', 'الكيمياء', 'الأحياء', 'الرياضيات'];
export const LEVELS = ['IGCSE', 'AS / A Level', 'Checkpoint', 'عام'];
export const RESOURCE_TYPES: { key: string; label: string; icon: string }[] = [
  { key: 'presentation', label: 'عرض تقديمي', icon: '📊' },
  { key: 'lesson_plan', label: 'خطة درس', icon: '🗒️' },
  { key: 'worksheet', label: 'ورقة عمل', icon: '📝' },
  { key: 'notes', label: 'ملخص مراجعة', icon: '📘' },
  { key: 'past_paper', label: 'نماذج امتحانات', icon: '🧾' },
];
export const ACCESS_OPTIONS: { key: string; label: string; hint: string }[] = [
  { key: 'public', label: 'متاح للجميع', hint: 'يظهر ويُحمّل بدون تسجيل — الأفضل للانتشار' },
  { key: 'member', label: 'للأعضاء المسجّلين', hint: 'يتطلب حساباً مجانياً — يبني قائمة تواصلك' },
  { key: 'student', label: 'لطلابي فقط', hint: 'لمن لديه حصة مؤكدة معك' },
  { key: 'teacher', label: 'للمعلمين المعتمدين', hint: 'خطط الدروس وما لا يناسب الطلاب' },
];
