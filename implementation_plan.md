# Medication Reminder Web Application – Implementation Plan

## Goal Description

Develop a production‑ready, modular full‑stack web application that sends automated SMS reminders to users when it is time to take their medication. The stack includes Next.js (App Router) with TypeScript, Tailwind CSS, Shadcn UI, Prisma ORM with PostgreSQL, a background job queue (Upstash QStash or BullMQ), SMS providers (Twilio and Netgsm), and authentication (NextAuth.js or Clerk).

---

## User Review Required

> [!IMPORTANT]
> **Queue System Selection** – Choose one of the following for scheduled SMS tasks:
> - **Upstash QStash** (serverless, pay‑per‑request, integrates via HTTP API)
> - **BullMQ** (Redis‑based, requires a managed Redis instance)
>
> > Please select which queue system you prefer.
>
> 
> **Authentication Provider** – Choose one of the following for user sign‑in:
> - **NextAuth.js** (self‑hosted, supports phone+OTP via custom provider)
> - **Clerk** (managed SaaS, out‑of‑the‑box phone authentication)
>
> > Please select the authentication method.
>
> 
> **SMS Provider Preference** – The service layer abstracts both Twilio and Netgsm. Confirm you want both integrated or only one (specify priority).
>
> > Please confirm provider setup.
---

## Open Questions

> [!WARNING]
> - **Time‑zone handling**: Will users set their time zone manually, or should we infer it from the browser? This affects the cron scheduler implementation.
>
> - **Retry policy for SMS failures**: Number of retries and back‑off strategy?
>
> - **Rate limiting strategy**: Global per‑user limit vs per‑provider limit?
>
> - **Deployment target**: Vercel, Netlify, or custom server? This influences environment variable handling for secret keys.
>
---

## Proposed Changes

### 1. Project Structure

```
my-med-reminder/
├─ app/                     # Next.js App Router
│  ├─ api/
│  │  ├─ auth/              # Auth routes (NextAuth or Clerk wrappers)
│  │  ├─ reminders/cron/    # Cron API endpoint (protected)
│  │  └─ sms/               # SMS webhook or test endpoint
│  ├─ dashboard/            # UI pages (dashboard, logs, settings)
│  ├─ medications/          # Medication CRUD pages & modals
│  └─ layout.tsx
├─ components/              # Reusable UI components (Shadcn, Lucide)
│  ├─ DashboardTimeline.tsx
│  ├─ MedicationForm.tsx
│  └─ SmsLogTable.tsx
├─ lib/
│  ├─ prisma.ts             # Prisma client singleton
│  ├─ smsService.ts        # Abstracted SMS provider wrapper
│  ├─ queue.ts             # Queue initialization (QStash or BullMQ)
│  ├─ auth.ts              # Session helpers (NextAuth/Clerk unified API)
│  └─ zodSchemas.ts        # Zod validation for API inputs
├─ prisma/
│  └─ schema.prisma        # Database schema (User, Medication, ReminderSchedule, NotificationLog)
├─ public/                  # Static assets (optional UI images)
├─ styles/
│  └─ globals.css          # Tailwind imports
├─ .env.example             # Template env file
└─ package.json
```

---

### 2. `schema.prisma` (Full Content)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int        @id @default(autoincrement())
  name         String?
  surname      String?
  phone        String     @unique @db.VarChar(20) // E.164 format validated via Zod
  passwordHash String?
  timeZone     String     @default("UTC")
  createdAt    DateTime   @default(now())
  medications  Medication[]
  notificationLogs NotificationLog[]
}

model Medication {
  id            Int               @id @default(autoincrement())
  user          User              @relation(fields: [userId], references: [id])
  userId        Int
  name          String
  dosage        String
  instructions  String?
  startDate     DateTime
  endDate       DateTime?
  isActive      Boolean           @default(true)
  reminderSchedules ReminderSchedule[]
  notificationLogs NotificationLog[]
}

model ReminderSchedule {
  id            Int      @id @default(autoincrement())
  medication    Medication @relation(fields: [medicationId], references: [id])
  medicationId  Int
  reminderTime  String   // HH:mm 24‑hour format
  daysOfWeek    Int[]    // 1 = Monday ... 7 = Sunday
}

model NotificationLog {
  id            Int      @id @default(autoincrement())
  user          User     @relation(fields: [userId], references: [id])
  userId        Int
  medication    Medication @relation(fields: [medicationId], references: [id])
  medicationId  Int
  status        String   @default("PENDING") // ENUM: PENDING, SENT, FAILED
  sentAt        DateTime?
  errorMessage  String?
  providerResponse String?
}
```

---

### 3. SMS Service (`lib/smsService.ts`)

*Provides a unified interface `sendSms(to: string, body: string): Promise<SmsResult>` that internally picks Twilio or Netgsm based on configuration.*

---

### 4. Queue Initialization (`lib/queue.ts`)

- **Upstash QStash**: Export `enqueueReminder(jobData)` that POSTs to QStash API.
- **BullMQ**: Export a `Queue` instance backed by a Redis URL, with a processor that calls the SMS service.

---

### 5. Cron API Endpoint (`app/api/reminders/cron/route.ts`)

- Protected with Bearer token (`process.env.CRON_SECRET`).
- Scans active `ReminderSchedule`s, computes next run time respecting user's `timeZone`, and enqueues jobs.
- Returns JSON summary of enqueued jobs.

---

### 6. Zod Schemas (`lib/zodSchemas.ts`)

- `phoneSchema` enforcing E.164 via regex.
- `reminderScheduleInput`, `medicationInput`, `userInput` etc.
- Exported for validation in Server Actions and API routes.

---

### 7. Server Actions Examples (`app/medications/create.tsx`)

- Use `action` to validate input with Zod, create Prisma records, and return result.
- Wrapped in `authGuard` that works with both auth providers.

---

### 8. UI Components (React + Tailwind + Shadcn)

- **DashboardTimeline**: Hourly timeline showing upcoming reminders with countdown timers.
- **MedicationForm**: Modal with day‑of‑week multi‑select and time picker.
- **SmsLogTable**: Table with status badge, retry button, and provider response details.
- **ProfileSettings**: Phone verification flow (OTP) and SMS preferences toggle.

---

### 9. Security & Performance Measures

- **Input Validation**: All public endpoints validated with Zod.
- **Rate Limiting**: Implemented via `next-rate-limit` middleware on SMS send endpoint (e.g., 5 SMS per minute per user).
- **Cron Protection**: Bearer token + IP allow‑list (optional).
- **Secrets Management**: `.env` includes `DATABASE_URL`, `TWILIO_SID`, `TWILIO_TOKEN`, `NETGSM_USER`, `NETGSM_PASS`, `QSTASH_TOKEN` or `REDIS_URL`, `NEXTAUTH_SECRET`/`CLERK_SECRET`, `CRON_SECRET`.

---

## Verification Plan

### Automated Tests
- Run `npm test` (Jest + Prisma test utils) for:
  - Prisma schema migrations.
  - SMS service abstraction (mock providers).
  - Queue job dispatch and processing.
  - API route authentication.

### Manual Verification
- Deploy to a staging Vercel preview.
- Register a test phone number, create medication entries, and verify SMS receipt.
- Inspect the Dashboard timeline for correct scheduling.
- Stress test rate‑limiting by invoking the endpoint rapidly.

---

*Once you approve the selections above (queue system, auth provider, and SMS provider preference) and answer the open questions, I will proceed with generating the concrete file contents and scaffolding the project.*
