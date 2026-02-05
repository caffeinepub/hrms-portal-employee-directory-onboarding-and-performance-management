# Specification

## Summary
**Goal:** Ensure Jayesh Deshmukh’s employee profile and appraisal data are available after sign-in, and fix the onboarding questionnaire so it loads reliably for non-admin users.

**Planned changes:**
- Add idempotent backend seed logic to create/link an employee profile for “Jayesh Deshmukh” so auto-resolution after sign-in returns a valid employeeId and prevents an empty My Profile page.
- Extend the employee profile model to store an external Employee ID field and seed Jayesh’s value as “EMP1024”, including a safe schema upgrade/migration so existing records remain readable.
- Seed Jayesh Deshmukh’s performance appraisal record for April 2025 – March 2026 (including the provided ratings, criteria list, and feedback list) and ensure the Appraisal UI loads and displays it for Jayesh.
- Replace onboarding questionnaire questions with the exact provided ordered list of 15 questions, and update the onboarding questionnaire flow to avoid admin-only dependencies for non-admin users and to show a clear English error/empty state instead of infinite loading when prerequisites are missing.

**User-visible outcome:** Logging in as “Jayesh Deshmukh” shows a populated profile (including external Employee ID “EMP1024”), the Performance → Appraisal page displays Jayesh’s seeded annual appraisal details, and the onboarding questionnaire reliably loads the 15 questions for non-admin users with clear error handling when needed.
