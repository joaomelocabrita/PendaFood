# PendaFood

PendaFood is an open-source, privacy-first web app for planning food and habits and tracking gut-health signals such as symptoms and stool patterns.

> PendaFood is a tracking and planning tool, not a diagnostic or treatment service. It should never replace clinical care.

## Stack

- Next.js + TypeScript
- Vercel for hosting
- Supabase Postgres + Auth + Row Level Security
- Public, versioned food knowledge stored separately from private health records
- Free-tier-first architecture

Supabase's current free plan includes Postgres, Auth, Row Level Security, 500 MB database storage, 1 GB file storage, and Edge Functions within its published quotas. Free projects can pause after a period of inactivity, so this is appropriate for early development rather than a guarantee of production availability.

## Privacy rules

This repository is public. **Never commit:**

- Supabase service-role keys or database passwords
- `.env` files or real API tokens
- Real user health records, stool logs, symptom histories, or identifiable test data
- Private clinical notes or screenshots containing personal information

Only browser-safe `NEXT_PUBLIC_SUPABASE_*` values belong in deployment configuration. Database authorization must be enforced with Supabase Row Level Security; hiding UI controls is not security.

## Data architecture

Private user data belongs in Supabase tables protected by `auth.uid()` RLS policies. Public food metadata belongs in version-controlled seed data or a public-data table and must carry source/licence/provenance metadata.

We will not copy large proprietary food databases into the project. External datasets and APIs will be evaluated for licence, attribution, update policy, reliability, and whether redistribution is permitted.

## Initial roadmap

1. Foundation and privacy model
2. Supabase email/password authentication
3. Daily health + stool + symptom logging
4. Food and meal logging
5. Habit checklist and reminders
6. Food knowledge database with provenance and dietary tags
7. Personal meal planning and 7-day rotation rules
8. Trend views and correlations without implying medical causation
9. External information/API integrations behind server-side boundaries
10. Accessibility, testing, security review, and Vercel deployment

## Development

Copy `.env.example` to `.env.local` and provide only the public Supabase URL and browser key. Never put production secrets in Git.

```bash
npm install
npm run dev
```

## Build cadence

Development is planned as small daily increments. Each increment should leave the repository in a runnable state, include tests where practical, and explicitly call out anything that requires user testing or a Supabase/Vercel dashboard action.
