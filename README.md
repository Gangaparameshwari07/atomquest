# AtomQuest 🎯

I built **AtomQuest** for the Atomberg Hackathon 1.0 to solve a real problem: how do you let 10,000+ employees set meaningful quarterly goals while giving managers visibility into progress and admins control over the process?

The result is a full-stack application where employees map out their OKRs, managers review and approve them, and admins track everything with an immutable audit trail.

**[Live Link](https://atomquest-fk8e.vercel.app/)** | **[GitHub](https://github.com/Gangaparameshwari07/atomquest)**

---

## 🕹️ Try It Live

No login credentials needed—just click a role card on the landing page.

- **Employee:** `rahul@atomquest.com` — Create goals, track Q1-Q4 achievements, see your score
- **Manager:** `manager@atomquest.com` — Review your team's goals, approve them, add quarterly feedback
- **Admin:** `admin@atomquest.com` — Manage cycles, unlock goals for edits, push KPIs to teams, check the audit log

### Demo Data
- **6 Users** across 3 roles (EMPLOYEE, MANAGER, ADMIN)
- **10 Approved Goals** ready for check-ins
- **2 Cycles** (Q1 + Q2) with rich achievement data
- **Pre-populated** with 10+ audit trail events

---

---

## 🌟 What I Built

**Goal Management**
- Employees create up to 8 goals per cycle with real-time weightage validation (must total 100%)
- Each goal has a thrust area (Revenue, Customer Success, Ops, Innovation, People) and a Unit of Measure type

**Scoring Engine**
- Supports 4 UoM types: Higher Better, Lower Better, Timeline, and Zero-Based
- Quarterly check-ins let you enter actual values; scores compute automatically with built-in guards against NaN/Infinity

**Manager Approval Workflow**
- Inline editing to modify targets or weightages before approving
- Can lock goals once approved, or return them to the employee for rework

**Admin Controls**
- Manage goal-setting cycles and their phases
- Unlock approved goals for emergency edits
- Push shared KPIs to multiple employees (read-only for recipients, but they can adjust their own weightage)
- View analytics: trend lines, status distribution, department heatmaps

**Audit Trail**
- Every change is logged: who made it, when, and the old → new values
- Useful for compliance and understanding what changed and why

---

## 🛠️ Built With

- **Frontend:** Next.js 14 (React 19, TypeScript, Server Components)
- **Backend:** Server Actions (no separate API needed)
- **Database:** Prisma ORM + Supabase PostgreSQL
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts for analytics
- **UI Elements:** Lucide React icons
- **Notifications:** React Hot Toast
- **Export:** XLSX for Excel/CSV reports
- **Deployment:** Vercel (free tier)

---

## 🧠 Challenges & How I Fixed Them

**Math Edge Cases**
While testing, I discovered that if a user entered `0` as the target value, the score computation would throw `Infinity` or `NaN` errors. I added strict guards in `src/lib/logic.ts` (lines 84–85) to ensure invalid inputs gracefully default to `0%` or `100%` depending on the UoM type.

**Manager Approval with Mixed Goal Statuses**
The tricky part: an employee might have 5 goals (3 submitted, 2 still in draft). The manager should only be able to approve the 3 submitted ones, and the total weightage check should only consider those. I had to filter by status before calculating totals in `ApprovalClient.tsx`.

**Shared KPIs & Read-Only Fields**
When an admin pushes a KPI to employees, the title and target must stay locked so all recipients stay in sync. But employees need to adjust their own weightage. I solved this by rendering the title/target as disabled inputs and only enabling the weightage field. This took a bit of trial-and-error with Tailwind classes to get the visual feedback right.

---

## 📊 System Design

```
Browser (Next.js UI)
    ↓
Vercel Edge (Server Components + Actions)
    ↓
Prisma ORM (Type-safe database layer)
    ↓
Supabase PostgreSQL (with Session Pooler for connection efficiency)
```

Type safety flows end-to-end—TypeScript ensures the frontend and backend never talk past each other.

---

## 🚀 Quick Start

### Local Development

```bash
git clone https://github.com/Gangaparameshwari07/atomquest.git
cd atomquest

# Install dependencies
npm install

# Set up your database
# Copy your Supabase PostgreSQL URL to .env.local
# DATABASE_URL=postgresql://...

npx prisma migrate deploy
npx prisma db seed

# Run the dev server
npm run dev
# Open http://localhost:3000
```

### Deploy to Vercel

```bash
vercel login
vercel link
vercel env add DATABASE_URL
# Paste your Supabase PostgreSQL URL
vercel deploy --prod
```

---

## 📁 Project Structure

```
atomquest/
├── src/app/
│   ├── page.tsx              # Login with role cards
│   ├── layout.tsx            # Root layout + Toaster
│   └── dashboard/
│       ├── page.tsx          # Dashboard home (stats)
│       ├── goals/            # Employee goal CRUD
│       ├── checkins/         # Quarterly achievements
│       ├── team/             # Manager approval workflow
│       ├── admin/            # Cycles, unlock, shared KPIs, escalations
│       ├── analytics/        # Recharts dashboards
│       ├── reports/          # Excel/CSV export
│       └── audit/            # Audit trail viewer
├── src/lib/
│   ├── logic.ts              # Goal validation + score computation
│   ├── prisma.ts             # ORM client
│   ├── session.ts            # Auth context (role switcher)
│   └── notifications.ts      # In-app toast alerts
├── prisma/
│   ├── schema.prisma         # Data model
│   └── seed.ts               # Demo data (6 users, 10 goals)
└── README.md
```

---

## 🎯 Demo Data

The seed script loads:
- 6 users across 3 roles (Employee, Manager, Admin)
- 10 approved goals with diverse thrust areas
- 2 cycles (Q1 + Q2) with achievement data
- 10+ audit log entries

---

## 📝 Key Files

**Goal Validation & Scoring**
- `src/lib/logic.ts` — All validation rules and UoM score formulas

**Manager Approval**
- `src/app/dashboard/team/[employeeId]/ApprovalClient.tsx` — The tricky logic for bulk approvals

**Audit Middleware**
- `src/lib/actions.ts` — Logs every change to the audit trail

---

## ✅ Testing

I manually tested:
- All 3 role workflows (employee → manager → admin)
- Edge cases: targets of 0, mixed goal statuses, shared KPI edits
- Stress scenarios: bulk approvals, rapid goal updates, large datasets
- UI responsiveness on mobile browsers

All features work without console errors on the live URL.

---

## 📦 Environment Variables

Create a `.env.local` file locally:

```
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres?sslmode=require
```

For Vercel, add `DATABASE_URL` in Project Settings → Environment Variables.

**.env is git-ignored** — secrets never reach GitHub.

---

## 🏗️ Architecture Decisions

**Why Next.js + Server Actions?**
- No separate backend server to manage
- Type-safe client-server boundary
- Deployment simplicity (everything on Vercel)

**Why Prisma + Supabase?**
- Prisma auto-generates types from schema
- Supabase PostgreSQL is free and reliable
- Session Pooler reduces connection overhead

**Why Tailwind CSS?**
- Fast, utility-first styling
- Gradient backgrounds for polish
- No extra CSS libraries to maintain

---

## 🎉 What's Next?

This was built in a tight hackathon window. If I had more time, I'd add:
- Real OAuth integration (Azure AD, Google)
- WebSocket updates for real-time goal changes
- Bulk CSV import for seeding goals
- Mobile app (React Native)
- Email digests (weekly summary)

But for now, the core OKR workflow is solid and production-ready.

---

## 📄 License

MIT

---

Built for **Atomberg Hackathon 1.0** | May 2025
