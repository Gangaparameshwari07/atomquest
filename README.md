# AtomQuest 🎯

**Goal Setting & Tracking Portal — Built for Atomberg Hackathon 1.0**

[![Vercel Deployment](https://img.shields.io/badge/Deployed-Vercel-blue)](https://atomquest.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-Next.js%2FPrisma%2FSupabase-blueviolet)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-green)](#)

**AtomQuest** is a full-stack Goal Setting & Tracking platform built for 10,000+ participants in the Atomberg Hackathon. It enables employees to set OKRs, managers to approve and review progress, and admins to oversee governance and escalations — all in real-time.

---

## 🚀 Quick Start for Judges

No password required. Just click any role card to explore the full feature set.

| **Role** | **Name** | **Email** | **What to Test** |
|----------|----------|-----------|------------------|
| **Employee** | Rahul Employee | rahul@atomquest.com | Create/edit goals, submit for approval, track achievements in check-ins |
| **Manager** | Priya Manager | manager@atomquest.com | Review team goals, approve/return, add quarterly check-in comments |
| **Admin** | Admin HR | admin@atomquest.com | Manage cycles, unlock goals, push shared KPIs, view analytics & audit logs |

**Live Demo:** [atomquest.vercel.app](https://atomquest.vercel.app)

### Demo Data
- **6 Users** across 3 roles (EMPLOYEE, MANAGER, ADMIN)
- **10 Approved Goals** ready for check-ins
- **2 Cycles** (Q1 + Q2) with rich achievement data
- **Pre-populated** with 10+ audit trail events

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Browser       │
│  (Next.js UI)   │
└────────┬────────┘
         │
    ┌────▼──────────────────┐
    │  Vercel Edge          │
    │  (Server Components)  │
    │  (Server Actions)     │
    └────┬───────────────────┘
         │
    ┌────▼─────────┐         ┌──────────────────┐
    │  Prisma ORM  │────────▶│ Supabase         │
    │  (Type-safe) │         │ PostgreSQL       │
    └──────────────┘         │ (Session Pooler) │
                             └──────────────────┘
```

### Tech Stack
- **Frontend:** Next.js 14 (React 19, App Router)
- **Database:** Supabase PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS v4 + custom gradients
- **Charts:** Recharts (analytics)
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Export:** XLSX (Excel/CSV)
- **Deployment:** Vercel (Free Tier)

### Cost: $0/month 💰
- **Vercel:** 100GB bandwidth included, unlimited requests
- **Supabase Free Tier:** 500MB Postgres, 5GB bandwidth
- **No external APIs required** for this MVP

---

## ✨ Features Matrix

| **Module** | **Feature** | **Status** | **Details** |
|-----------|-----------|----------|-----------|
| **Goal Setting** | Create/Edit/Delete goals | ✅ | Max 8 goals, min 10% weightage, total 100% |
| **Goal Setting** | Thrust Area selection | ✅ | 5 thrust areas: Revenue, Customer Success, Ops, Innovation, People |
| **Goal Setting** | UoM formulas (4 types) | ✅ | Higher Better, Lower Better, Timeline, Zero-Based |
| **Goal Setting** | Server-side validation | ✅ | Real-time client feedback + backend guards |
| **Manager Approval** | Review & approve goals | ✅ | Inline edit, return for rework, or approve+lock |
| **Manager Approval** | Weightage validation | ✅ | Blocks if <100% or individual goal <10% |
| **Quarterly Check-ins** | 4 quarters (Q1-Q4) | ✅ | Tabbed UI with actual vs target |
| **Check-ins** | Auto-scored achievements | ✅ | NaN/Infinity guards; scores 0-150% |
| **Check-ins** | Manager comments | ✅ | Per-quarter feedback from manager |
| **Shared Goals** | Push KPI to team | ✅ | Primary owner syncs; title/target read-only |
| **Audit Trail** | Full change log | ✅ | Who, what, when, old→new values |
| **Analytics** | QoQ trend lines | ✅ | Average score + goals tracked |
| **Analytics** | Status distribution | ✅ | Pie chart of goal statuses |
| **Analytics** | Department heatmap | ✅ | Completion by department |
| **Escalation** | Rule-based engine | ✅ | Simulated; extensible for real rules |
| **Reports** | Achievement export | ✅ | Excel with all check-in data |
| **Reports** | Completion export | ✅ | CSV of goal status by employee |
| **Notifications** | In-app bell | ✅ | Real-time count + dismissible toasts |

---

## 🎮 How to Test (Suggested Flow)

### 1. **Employee Workflow** (5 mins)
1. Login as **Rahul Employee**
2. Go to **My Goals** → see pre-populated 4 approved goals
3. Click **Check-ins** → select Q1 → enter actual values
4. Observe scores auto-compute with color coding
5. Click **Save All Q1 Achievements**
6. View **Audit Log** (Admin only) to see your edit

### 2. **Manager Workflow** (5 mins)
1. Logout → Login as **Priya Manager**
2. Go to **My Team** → see all reportees
3. Click on **Rahul Employee** → review his 4 goals
4. Edit a target value → click **Approve & Lock**
5. Go to **Q1 Check-in** tab → add a comment
6. View **Analytics** → see team trends

### 3. **Admin Workflow** (5 mins)
1. Logout → Login as **Admin HR**
2. Go to **Admin Panel** → manage cycles & phases
3. **Unlock Goals** tab → select a goal → unlock it
4. **Shared KPIs** → push a KPI to multiple employees
5. View **Analytics** (org-wide) → all departments
6. Check **Audit Trail** → see all actions with timestamps
7. View **Escalations** → see simulated escalation triggers

### 4. **Stress Tests** (Verify Fixes)
- **Math Edge Cases:** Math scores never show NaN/Infinity
- **Approval Validation:** Total must be exactly 100%
- **Audit Chain:** Unlock → Edit shows both actions
- **Shared Goals:** Title/target grey, weightage editable
- **Bulk Approval:** Only approve when ≥1 goal is SUBMITTED

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Environment variables (`.env.local`)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/USERNAME/atomquest.git
cd atomquest
npm install

# 2. Setup database
# Copy your Supabase DATABASE_URL to .env.local
DATABASE_URL=postgresql://...

# 3. Prisma setup
npx prisma migrate deploy    # Apply migrations
npx prisma db seed           # Load demo data

# 4. Run dev server
npm run dev
# Open http://localhost:3000
```

### Build & Deploy

```bash
npm run build       # Type-check + compile
npm run start       # Production server
npm run lint        # Check code style
```

---

## 🏛️ Architecture Highlights

### Type Safety (End-to-End)
- **TypeScript strict mode** for all code
- **Prisma schema** auto-generates types
- **Server actions** with type-safe payloads
- Zero `any` types in business logic

### Server-Side Validation
- Goal rules enforced in `src/lib/logic.ts`
- Middleware checks user permissions
- Audit middleware logs all mutations post-lock
- Database constraints prevent orphaned records

### Score Computation Engine
```typescript
// Handles all 4 UoM types + edge cases
computeScore(uomType, target, actual) → 0-150%
// Guards: NaN → 0, Infinity → 0, no negative scores
```

### Audit Trail Middleware
- Every POST/PUT/DELETE logs: actor, action, field, old→new
- **Immutable**: old logs never edited
- Queryable by goal, user, or action type

### Scalability Patterns
- **Server Actions** (no separate API)
- **Revalidate on Demand** for cache invalidation
- **Prisma Pooling** with Supabase for DB efficiency
- **Selective Includes** to avoid N+1 queries

---

## 📊 Data Model

### Core Entities
- **User** (EMPLOYEE, MANAGER, ADMIN) + reportee hierarchy
- **Cycle** (FY quarters) + phases (GOAL_SETTING → Q4_ANNUAL)
- **Goal** (target, weightage, status, locked flag)
- **Achievement** (actual, progressStatus, score per quarter)
- **CheckIn** (manager feedback per quarter)
- **AuditLog** (immutable change history)
- **Notification** (in-app alerts)
- **EscalationLog** (simulated triggers)

### Key Constraints
- Max 8 goals per employee per cycle
- Min 10%, max 100% weightage per goal
- Total 100% weightage enforcement
- Goals locked after manager approval
- Shared goal title/target read-only

---

## 🚀 Deployment to Vercel

### 1. Connect Repo
```bash
git push origin main
# Visit vercel.com → Import Project → Select atomquest
```

### 2. Set Environment Variables
```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

### 3. Deploy
```bash
vercel deploy --prod
```

### 4. Verify Live
- Visit deployment URL
- Test all 3 roles end-to-end
- Check database connectivity
- Verify Excel export works

---

## 🧪 Testing Edge Cases

### Math Safety
```typescript
// Target=0, Actual=0, UoM=Lower Better → 100% ✅
// Target=100, Actual=0, UoM=Higher Better → 0% ✅
// Invalid inputs → 0% (never NaN/Infinity) ✅
```

### Manager Approval
```typescript
// 5 goals: 3 SUBMITTED + 2 DRAFT
// Total = sum of SUBMITTED only → 100% ✅
// Approve button → only shows if ≥1 SUBMITTED ✅
```

### Shared Goals
```typescript
// Admin pushes KPI to 3 employees
// Title field → grey (disabled) ✅
// Target field → grey (disabled) ✅
// Weightage field → editable (enabled) ✅
// Purple badge + explanation text ✅
```

---

## 📚 Code Organization

```
atomquest/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── page.tsx           # Login page
│   │   ├── layout.tsx         # Root layout + Toaster
│   │   └── dashboard/
│   │       ├── page.tsx       # Dashboard home
│   │       ├── goals/         # Employee goal CRUD
│   │       ├── checkins/      # Achievement tracking
│   │       ├── team/          # Manager approval workflow
│   │       ├── admin/         # Admin panel (5 tabs)
│   │       ├── analytics/     # Recharts dashboards
│   │       ├── reports/       # Export workflows
│   │       └── audit/         # Audit trail view
│   ├── lib/
│   │   ├── logic.ts          # Validation + scoring
│   │   ├── prisma.ts         # ORM client
│   │   ├── session.ts        # Auth context
│   │   └── notifications.ts  # In-app alerts
│   └── globals.css           # Tailwind config
├── prisma/
│   ├── schema.prisma         # Data model
│   └── seed.ts               # Demo data
├── docs/
│   └── architecture.md       # Architecture diagram
├── README.md                 # This file
└── package.json
```

---

## 🎯 Future Roadmap

- [ ] **Azure AD Entra ID Integration** — Real SSO for enterprises
- [ ] **Microsoft Teams Adaptive Cards** — Goal updates in Teams channel
- [ ] **Real-time WebSocket** — Live notifications across sessions
- [ ] **Bulk Import via CSV** — Seed goals from file
- [ ] **Email Digests** — Weekly/monthly performance summaries
- [ ] **Mobile App** — React Native companion app
- [ ] **Goal Templates** — Pre-built goal libraries by role
- [ ] **Peer Reviews** — 360-degree feedback workflows
- [ ] **AI Insights** — Predictive completion scoring
- [ ] **Custom Metrics** — User-defined UoM types

---

## ✅ QA Checklist

Before marking done:
- [ ] Live URL loads in < 3 seconds
- [ ] All 3 roles work end-to-end without errors
- [ ] All 5 admin tabs functional
- [ ] All 4 charts render with data
- [ ] Excel export downloads correctly
- [ ] Audit log shows recent actions
- [ ] No console errors in DevTools
- [ ] Mobile responsive (functional)
- [ ] No NaN/Infinity in any score display
- [ ] Notification bell shows count

---

## 📝 License

MIT © Atomberg Hackathon 2025

---

## 🤝 Contributing

This is a hackathon project. For bugs or feature requests, please open an issue on GitHub.

---

**Last Updated:** May 17, 2025  
**Built for:** Atomberg Hackathon 1.0 (10,000 participants)  
**Status:** ✅ Production Ready
