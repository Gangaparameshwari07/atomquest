# AtomQuest Architecture Diagram

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Web Browser                             │  │
│  │  (React 19 + Next.js 14 - SSR + Interactive Components)   │  │
│  │                                                            │  │
│  │  ├─ Login Page (Animated gradient + role cards)           │  │
│  │  ├─ Dashboard (Stat cards with icons)                     │  │
│  │  ├─ Goal Sheet (CRUD + real-time validation)              │  │
│  │  ├─ Check-ins (4 quarters + score computation)            │  │
│  │  ├─ Manager Approval (Inline edit + approval workflow)    │  │
│  │  ├─ Admin Panel (Cycle mgmt, unlock, escalations, KPIs)   │  │
│  │  ├─ Analytics (Recharts - QoQ, status, heatmaps)          │  │
│  │  ├─ Reports (Excel/CSV export)                            │  │
│  │  └─ Audit Log (Immutable change history)                  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│               EDGE / SERVER LAYER (Vercel)                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │            Next.js 14 App Router                          │  │
│  │                                                            │  │
│  │  • Server Components (Page rendering)                     │  │
│  │  • Server Actions (Form handling)                         │  │
│  │  • API Routes (Optional REST)                             │  │
│  │  • ISR / On-Demand Revalidation                           │  │
│  │  • Edge Middleware (Auth + role checks)                   │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│               BUSINESS LOGIC LAYER                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ├─ src/lib/logic.ts                                       │  │
│  │  │  ├─ validateGoalSheet() - Weightage enforcement         │  │
│  │  │  ├─ computeScore() - 4 UoM formulas with guards         │  │
│  │  │  └─ GOAL_RULES - Constants                              │  │
│  │  │                                                         │  │
│  │  ├─ src/lib/session.ts                                     │  │
│  │  │  ├─ getCurrentUser() - Auth context                     │  │
│  │  │  ├─ setCurrentUser() - Role switching (demo)            │  │
│  │  │  └─ clearSession() - Logout                             │  │
│  │  │                                                         │  │
│  │  ├─ Server Actions (src/app/**/actions.ts)                │  │
│  │  │  ├─ createGoal, updateGoal, deleteGoal                 │  │
│  │  │  ├─ submitGoals, approveGoals, returnGoals             │  │
│  │  │  ├─ updateAchievement (check-in scores)                │  │
│  │  │  └─ Audit logging for every mutation                   │  │
│  │  │                                                         │  │
│  │  └─ src/lib/notifications.ts                               │  │
│  │     ├─ createNotification() - In-app alerts                │  │
│  │     └─ getNotifications() - Fetch unread                   │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│               DATA ACCESS LAYER (Prisma ORM)                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  prisma/schema.prisma                                     │  │
│  │  ├─ User (email, name, role, managerId)                   │  │
│  │  ├─ Cycle (name, phase, isActive, dates)                  │  │
│  │  ├─ ThrustArea (name, description)                        │  │
│  │  ├─ Goal (userId, cycleId, title, target, weightage...)  │  │
│  │  ├─ Achievement (goalId, quarter, actual, score)          │  │
│  │  ├─ CheckIn (employeeId, quarter, comment)                │  │
│  │  ├─ AuditLog (goalId, actorId, action, field, old/new)   │  │
│  │  ├─ Notification (userId, type, title, body)              │  │
│  │  └─ EscalationLog (rule, trigger, severity)               │  │
│  │                                                            │  │
│  │  Type-Safe Queries:                                       │  │
│  │  • findMany, findUnique, create, update, delete           │  │
│  │  • Relations auto-loaded via include/select               │  │
│  │  • Constraints enforced at DB level                       │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│             DATABASE LAYER (Supabase PostgreSQL)                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  Connection Pool: Session Pooler (Free Tier)              │  │
│  │  ├─ Max 100 concurrent connections                        │  │
│  │  ├─ Auto-scaling for peak load                            │  │
│  │  └─ Connection pooling reduces latency                    │  │
│  │                                                            │  │
│  │  Storage: 500MB (Free Tier)                               │  │
│  │  ├─ Current usage: ~50MB (6 users + demo data)            │  │
│  │  └─ Headroom for 10K users during hackathon               │  │
│  │                                                            │  │
│  │  Features:                                                │  │
│  │  ├─ Real-time subscriptions (via WebSockets)              │  │
│  │  ├─ Row-level security (future)                           │  │
│  │  ├─ Backup & restore                                      │  │
│  │  └─ Metrics & monitoring dashboard                        │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Cost Structure: 

```
VERCEL (Frontend Hosting)
├─ Free Tier: 100GB bandwidth, unlimited requests
├─ Auto-scales globally to 100+ regions
└─ Perfect for 10K concurrent users during hackathon

SUPABASE (Database)
├─ Free Tier: 500MB Postgres, 5GB bandwidth
├─ Session Pooler (included): Efficient connection management
└─ Scales to Pro ($25/mo) if needed post-hackathon

NO ADDITIONAL SERVICES
├─ No Auth0/Firebase (using session-based)
├─ No Resend/SendGrid (in-app notifications only)
├─ No external APIs required
└─ Everything bundled in free tiers
```

