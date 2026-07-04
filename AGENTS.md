<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:playslot-project-rules -->
# PlaySlot — Agent Instructions

## Required reading before any implementation

Before starting **any** new feature, bugfix, or refactor, read and analyze these documents in order:

1. [`/docs/PRD.md`](./docs/PRD.md) — product requirements, user flows, business rules
2. [`/docs/Tech.md`](./docs/Tech.md) — architecture, routing, auth, technical decisions
3. [`/docs/DB.md`](./docs/DB.md) — database schema, RLS, migrations

**Rules:**

- Do not implement features that contradict the PRD
- Do not introduce schema changes without updating `DB.md`
- Do not change architecture decisions without updating `Tech.md`
- Match existing conventions: Next.js App Router, Supabase RLS, shadcn/ui
- MVP scope: no online payments, no admin panel, no reviews, football only
<!-- END:playslot-project-rules -->
