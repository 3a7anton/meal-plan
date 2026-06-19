# Product Requirements Document (PRD)
## Office Meal Planning System

**Version:** 1.0  
**Date:** March 2026  
**Status:** Draft  
**Prepared for:** AI-Assisted Development via VS Code IDE

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Database Schema](#5-database-schema)
6. [Feature Specifications](#6-feature-specifications)
7. [API Endpoints](#7-api-endpoints)
8. [UI/UX Requirements](#8-uiux-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Development Phases & Milestones](#10-development-phases--milestones)
11. [AI Development Prompting Guide](#11-ai-development-prompting-guide)

---

## 1. Project Overview

### 1.1 Background

Employees in an office environment currently order breakfast and lunch without a centralized system, causing booking conflicts, meal waste, and scheduling friction. The Office Meal Planning System solves this by providing a structured, real-time platform for browsing menus, booking meals, managing conflicts, and giving administrators full control over the process.

### 1.2 Scope

A full-stack web application with:
- Employee-facing meal booking portal
- Admin control panel
- Real-time conflict detection and notifications
- Central and personal booking dashboards

### 1.3 Users

| Role | Description |
|------|-------------|
| **Employee** | Books, views, and cancels their own meals |
| **Admin** | Manages menus, approves/denies bookings, manages users |

---

## 2. Goals & Success Metrics

### Goals
- Eliminate double-booking conflicts for meal time slots
- Provide full visibility of daily meal availability to all employees
- Give admins granular control over meal management
- Enable real-time notifications for booking events

### Success Metrics
- Zero double-booking conflicts after go-live
- 90%+ booking confirmation rate within 5 minutes
- Admin can approve/deny bookings within 2 clicks
- System handles 200 concurrent users without degradation

---

## 3. Tech Stack

### 3.1 Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite | React 18, Vite 5 |
| Backend | Node.js Serverless Functions | Node 20 LTS |
| Database | Supabase (PostgreSQL + Realtime) | Latest |
| Auth | Supabase Auth | Built-in |
| Hosting | Vercel | Latest |
| Styling | Tailwind CSS | v3 |
| State Management | Zustand | v4 |
| Form Handling | React Hook Form + Zod | Latest |
| HTTP Client | Axios or Fetch API | - |

### 3.2 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Vercel                           │
│  ┌─────────────────┐    ┌─────────────────────────┐ │
│  │  React + Vite   │    │  Serverless Functions   │ │
│  │  (Frontend SPA) │◄──►│  /api/* (Node.js)       │ │
│  └─────────────────┘    └────────────┬────────────┘ │
└───────────────────────────────────────┼─────────────┘
                                        │
                          ┌─────────────▼──────────────┐
                          │         Supabase           │
                          │  PostgreSQL + Realtime +   │
                          │  Auth + Storage            │
                          └────────────────────────────┘
```

### 3.3 Supabase Services Used

- **PostgreSQL** — primary database
- **Supabase Auth** — user authentication and session management
- **Realtime** — live updates for slot availability and notifications
- **Row Level Security (RLS)** — data access control per role
- **Edge Functions** (optional) — complex server-side logic

---

## 4. Project Structure

```
office-meal-planner/
├── src/                          # Frontend (React + Vite)
│   ├── assets/
│   ├── components/
│   │   ├── ui/                   # Shared UI components
│   │   ├── admin/                # Admin-specific components
│   │   └── employee/             # Employee-specific components
│   ├── hooks/                    # Custom React hooks
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── employee/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── MenuPage.jsx
│   │   │   └── BookingsPage.jsx
│   │   └── admin/
│   │       ├── AdminDashboardPage.jsx
│   │       ├── MenuManagementPage.jsx
│   │       ├── BookingManagementPage.jsx
│   │       └── UserManagementPage.jsx
│   ├── store/                    # Zustand state stores
│   ├── lib/
│   │   ├── supabaseClient.js     # Supabase client init
│   │   └── utils.js
│   ├── App.jsx
│   └── main.jsx
├── api/                          # Serverless functions (Vercel)
│   ├── bookings/
│   │   ├── create.js
│   │   ├── cancel.js
│   │   └── list.js
│   ├── meals/
│   │   ├── index.js
│   │   └── [id].js
│   └── admin/
│       ├── approve.js
│       ├── deny.js
│       └── users.js
├── supabase/
│   ├── migrations/               # SQL migrations
│   └── seed.sql                  # Seed data
├── .env.local
├── vercel.json
├── vite.config.js
└── package.json
```

---

## 5. Database Schema

### 5.1 Tables

#### `profiles` (extends Supabase auth.users)
```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  department  TEXT,
  role        TEXT NOT NULL DEFAULT 'employee', -- 'employee' | 'admin'
  dietary_preferences TEXT[],                   -- e.g. ['vegetarian', 'halal']
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

#### `meals`
```sql
CREATE TABLE meals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  meal_type   TEXT NOT NULL,     -- 'breakfast' | 'lunch'
  dietary_tags TEXT[],           -- e.g. ['halal', 'vegetarian']
  image_url   TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

#### `menu_schedules`
```sql
CREATE TABLE menu_schedules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id      UUID REFERENCES meals(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  time_slot    TEXT NOT NULL,    -- e.g. '08:00', '09:00', '12:00', '13:00'
  capacity     INT NOT NULL DEFAULT 10,
  is_available BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (meal_id, scheduled_date, time_slot)
);
```

#### `bookings`
```sql
CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES profiles(id) ON DELETE CASCADE,
  menu_schedule_id  UUID REFERENCES menu_schedules(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'denied' | 'cancelled'
  notes             TEXT,
  booked_at         TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, menu_schedule_id)
);
```

#### `notifications`
```sql
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,       -- 'booking_confirmed' | 'booking_denied' | 'conflict' | 'reminder' | 'cancelled'
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.2 Row Level Security Policies

```sql
-- Employees can only see and manage their own bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_own_bookings" ON bookings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admins_all_bookings" ON bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Notifications visible only to owner
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);
```

---

## 6. Feature Specifications

### 6.1 Authentication

**F-AUTH-01: User Login**
- Email/password login via Supabase Auth
- On success, redirect based on role (`/dashboard` for employee, `/admin` for admin)
- Session persisted via Supabase session tokens

**F-AUTH-02: User Registration**
- Fields: Full Name, Email, Password, Department, Dietary Preferences
- Role defaults to `employee`; admin accounts are created by existing admins
- Email confirmation required before access

**F-AUTH-03: Protected Routes**
- All routes except `/login` and `/register` require authentication
- Admin routes (`/admin/*`) require `role === 'admin'`
- Unauthorized access redirects to login

---

### 6.2 Employee Features

**F-EMP-01: View Daily/Weekly Menu**
- Display meals grouped by date and meal type (breakfast / lunch)
- Show time slots, capacity remaining, and dietary tags per meal
- Allow filtering by meal type and dietary preference
- Default view: today's menu; navigation to past/future days

**F-EMP-02: Book a Meal**
- Employee selects a meal from the schedule
- System checks: slot capacity > 0 AND employee has no confirmed booking at same time
- On conflict: show warning with details of the conflicting booking
- On success: booking created with `status = 'pending'`; notification sent

**F-EMP-03: Cancel a Booking**
- Employee can cancel any of their bookings with `status = 'pending'` or `'confirmed'`
- Cancellation allowed only if > 1 hour before the meal time slot
- Booking status updated to `'cancelled'`; slot capacity restored

**F-EMP-04: Personal Dashboard**
- List of upcoming bookings with status badges
- History of past bookings
- Notification bell with unread count
- Quick-cancel action on pending/confirmed upcoming bookings

**F-EMP-05: Conflict Detection**
- Real-time check when browsing: if a slot is full, display "Full" badge
- Pre-booking check: warn if employee already has a booking at the same time on the same day
- After booking: if the slot reaches capacity and others are in `pending`, admin is notified

---

### 6.3 Central Dashboard (All Users)

**F-CENT-01: Company-Wide Meal Board**
- View for all employees showing the day's meal schedule
- Each time slot shows: meal name, capacity, number of confirmed bookings, remaining slots
- Color indicators: Green (available), Yellow (limited ≤ 3 left), Red (full)
- Real-time updates via Supabase Realtime subscriptions

**F-CENT-02: Conflict Alerts**
- System-level alert banner shown when a slot is overbooked (pending bookings exceed capacity)
- Admin-only: list of all conflict cases with action buttons

---

### 6.4 Notification System

**F-NOTIF-01: In-App Notifications**
- Bell icon in navbar with unread count badge
- Dropdown showing last 10 notifications with timestamps
- Mark as read individually or all at once

**F-NOTIF-02: Notification Events**

| Event | Recipient | Message |
|-------|-----------|---------|
| Booking submitted | Employee | "Your booking for [Meal] at [Time] is pending approval." |
| Booking confirmed | Employee | "Your booking for [Meal] at [Time] has been confirmed." |
| Booking denied | Employee | "Your booking for [Meal] at [Time] was denied." |
| Booking cancelled | Employee | "Your booking for [Meal] at [Time] has been cancelled." |
| Slot nearly full | Employee | "[Meal] at [Time] has only [N] spots left." |
| Conflict detected | Admin | "Slot [Time] for [Meal] has exceeded capacity." |

---

### 6.5 Admin Features

**F-ADMIN-01: Admin Dashboard**
- Summary cards: total bookings today, pending approvals, confirmed, cancelled
- List of today's pending bookings sorted by submission time
- Conflict alerts section

**F-ADMIN-02: Menu Management**
- Create, edit, delete meals (name, description, type, tags, image)
- Schedule meals to specific dates and time slots with capacity limits
- Toggle meal availability on/off
- View weekly schedule in calendar view

**F-ADMIN-03: Booking Management**
- View all bookings filterable by date, status, meal, department
- Approve (confirm) or deny individual bookings
- Bulk approve: confirm all pending for a given slot
- Remove/cancel any booking with reason field
- Export bookings to CSV

**F-ADMIN-04: Conflict Resolution**
- View all slots where pending + confirmed > capacity
- One-click to deny excess pending bookings
- Manually adjust slot capacity

**F-ADMIN-05: User Management**
- View all registered users with role and status
- Deactivate/reactivate user accounts
- Promote employee to admin or demote admin to employee
- View booking history per user

**F-ADMIN-06: Reporting**
- Daily/weekly booking summary chart
- Most popular meals by booking count
- Cancellation and no-show rates
- Per-department meal usage breakdown

---

## 7. API Endpoints

All endpoints live under `/api/` and are Vercel Serverless Functions.

### Authentication (handled by Supabase Auth directly from frontend)

### Bookings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bookings` | List current user's bookings | Employee |
| POST | `/api/bookings/create` | Create a new booking | Employee |
| PATCH | `/api/bookings/cancel` | Cancel a booking | Employee |
| GET | `/api/admin/bookings` | List all bookings (filterable) | Admin |
| PATCH | `/api/admin/bookings/approve` | Approve a booking | Admin |
| PATCH | `/api/admin/bookings/deny` | Deny a booking | Admin |
| DELETE | `/api/admin/bookings/remove` | Remove a booking | Admin |

### Meals & Schedules

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/meals` | List all active meals | Employee |
| GET | `/api/meals/schedule` | Get scheduled meals by date range | Employee |
| POST | `/api/admin/meals` | Create a meal | Admin |
| PUT | `/api/admin/meals/[id]` | Update a meal | Admin |
| DELETE | `/api/admin/meals/[id]` | Delete a meal | Admin |
| POST | `/api/admin/schedule` | Schedule a meal to a date/slot | Admin |
| PUT | `/api/admin/schedule/[id]` | Edit a scheduled slot | Admin |

### Users (Admin only)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/users` | List all users | Admin |
| PATCH | `/api/admin/users/[id]` | Update user role or status | Admin |

### Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | List user's notifications | Employee |
| PATCH | `/api/notifications/read` | Mark notification(s) as read | Employee |

---

## 8. UI/UX Requirements

### 8.1 General

- Fully responsive: desktop-first, mobile-friendly
- Color theme: professional and clean (white background, primary blue accent)
- Status badges use consistent color system: pending=yellow, confirmed=green, denied=red, cancelled=grey
- Loading skeletons for async data fetches
- Toast notifications for user actions (success/error)

### 8.2 Page Layouts

**Login / Register**
- Centered card layout
- Logo/branding at top
- Minimal form fields

**Employee Dashboard**
- Top navbar with notification bell, user avatar, logout
- Left sidebar with navigation links
- Main content area: bookings cards + today's menu summary

**Admin Panel**
- Top navbar + sidebar identical in structure to employee
- Admin sidebar has additional links: Menu Management, Booking Management, Users, Reports
- Data tables with sort, filter, and pagination

**Menu Page (Employee)**
- Date picker at top to select day
- Cards grid showing meals grouped by breakfast / lunch
- Each card: meal image, name, dietary tags, time slots with availability indicator, Book button

**Central Board**
- Full-width table or card grid showing all slots for the day
- Color-coded capacity indicators
- Auto-refreshes via Realtime subscription

### 8.3 Accessibility

- All interactive elements keyboard accessible
- ARIA labels on icon buttons
- Sufficient color contrast ratios (WCAG AA)

---

## 9. Non-Functional Requirements

### 9.1 Performance
- Initial page load < 2 seconds on standard broadband
- API response time < 500ms for all endpoints
- Vite build optimized with code splitting per route

### 9.2 Security
- All API routes validate JWT from Supabase Auth before processing
- RLS enforced at the database level as a secondary security layer
- Input validation via Zod on both frontend and backend
- No sensitive data (passwords, tokens) stored in localStorage

### 9.3 Scalability
- Serverless architecture scales automatically with Vercel
- Supabase handles connection pooling
- Realtime subscriptions scoped to relevant channels to minimize overhead

### 9.4 Reliability
- Vercel offers 99.99% uptime SLA
- Supabase managed PostgreSQL with daily backups
- Error boundary components in React to prevent full app crashes

### 9.5 Environment Configuration

```
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only
```

---

## 10. Development Phases & Milestones

### Phase 1 — Foundation (Week 1–2)
- [ ] Initialize Vite + React project
- [ ] Configure Tailwind CSS
- [ ] Set up Supabase project and create all tables with RLS
- [ ] Implement Supabase Auth (login, register, logout)
- [ ] Set up Vercel project and connect to GitHub repo
- [ ] Configure environment variables on Vercel
- [ ] Create protected route structure with role-based guards

### Phase 2 — Core Employee Features (Week 3–4)
- [ ] Menu browsing page with date navigation
- [ ] Meal booking flow with conflict detection
- [ ] Booking cancellation with time-based restriction
- [ ] Personal dashboard with booking list and status badges
- [ ] In-app notification system (bell + dropdown)

### Phase 3 — Real-Time & Central Board (Week 5)
- [ ] Supabase Realtime subscriptions for slot availability
- [ ] Central company-wide meal board with live capacity
- [ ] Color-coded slot indicators
- [ ] Conflict alert banners

### Phase 4 — Admin Panel (Week 6–7)
- [ ] Admin dashboard with summary metrics
- [ ] Menu and schedule management (CRUD)
- [ ] Booking management (approve, deny, remove, bulk actions)
- [ ] User management (role, status)
- [ ] CSV export for bookings

### Phase 5 — Reporting & Polish (Week 8)
- [ ] Reporting charts (recharts or chart.js)
- [ ] Mobile responsive refinements
- [ ] Error handling and empty states
- [ ] Toast notification system
- [ ] Final Vercel deployment and domain configuration

---

## 11. AI Development Prompting Guide

This section provides recommended prompts to use with AI tools (GitHub Copilot, Cursor, Claude) in VS Code when building each component. Use these as a starting point and adjust as needed.

### 11.1 Project Setup

```
Set up a new Vite + React project with Tailwind CSS, Zustand for state management,
React Hook Form with Zod validation, and Axios. Include a supabaseClient.js
file that initializes the Supabase client using environment variables
VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
```

### 11.2 Auth Pages

```
Create a LoginPage.jsx in React that uses Supabase Auth (supabase.auth.signInWithPassword).
On success, fetch the user's profile from the 'profiles' table and redirect to /admin
if role is 'admin', otherwise to /dashboard. Show error toasts on failure.
Use React Hook Form and Zod for validation.
```

### 11.3 Protected Routes

```
Create a ProtectedRoute component in React Router v6 that checks if the user is
authenticated via Supabase session. If not, redirect to /login. Accept an optional
'requiredRole' prop (e.g. 'admin') that checks the user's role from the profiles
table and redirects unauthorized users to /dashboard.
```

### 11.4 Menu Display

```
Create a MenuPage.jsx that fetches menu_schedules joined with meals from Supabase
for a given date. Display meals grouped by meal_type (breakfast, lunch) in a card grid.
Each card shows meal name, description, dietary_tags as badges, time_slot, and
remaining capacity (capacity minus confirmed bookings count). Include a date picker
to switch between days.
```

### 11.5 Booking Flow

```
Create a bookMeal serverless function in /api/bookings/create.js (Vercel).
It should: 1) Validate the JWT from the Authorization header using Supabase service role.
2) Check if the user already has a booking at the same time slot on that date.
3) Check if the slot still has capacity. 4) Insert the booking with status 'pending'.
5) Insert a notification for the user. Return appropriate error messages for conflicts.
```

### 11.6 Realtime Subscriptions

```
Create a custom React hook useSlotRealtime(scheduleId) that subscribes to Supabase
Realtime changes on the 'bookings' table filtered by menu_schedule_id. On any insert
or update event, re-fetch the current booking count for that slot and return
{ capacity, booked, remaining, isFull } to the component.
```

### 11.7 Admin Booking Table

```
Create an AdminBookingsTable.jsx component that fetches all bookings from Supabase,
joined with profiles (user full_name, department) and menu_schedules (date, time_slot,
meal name). Support filtering by status, date, and department via URL query params.
Include Approve and Deny buttons on each row that call PATCH /api/admin/bookings/approve
and /deny, then refetch the list. Add a CSV export button.
```

### 11.8 Notifications Bell

```
Create a NotificationBell.jsx component that fetches the current user's unread
notifications from Supabase on mount and subscribes to new inserts via Realtime.
Show a badge with unread count. On click, open a dropdown listing the last 10
notifications with type icons, message, and time. Include a "Mark all read" button
that calls PATCH /api/notifications/read.
```

### 11.9 Supabase RLS

```
Write Supabase RLS SQL policies for the 'bookings' table such that:
- Employees can SELECT, INSERT, and UPDATE (cancel) only their own bookings
- Admins (role = 'admin' in profiles table) can SELECT, UPDATE, and DELETE all bookings
- No user can DELETE their own bookings (only update to 'cancelled')
Test each policy by logging in as different users.
```

### 11.10 Reporting Charts

```
Create a ReportsPage.jsx for the admin panel using recharts. Include:
1) A BarChart showing total bookings per day for the current week.
2) A PieChart showing confirmed vs denied vs cancelled booking distribution.
3) A BarChart showing bookings per department.
Fetch data from Supabase using group-by queries via the Supabase JS client.
```

---

## Appendix

### A. Supabase Client Setup

```javascript
// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### B. Vercel Configuration

```json
// vercel.json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### C. Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.22.0",
    "@supabase/supabase-js": "^2.43.0",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.51.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "axios": "^1.6.0",
    "recharts": "^2.12.0",
    "react-hot-toast": "^2.4.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

*End of PRD — Office Meal Planning System v1.0*
