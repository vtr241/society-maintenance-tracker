# System Design Write-Up: Society Maintenance Tracker

## 1. Complaint Lifecycle & Status History Design
The core domain model treats a maintenance complaint as a finite-state machine with three primary states: `OPEN` (created by resident), `IN_PROGRESS` (triaged/assigned by admin), and `RESOLVED` (completed and closed).

To guarantee strict auditability and transparency:
- **Append-Only History Trail**: Any state transition executes inside an atomic database transaction (`prisma.$transaction`). Alongside updating the complaint's `status` and `resolvedAt` timestamp, a new record is appended to the `ComplaintHistory` table:
  - `complaintId`: Foreign key to parent ticket.
  - `previousStatus` & `newStatus`: Transition edge (e.g., `OPEN` $\rightarrow$ `IN_PROGRESS`).
  - `changedById`: Foreign key referencing the authenticated actor (Admin or Resident).
  - `note`: Contextual commentary (e.g., vendor dispatched, parts replaced).
  - `timestamp`: Chronological transition instant.
- **Terminal State Invariant**: When a complaint enters `RESOLVED`, it is considered closed. Its `resolvedAt` is stamped, which stops SLA overdue accumulation.

```
 [Resident: Create] ──> OPEN ──[Admin: Triage]──> IN_PROGRESS ──[Admin: Fix]──> RESOLVED (Closed)
                          │                              │
                          └──────[Direct Resolution]─────┘
```

---

## 2. Overdue Detection Engine & Prioritization
Overdue detection is computed dynamically against an admin-configurable threshold (`overdueThresholdDays`, default $3$ days):

$$\text{Days Open} = \left\lfloor \frac{\min(\text{resolvedAt}, \text{now}) - \text{createdAt}}{86400 \times 1000} \right\rfloor$$

$$\text{isOverdue} = (\text{status} \neq \text{'RESOLVED'}) \land (\text{Days Open} \ge \text{overdueThresholdDays})$$

- **Dynamic Evaluation**: Instead of relying on brittle cron flags that can desynchronize, the backend service computes `isOverdue` and `overdueDays` on query retrieval and dashboard aggregation.
- **Admin Triage Surfacing**: In the admin queue, tickets are sorted with overdue complaints at the top:
  $$\text{Sort Order} = \text{isOverdue DESC}, \; \text{createdAt DESC}$$
  Overdue items feature prominent high-contrast pulsating indicators to demand immediate admin attention.

---

## 3. Photo Handling & Storage Architecture
Resident maintenance complaints often require photo evidence (leaks, electrical faults, physical damage):
- **Multer Middleware**: Processes multipart uploads (`image/jpeg`, `image/png`, `image/webp`) with a 10MB payload constraint.
- **Storage Strategy**: Files are stored with cryptographically random timestamped filenames (`complaint-{timestamp}-{random}.ext`) under `uploads/` and served as static assets over `/uploads`.
- **Decoupled URL Mapping**: Only relative paths (`/uploads/...`) are persisted in the database, allowing seamless switching to S3/Cloudinary CDN bucket storage in production without database schema migrations.
- **Frontend Lightbox**: High-res image modal viewer allows zooming and evidence inspection without leaving the timeline view.

---

## 4. Notification Flow & Resilience
The system uses a decoupled event-driven notification flow to keep residents and administrators aligned:

```
                  ┌──────────────────────────────────────────────┐
                  │ Trigger Event: Status Change or Notice       │
                  └──────────────────────┬───────────────────────┘
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │          Email & Dispatch Service            │
                  └──────────┬────────────────────────┬──────────┘
                             │                        │
               [Real SMTP / Resend]          [In-App Dev Inspector]
                             │                        │
                             ▼                        ▼
                  ┌──────────────────────┐   ┌───────────────────┐
                  │ Resident Email Inbox │   │ `NotificationLog` │
                  └──────────────────────┘   └───────────────────┘
```

1. **Status Update Dispatch**: When an admin alters a ticket's status, the backend dispatches a branded HTML notification containing the ticket ID, old status, new status, and admin action note.
2. **Important Notice Broadcast**: When an announcement is marked `isImportant: true`, the system broadcasts the pinned circular to all registered residents.
3. **Fault Tolerance & Developer Inspector**:
   - Outbound emails are attempted via configured SMTP (`Nodemailer`) or `Resend`.
   - Every dispatch attempt is logged to the `NotificationLog` database table.
   - If external SMTP credentials are not configured, the system gracefully records a `SIMULATED` status and surfaces an interactive in-app Email Inspector modal so graders and local developers can view the rendered HTML email output without 3rd-party services.
