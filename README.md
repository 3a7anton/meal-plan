# 🍽️ Office Meal Planner

A full-stack web application for managing office meal bookings. Employees can browse daily menus and book meals, while admins can manage menus, approve/deny bookings, and view analytics reports.

**🔗 Live Demo:** [https://meal-plan-chi.vercel.app](https://meal-plan-chi.vercel.app)

---

## ✨ Features

### 👤 Employee Portal
- Browse daily menus with meal details
- Book meals with conflict detection
- View and manage personal bookings
- Real-time notifications
- Dietary preference filtering

### 🛠️ Admin Panel
- Dashboard with booking statistics & analytics
- Menu management (CRUD for meals & schedules)
- Booking approval / denial workflow
- User management & role assignment
- Reports & charts (Recharts)

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS |
| **State Management** | Zustand |
| **Database & Auth** | Supabase (PostgreSQL + Row Level Security) |
| **Forms & Validation** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Serverless API** | Vercel Functions (Node.js) |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account (for deployment)

### Setup

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/3a7anton/meal-planner.git
   cd meal-planner
   npm install
   ```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Open the SQL Editor and run: `supabase/migrations/001_initial_schema.sql`
   - *(Optional)* Run seed data: `supabase/seed.sql`
   - Enable **Email Auth** in Authentication settings

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then fill in your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```
meal-planner/
├── src/
│   ├── components/
│   │   ├── employee/      # Employee-facing components
│   │   └── ui/            # Reusable UI components
│   ├── lib/               # Supabase client & utilities
│   ├── pages/
│   │   ├── admin/         # Admin dashboard pages
│   │   ├── auth/          # Login & Register pages
│   │   └── employee/      # Employee portal pages
│   ├── store/             # Zustand state stores
│   └── types/             # TypeScript type definitions
│
├── api/                   # Vercel serverless functions
│   ├── admin/             # Admin actions (approve, deny, meals, users)
│   ├── bookings/          # Booking actions (create, cancel, list)
│   ├── meals/             # Meal & schedule management
│   └── notifications/     # Notification endpoints
│
├── supabase/
│   ├── migrations/        # Database schema SQL
│   └── seed.sql           # Sample seed data
│
├── public/                # Static assets
├── .env.example           # Environment variable template
└── vercel.json            # Vercel deployment config
```

---

## ☁️ Deployment

### Deploy to Vercel

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments on every push.

> Make sure to set all required environment variables in your Vercel project settings.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

© 2026 [Abu Ahad Anton](https://github.com/3a7anton)
