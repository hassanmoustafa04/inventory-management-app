# Product Strategy — an IGCSE learning hub built on one teacher's library

*The thinking behind every design decision in this codebase.*

## 1. The trap we deliberately avoided

The stated vision — "a hub where students and teachers use my resources and
collaborate" — describes a two-sided marketplace. Two-sided marketplaces die of
cold start: no teachers because no students, no students because no content, and
an empty site that serves nobody. Worse, chasing "platform" dilutes the thing
that actually pays: her lessons.

But she has the one asset most new tutors don't: **a library of finished
material** (PowerPoints, lesson plans, worksheets). That library is the wedge —
it lets her publish real value on day one, before she has a single student.

## 2. The sequence: assets → audience → bookings → network

**Layer 1 — the library is the top of the funnel, not the product.**
A student searching "مراجعة الكهرباء IGCSE" finds her file, downloads it, sees
who wrote it, and books a lesson. Every resource page cross-sells a lesson with
the author. Resources are marketing that happens to be genuinely useful.

**Layer 2 — gating buys identity, not revenue.**
Four tiers on every file:

| Tier | Who | Why |
| --- | --- | --- |
| `public` — مجاني | anyone, no account | must be shareable in WhatsApp groups; this is the growth engine |
| `member` — للأعضاء | free account | converts anonymous downloaders into a contactable lead list |
| `student` — لطلابي | anyone with a confirmed lesson | rewards paying students; **unlocks automatically**, no admin work |
| `teacher` — للمعلمين | approved network teachers | lesson plans and schemes of work that shouldn't reach students |

The student tier is computed from bookings, not assigned by hand — the teacher
never maintains a list.

**Layer 3 — the network is curated, not open.**
Teachers *apply*; she approves. Approved teachers unlock the teacher shelf and
may contribute files **that she reviews before anything is published**. Open UGC
would mean no supply, no trust, and a moderation burden on a working teacher.
A review queue is the only model one person can actually sustain — and editorial
control is what keeps the library worth visiting. It also creates referral flow:
teachers who are full send students to her.

**Layer 4 — lessons stay the business.** The hub exists to produce bookings.

## 3. Content splits; the platform does not

Two curricula are taught side by side — the Kuwaiti government syllabus and
Cambridge IGCSE — and they genuinely differ: one wants «المذكرة» and «بنك
أسئلة», the other wants mark schemes and past questions split by Paper 1/3/6.
So the *content* tree divides at the top: curriculum → grade or programme →
unit/topic → lesson → typed sections.

Everything else stays one system. Bookings, students, availability, payments
and settings do not care which syllabus a student follows, and duplicating them
would double the admin surface for one teacher. A student simply records a
curriculum and a grade at registration.

The section types are declared per curriculum rather than shared, because a
half-relevant list is worse than two exact ones: the Cambridge lesson editor
never offers «بنك أسئلة», and the Kuwaiti one never offers Paper 6.

## 4. Why no "collaboration features" (yet)

Chat, forums, shared folders, and co-editing all sound like collaboration but
each needs critical mass to not feel abandoned. Real collaboration v1 is
narrower and it ships: a teacher submits a file, the owner reviews it, it gets
published under the contributor's name on a public network page. That is a
complete loop with two people in it — it works at n=2 and still works at n=50.

## 5. Friction budget

- **Booking stays account-free.** A booking code is the student's "account".
- **Accounts exist only where they buy something** — unlocking a tier.
- **Browsing and public downloads never require login**, because SEO and
  WhatsApp sharing are the distribution channels.
- **Owner admin must be phone-sized**: approve a teacher, publish a file, or
  confirm a lesson in one tap, between classes.

## 6. Local specifics

Arabic-first and RTL-native with Kuwaiti dialect in marketing copy and formal
Arabic in transactional text; Eastern Arabic numerals; KWD pricing; Kuwaiti
weekend (Fri/Sat) with evening-heavy default availability; WhatsApp as the
notification layer (100% open rate, zero infrastructure); curriculum labels
parents recognize (IGCSE, AS/A Level, Checkpoint).

## 7. Roadmap, in order

1. **Payments** — MyFatoorah/Tap KNET links attached to booking confirmations.
2. **Resource packs** — paid bundles, the natural first digital product.
3. **Automated reminders** — WhatsApp Business API, 24h and 2h before lessons.
4. **SEO content** — Arabic past-paper walkthroughs; this is the compounding
   channel that brings students she doesn't already know.
5. **Teacher subscriptions** — once the teacher shelf is thick enough to be
   worth paying for.
6. **Cohorts/courses** — recurring group classes with capacity.

The rule for all of it: nothing may make the first download, or the first
booking, take longer than it does today.
