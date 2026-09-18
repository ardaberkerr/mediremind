# Medication Reminder App Implementation Plan

## Goal Description

Create a production‑ready, modular full‑stack web application that sends SMS reminders to users when it is time to take their medication. The stack includes Next.js (App Router) with TypeScript, Tailwind CSS, Shadcn UI, Prisma + PostgreSQL, a background queue (Upstash QStash or BullMQ), Twilio/Netgsm SMS abstraction, and authentication (NextAuth.js or Clerk). All components must follow clean‑code principles, include security measures, and provide a polished UI.

## User Review Required

> [!IMPORTANT]
> Choose **one** background queue system for scheduled SMS tasks.
> Choose **one** authentication solution.
>
> The plan cannot be executed until these decisions are confirmed.

## Open Questions

- **Background queue system**: Upstash QStash (serverless) vs BullMQ (Redis‑based).
- **Authentication method**: NextAuth.js (email/OTP) vs Clerk (phone + OTP).
- **SMS provider default**: Prefer Twilio as primary with Netgsm as fallback, or make both configurable?

## Proposed Changes

### Project Structure

[MODIFY] [project_tree.txt](file:///C:/Users/USER/.gemini/antigravity/brain/99a9b303-c2a6-47f7-8a50-9aed32fb9d2e/project_tree.txt)
```
my-medication-reminder/
├─ app/
│  ├─ api/
│  │  ├─ auth/          # NextAuth or Clerk routes
│  │  └─ reminders/      # Cron/Queue handler
│  ├─ dashboard/        # Dashboard UI pages
│  └─ (server actions)
├─ components/           # Shadcn UI components
├─ lib/
│  ├─ prisma/            # Prisma client & schema.prisma
│  ├─ sms/               # smsService.ts (Twilio/Netgsm abstraction)
│  └─ queue/             # Queue implementation (QStash or BullMQ)
├─ prisma/
│  └─ schema.prisma
├─ public/
├─ styles/
│  └─ globals.css (Tailwind import)
├─ .env.example
├─ tsconfig.json
└─ package.json
```

### Core Files to Add

- `prisma/schema.prisma` – full data model.
- `lib/prisma/client.ts` – Prisma client singleton.
- `lib/sms/smsService.ts` – abstraction over Twilio & Netgsm.
- `lib/queue/qStash.ts` **or** `lib/queue/bullmq.ts` – queue setup.
- `app/api/reminders/route.ts` – Cron endpoint that scans upcoming reminders and enqueues SMS jobs.
- `app/api/reminders/trigger.ts` – Queue consumer that sends SMS via smsService.
- `app/api/auth/[...nextauth].ts` **or** Clerk auth files.
- Zod schemas in `lib/validation/` for request validation.
- React components: `components/Dashboard.tsx`, `components/MedicationForm.tsx`, `components/ReminderTimeline.tsx`, `components/NotificationLog.tsx`.
- Tailwind config and Shadcn UI setup.
- `.env.example` with required variables (DATABASE_URL, NEXTAUTH_SECRET, TWILIO_SID, TWILIO_TOKEN, NETGSM_USER, NETGSM_PASS, QUEUE_URL, etc.).

## Verification Plan

### Automated Tests
- Run `npm run lint` and `npm run test` (jest) after generation.
- Execute a local dev server (`npm run dev`) and verify API routes respond.
- Use Prisma migrate to ensure schema applies cleanly.

### Manual Verification
- Deploy to Vercel (or local) and test SMS flow with test phone numbers.
- Verify rate limiting headers on SMS endpoint.
- Check UI responsiveness on mobile and desktop.

---

*Please review the open questions above and provide your selections.*
