# SDD ledger — plan: docs/superpowers/plans/2026-10-31-kalender-crud.md

Pre-flight: no shared interface conflicts between Task 1, 2, 3.
All tasks use types from Task 1 (AgendaKalender, isDateInEventRange, getCategoryMeta).

Task 1: complete (types/kalender.ts, supabase/kalender.ts, schema.sql; tests: npx tsc --noEmit -> 0 errors)
Task 2: complete (app/dashboard/page.tsx; tests: npx tsc --noEmit -> 0 errors)
Task 3: complete (app/kalender/page.tsx; tests: npx tsc --noEmit -> 0 errors)
Task 4: complete (verification: npx tsc --noEmit -> 0 errors, npm run build -> code 0)
Task 5: code review & refinements complete (fixed month navigation desync, multi-month event overlap filter, multi-day cross-month badge format, RFC 5545 iCal DTEND, date validation)
