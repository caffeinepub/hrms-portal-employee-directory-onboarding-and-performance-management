# Specification

## Summary
**Goal:** Build an HRMS portal with Internet Identity authentication, role-based access, and core modules for employee data, onboarding, and performance management.

**Planned changes:**
- Add Internet Identity sign-in/sign-out and backend-enforced role-based access control for Admin/HR vs Employee, including first-login user creation.
- Implement persistent Employee Data storage with CRUD, searchable/filterable directory, and employee detail/profile views with role-based visibility.
- Implement Onboarding with templates, assignment to employees, task status tracking (Not started/In progress/Done), due dates, and optional notes/links.
- Implement Performance with employee goals (including progress updates) and review cycles (self-review input, admin/HR evaluation notes, finalize), with access control.
- Create core React screens and navigation (Dashboard, Employees, Onboarding, Performance) using React Query and consistent loading/empty/error states.
- Apply a coherent non-blue/purple visual theme using Tailwind + shadcn components across the app.
- Add required static images under `frontend/public/assets/generated/` and render them in appropriate UI locations (e.g., header/login and dashboard).

**User-visible outcome:** Users can log in with Internet Identity; Admin/HR can manage employees, onboarding, and performance reviews/goals, while employees can view their own profile, complete onboarding tasks, and update their own goal progress within a themed HRMS portal UI.
