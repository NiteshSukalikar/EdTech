# Architecture Diagrams & Visual Reference

## 🏗️ System Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (Browser)                      │
│  OverviewSection.tsx Component                                  │
│  - Renders stats grid                                           │
│  - Displays schedule                                            │
│  - Shows activity feed                                          │
└────────────────┬────────────────────────────────────────────────┘
                 │ Calls server action
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                   SERVER ACTION LAYER                            │
│  getDashboardMetricsAction()                                    │
│                                                                  │
│  Step 1: [Get Auth User]                                        │
│      ↓                                                           │
│  Step 2: [Check isAdmin(user)] ← NEW SECURITY LAYER            │
│      ↓                                                           │
│  Step 3: [Fetch Metrics] (only if admin)                       │
│      ↓                                                           │
│  Return: { success: boolean, data?, error?, status? }          │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ↓                 ↓
    (If Admin)      (If User/Error)
        │                 │
        ↓                 ↓
┌──────────────┐    ┌──────────────┐
│ Fetch Metrics│    │Return 403    │
│ (Enrollments)│    │Immediately   │
└──────────────┘    └──────────────┘
        │
        ↓
┌─────────────────────────────────────────────────────────────────┐
│              SERVICE LAYER (Data & Calculations)                │
│  fetchDashboardMetrics(token)                                  │
│  calculateDashboardStats()                                     │
│  calculateMonthlyChanges()                                     │
│  formatCurrency()                                              │
└────────────────┬────────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    ↓                         ↓
┌──────────────┐    ┌──────────────┐
│ Payments API │    │Enrollments API│
│ (Strapi)     │    │ (Strapi)      │
└──────────────┘    └──────────────┘
```

---

## 🔐 Authorization Flow (NEW!)

### Before: No Server-Side Authorization ❌

```
Client               Server              API
  │                   │                   │
  ├─ getMetrics()────→│                   │
  │                   ├─ fetchAll()──────→│
  │                   │                   │
  │                   │←─ 403 Error ──────│
  │←─ Error message───┤ (To User!)        │
  │                   │                   │
```

**Problem:** Client gets exposed to 403 error, confusing experience.

---

### After: Server-Side Authorization ✅

```
Client                Server                API
  │                     │                     │
  ├─ getMetrics()──────→│                     │
  │                     ├─ getAuthUser()      │
  │                     │ ✅ Check isAdmin()  │
  │                     │                     │
  │                     ├─ Is Admin? YES ─→   │
  │                     │                     ├─ fetchAll()──→
  │                     │                     │←─ Data ────→
  │←─ Success + Data────┤                     │
  │                     │                     │
  │                     │ Is Admin? NO        │
  │                     │ (Never calls API)   │
  │←─ 403 Immediate ────┤                     │
  │                     │                     │
```

**Benefit:** Non-admin users get friendly error immediately, no API call.

---

## 📊 Stats Data Flow

### Configuration-Driven Approach

```
USER REQUEST (Dashboard Page)
        │
        ↓
   OverviewSection Component
        │
        ├──────────────────────────────────┐
        ↓                                  ↓
   Check isAdmin?                   Check isAdmin?
        │                                  │
        ├─→ YES ←──────────────────────────┤
        │   │                              │
        │   ├─ Fetch Metrics               │
        │   │   (Server Action)            │
        │   │                              │
        │   └─→ buildAdminStats(metrics)   │
        │       (From lib/types/stats.config.ts)
        │                                  │
        │   ADMIN_STATS_CONFIG             │
        │   ├─ Total Enrollees             │
        │   ├─ Revenue                     │
        │   ├─ Completed                   │
        │   └─ In Progress                 │
        │                                  │
        └─→ NO ←─────────────────────────────┘
            │                              │
            └─ buildUserStats()            │
                (From lib/types/stats.config.ts)
                                           │
                USER_STATS_CONFIG          │
                ├─ Attendance              │
                ├─ Completed               │
                ├─ On Leave                │
                └─ Plan                    │
                           │
                           ↓
                    Render <StatCard>
                    Components in Grid
```

---

## 🔄 Role Determination Flow

### Old Way (Scattered, Fragile) ❌

```
app/dashboard/page.tsx
├─ const isAdmin = user.id === 1;  ❌

features/dashboard/OverviewSection.tsx
├─ {isAdmin && metrics}            ❌

features/dashboard/DashboardContent.tsx
├─ {isAdmin ?...}                  ❌

Other files...
├─ if (user.id === 1) {...}        ❌

PROBLEM: 5+ places to update when adding admin
```

---

### New Way (Centralized) ✅

```
lib/auth/roles.ts
├─ ADMIN_USER_IDS = [1]
├─ isAdmin(user) function ✅
├─ hasPermission(user, perm) function ✅
└─ ROLE_PERMISSIONS config ✅
        │
        ├─ app/dashboard/page.tsx
        │  └─ const isAdmin = isAdmin(user); ✅
        │
        ├─ features/dashboard/OverviewSection.tsx
        │  └─ if (isAdmin) {...} ✅
        │
        ├─ actions/dashboard/get-metrics.actions.ts
        │  └─ if (!isAdmin(user)) return 403; ✅
        │
        └─ All other files use the same function ✅

BENEFIT: Edit once, everywhere updates!
```

---

## 🚦 Request Processing Timeline

### Admin User Flow

```
Time  ┌─────────────────────────────────────────────┐
 0ms  │ Browser sends getDashboardMetricsAction()   │
      └────────────────┬────────────────────────────┘
                       │
 10ms ┌────────────────↓────────────────────────────┐
      │ Server: Get Auth User                       │
      │ ✅ SUCCESS: { id: 1, email: "admin@..." }   │
      └────────────────┬────────────────────────────┘
                       │
 15ms ┌────────────────↓────────────────────────────┐
      │ Server: isAdmin(user)                       │
      │ ✅ TRUE (user.id = 1)                       │
      └────────────────┬────────────────────────────┘
                       │
 20ms ┌────────────────↓────────────────────────────┐
      │ Server: fetchDashboardMetrics(token)        │
      └────────────────┬────────────────────────────┘
                       │
 50ms ┌────────────────↓────────────────────────────┐
      │ API: /api/payments                          │
      │ API: /api/enrollments                       │
      └────────────────┬────────────────────────────┘
                       │
200ms ┌────────────────↓────────────────────────────┐
      │ Server: Calculate metrics                   │
      │ (Single-pass calculation)                   │
      └────────────────┬────────────────────────────┘
                       │
205ms ┌────────────────↓────────────────────────────┐
      │ Return: {success: true, data: {...}}        │
      └────────────────┬────────────────────────────┘
                       │
210ms ┌────────────────↓────────────────────────────┐
      │ Browser: Render Admin Stats                 │
      │ ✅ Total Enrollees, Revenue, Completed     │
      └─────────────────────────────────────────────┘
```

### Regular User Flow (FASTER!)

```
Time  ┌─────────────────────────────────────────────┐
 0ms  │ Browser sends getDashboardMetricsAction()   │
      └────────────────┬────────────────────────────┘
                       │
 10ms ┌────────────────↓────────────────────────────┐
      │ Server: Get Auth User                       │
      │ ✅ SUCCESS: { id: 5, email: "user@..." }    │
      └────────────────┬────────────────────────────┘
                       │
 15ms ┌────────────────↓────────────────────────────┐
      │ Server: isAdmin(user)                       │
      │ ❌ FALSE (user.id ≠ 1)                      │
      └────────────────┬────────────────────────────┘
                       │
 17ms ┌────────────────↓────────────────────────────┐
      │ Return: {success: false, status: 403}       │
      │ (Never calls API! 183ms faster)             │
      └────────────────┬────────────────────────────┘
                       │
 22ms ┌────────────────↓────────────────────────────┐
      │ Browser: buildUserStats()                   │
      │ ✅ Attendance, Completed, On Leave, Plan    │
      └─────────────────────────────────────────────┘
```

---

## 🔑 Key Components & Their Responsibilities

```
┌─────────────────────────────────────────────────┐
│ lib/auth/roles.ts                               │
│ ────────────────────────────────────────────    │
│ Responsibility: User role management            │
│                                                  │
│ Exports:                                        │
│  • isAdmin(user)                    [Function]  │
│  • hasPermission(user, perm)        [Function]  │
│  • requirePermission(user, perm)    [Function]  │
│  • getUserRole(user)                [Function]  │
│  • ROLE_PERMISSIONS                 [Config]    │
│                                                  │
│ Used by: Server actions, components             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ lib/types/stats.config.ts                       │
│ ────────────────────────────────────────────    │
│ Responsibility: Stat definitions & builders     │
│                                                  │
│ Exports:                                        │
│  • ADMIN_STATS_CONFIG               [Config]    │
│  • USER_STATS_CONFIG                [Config]    │
│  • buildAdminStats(metrics)         [Function]  │
│  • buildUserStats()                 [Function]  │
│  • formatMetricValue()              [Function]  │
│                                                  │
│ Used by: OverviewSection component              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ actions/dashboard/get-metrics.actions.ts        │
│ ────────────────────────────────────────────    │
│ Responsibility: Server-side authorization       │
│                                                  │
│ Exports:                                        │
│  • getDashboardMetricsAction()      [Function]  │
│                                                  │
│ Validates:                                      │
│  1. User is authenticated (401)                 │
│  2. User is admin (403)                         │
│  3. Fetches metrics (success)                   │
│                                                  │
│ Used by: OverviewSection component              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ features/dashboard/OverviewSection.tsx          │
│ ────────────────────────────────────────────    │
│ Responsibility: UI rendering & error handling   │
│                                                  │
│ Does:                                           │
│  1. Calls getDashboardMetricsAction()           │
│  2. Handles success/error responses             │
│  3. Classifies error types (401, 403, 500)      │
│  4. Renders appropriate UI                      │
│                                                  │
│ No business logic here (extractedout)           │
└─────────────────────────────────────────────────┘
```

---

## 🔗 Data Flow Example: Admin Viewing Dashboard

```
STEP 1: User loads /dashboard
   └─→ app/dashboard/page.tsx
       └─→ isAdmin(user) from roles.ts
           └─→ Returns true for user ID 1
               └─→ Renders <AdminDashboard />

STEP 2: AdminDashboard renders
   └─→ <OverviewSection isAdmin={true} />

STEP 3: OverviewSection mounts
   └─→ Calls getDashboardMetricsAction()

STEP 4: Server Action runs
   └─→ Check authentication
       ├─→ ✅ User is authenticated
       └─→ Check authorization (isAdmin)
           ├─→ ✅ User is admin
           └─→ Fetch metrics from API
               ├─→ GET /api/payments
               ├─→ GET /api/enrollments
               └─→ Calculate stats (single pass)
                   └─→ Return { success: true, data: {...} }

STEP 5: Component receives response
   └─→ buildAdminStats(metrics)
       └─→ ADMIN_STATS_CONFIG
           ├─→ Total Enrollees: 145
           ├─→ Revenue: ₦2,450,000
           ├─→ Completed: 89 (61.3%)
           └─→ In Progress: 56 (38.7%)

STEP 6: Component renders
   └─→ <StatCard> grid
       ├─→ Card 1: Total Enrollees (145)
       ├─→ Card 2: Revenue (₦2,450,000)
       ├─→ Card 3: Completed (61.3%)
       └─→ Card 4: In Progress (38.7%)
```

---

## 🔗 Data Flow Example: Regular User Viewing Dashboard

```
STEP 1: User loads /dashboard
   └─→ app/dashboard/page.tsx
       └─→ isAdmin(user) from roles.ts
           └─→ Returns false for user ID 5+
               └─→ Renders <UserDashboard />

STEP 2: UserDashboard renders
   └─→ <OverviewSection isAdmin={false} />

STEP 3: OverviewSection mounts
   └─→ Early return in useEffect (isAdmin = false)
       └─→ Skip metrics fetch

STEP 4: Component calls buildStats()
   └─→ isAdmin = false
       └─→ buildUserStats()
           └─→ USER_STATS_CONFIG
               ├─→ Attendance: 90%
               ├─→ Completed: 3
               ├─→ On Leave: 2
               └─→ Plan: Monthly

STEP 5: Component renders
   └─→ <StatCard> grid
       ├─→ Card 1: Attendance (90%)
       ├─→ Card 2: Completed (3)
       ├─→ Card 3: On Leave (2)
       └─→ Card 4: Plan (Monthly)

RESULT:
✅ No admin metrics fetched
✅ No API calls made
✅ Correct stats for user role
✅ Instant rendering (no loading)
```

---

## 📈 Architecture Evolution

```
Version 1.0 (Original)
├─ Hardcoded role check
├─ No authorization layer
├─ Stats in component JSX
├─ Generic error handling
└─ Difficult to extend

           ↓ REFACTORING ↓

Version 2.0 (Current - Production Ready) ✅
├─ Centralized role management
├─ Server-side authorization
├─ Configuration-driven stats
├─ Classified error handling
├─ Extensible architecture
├─ Full TypeScript support
├─ Security best practices
├─ Clear separation of concerns
└─ Future-proof design

           ↓ FUTURE ENHANCEMENTS ↓

Version 3.0+ (Planned)
├─ Database-driven roles
├─ JWT token claims
├─ Permission inheritance
├─ Metrics caching (TTL)
├─ Audit logging
├─ Role-based API rate limiting
└─ Multi-tenant support
```

---

**These diagrams help visualize how the new architecture works together. Refer back to them when implementing new features or making changes.**

