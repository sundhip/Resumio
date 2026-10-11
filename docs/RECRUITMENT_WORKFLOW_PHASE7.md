# RESUMIO PHASE 7: RECRUITMENT WORKFLOW, INTERVIEWS, NOTIFICATIONS & DASHBOARDS

## 1. Executive Summary & Objective

In **Phase 7**, Resumio was upgraded with a robust, end-to-end **Recruitment Workflow Engine**, spanning:
1. Strict server-validated **Application Lifecycle Management** (`Applied` $\rightarrow$ `Under Review` $\rightarrow$ `Shortlisted` $\rightarrow$ `Rejected` / `Withdrawn`).
2. Recruiter applicant management with AI screening, match scores, filtering, and role-based access control.
3. Full **Interview Lifecycle Management** (Scheduling, Rescheduling, Cancellation, and Status updates) with conflict detection and candidate calendar views.
4. Persistent **In-App Notification Engine** with user isolation, unread counters, and dual-store MongoDB persistence.
5. Consolidated **Candidate & Recruiter Dashboards** backed exclusively by real aggregated database records.
6. Multi-tenant **Recruitment Analytics Engine** computing job applicant status breakdowns, 30-day time-series application trends, and AI score histograms.
7. Immutable **Audit Logging** (`AuditService`) capturing actors, actions, timestamps, and state transitions in both SQLite and MongoDB (`audit_logs`).

---

## 2. Application Lifecycle & State Transition Matrix

The server enforces deterministic transitions in `server/routes/applications.ts`:

```
          [ Applied ]
          /         \
         v           v
  [ Under Review ] -> [ Rejected ] (Terminal)
         |            ^
         v           /
  [ Shortlisted ] --+
         |
  [ Interview Scheduled / Completed ]
```

### Valid Status Transitions
| From Status | Allowed Next Statuses | Actor | Notes |
| :--- | :--- | :--- | :--- |
| `Applied` | `Under Review`, `Shortlisted`, `Rejected` | Recruiter | Candidate may also `Withdraw` |
| `Under Review` | `Shortlisted`, `Rejected` | Recruiter | Cannot jump back to `Applied` |
| `Shortlisted` | `Under Review`, `Rejected` | Recruiter | Eligible for Interview Scheduling |
| `Rejected` | None | None | Terminal state. Preserves rejection reason. |
| `Withdrawn` | None | None | Terminal state. Initiated by candidate only. |

Every status transition creates an immutable record in `application_status_history` and is logged in `audit_logs` (dual-stored in MongoDB).

---

## 3. Interview Lifecycle & Conflict Prevention

Interviews are managed via `InterviewService` with the following rules:
- **Supported Types**: `Video` (requires valid http/https URL), `Phone`, `In Person` (requires physical location).
- **Supported Statuses**: `Scheduled`, `Rescheduled`, `Completed`, `Cancelled`, `No Show`.
- **Validation**:
  - Positive duration ($0 < \text{duration} \le 480$ minutes).
  - Valid future datetime format.
  - Recruiter ownership check (403 Forbidden if recruiter does not own the job).
  - Status immutability (cannot reschedule completed or cancelled interviews).
  - History preservation (`interview_status_history` keeps original scheduled times, actors, and notes).

---

## 4. In-App Notification System & Dual-Store Persistence

The `NotificationService` emits event-driven in-app notifications:
- Supported events: `application_status`, `interview_scheduled`, `interview_rescheduled`, `interview_cancelled`, `interview_completed`, `interview_noshow`.
- Dual-store persistence: SQLite `notifications` table + MongoDB `notifications` collection.
- Security boundary: Queries enforce `WHERE user_id = ?`, preventing cross-tenant leakage.
- Mark as Read: Updates individual or bulk records in both SQLite and MongoDB.

---

## 5. Dashboard Metrics & Data Sources

### Candidate Dashboard (`DashboardService.getCandidateDashboard`)
- **Total Applications**: Count of records from `applications` for the candidate.
- **Status Breakdown**: Partitioned by status (`Applied`, `Under Review`, `Shortlisted`, etc.).
- **Upcoming Interviews**: Live interviews (`Scheduled` or `Rescheduled`) with scheduled time $\ge \text{now}$.
- **Recent Activity**: 5 most recent applications enriched with Phase 6 match scores.
- **Unread Notifications**: Live count from `notifications` table.

### Recruiter Dashboard (`DashboardService.getRecruiterDashboard`)
- **Active Jobs**: Published jobs owned by authenticated recruiter.
- **Pipeline Counts**: Total applicants across all owned jobs.
- **Upcoming Interviews**: Scheduled interviews for recruiter's jobs.
- **Top Candidates**: Ranked applicants sorted by `match_score DESC`.

---

## 6. Audit Logging (`AuditService`)

Audit records track key recruitment operations:
- **Columns**: `id`, `actor_id`, `actor_role`, `action`, `target_type`, `target_id`, `previous_state`, `new_state`, `reason`, `metadata_json`, `created_at`.
- Dual-stored in:
  - SQLite table `audit_logs`.
  - MongoDB Atlas collection `audit_logs`.

---

## 7. Verification & Master Test Suite Results

All 14 test suites pass with 100% success rate:
- Phase 7 suite: **56 / 56 tests passed (100%)** in `server/test-phase7.ts`.
- Master test suite: **14 / 14 suites passed (100%)** in `server/test-all.ts`.
- Frontend production build (`vite build`): **0 errors**.
- TypeScript typecheck (`tsc --noEmit`): **0 errors**.
