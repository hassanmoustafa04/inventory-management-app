# Product Strategy — Physics Tutoring in Kuwait

*The thinking behind every design decision in this codebase.*

## 1. What business is this, really?

This is **not** a marketplace and must not look like one. The teacher's entire
moat is personal trust: parents in Kuwait choose a private tutor through word
of mouth, and the website's job is to **convert an existing reputation into
bookings** — not to compete on a platform. So the site is built like a personal
brand: the teacher's name, philosophy ("نفهم قبل ما نحفظ"), results, and social
proof front and center. One teacher, one voice, zero platform-feel.

## 2. The one metric that matters

**Time from "I heard he's good" → confirmed lesson.** Today that funnel is:
get the number from a friend → WhatsApp back-and-forth ("متى فاضي؟" ×5) →
maybe a lesson. Every step loses people. The site collapses it to:
open link → pick a real slot → type name + WhatsApp → done. Target: **under 60
seconds, on a phone, with no account.**

Design consequences:
- **No student accounts.** Passwords kill conversion and add nothing — the
  booking code (`PHY-XXXXX`) is the student's "account". Identity is the phone
  number, which doubles as the CRM key.
- **Real availability, not a contact form.** Showing the actual free slots is
  the single biggest UX upgrade over "leave your number and we'll call you".
- **WhatsApp as the notification layer.** Kuwait runs on WhatsApp. Instead of
  building SMS/email infra, every touchpoint deep-links into a pre-filled
  WhatsApp message (student→teacher and teacher→student). Zero cost, 100%
  open rate, and it's where the relationship lives anyway.

## 3. Trust asymmetry: protect the teacher's calendar

A tutor's inventory is hours. A no-show costs real money. Hence the
**request → confirm** model by default: the student picks a slot, the teacher
taps "تأكيد" and the slot is locked (with an **auto-confirm** toggle once trust
in the system grows). Slots also enforce a configurable lead time (default 3h)
so nobody books a lesson starting in 20 minutes.

Payment stays **off-platform deliberately** (KNET link / cash after
confirmation). Zero payment friction at booking time, no PCI scope, and it
matches how tutoring money already moves in Kuwait. Phase 2 can add MyFatoorah
/ Tap payment links once volume justifies it.

## 4. The teacher is the second user — on a phone

Every admin surface assumes the teacher is between lessons with 90 seconds of
attention: pending requests at the top of the dashboard with one-tap
confirm/decline, bottom tab bar on mobile, income and load visible at a glance,
and a "حصص تحتاج إغلاق" nudge so completed lessons get marked (which feeds the
income stats and the per-student history). The CRM builds itself from
bookings — the teacher never does data entry.

## 5. Positioning details that matter locally

- **Arabic-first, RTL-native, Kuwaiti tone** — not translated-feeling Arabic.
  Kuwaiti dialect in the marketing copy ("ليش تدرس معي؟"), formal Arabic in
  transactional text.
- Eastern Arabic numerals (٨ د.ك), Kuwait weekend (Fri/Sat), evening-heavy
  default schedule (tutoring happens after school), prices in KWD.
- Curriculum labels parents recognize: وزارة التربية (علمي ١٠–١٢), IGCSE, SAT.
- The trial-lesson guarantee ("أول حصة أونلاين ما تعجبك؟ ما تدفع") converts
  fence-sitters and costs almost nothing.

## 6. Roadmap (deliberately not built yet)

1. **Payments**: MyFatoorah/Tap KNET links attached to confirmations.
2. **Packages/subscriptions**: 8-lesson bundles with per-student balance.
3. **Reminders**: WhatsApp Business API for automated 24h/2h reminders.
4. **Group scheduling**: named cohorts with per-cohort capacity.
5. **Content moat**: past-paper solutions in Arabic → SEO → inbound students
   the teacher doesn't already know.

The rule for all of it: nothing gets added that makes the first booking take
longer than a minute.
