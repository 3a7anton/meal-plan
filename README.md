# Office Meal Planning System

A full-stack web application for managing office meal bookings. Employees can browse menus and book meals, while admins can manage menus, approve/deny bookings, and view reports.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Deployment**: Vercel (Serverless Functions)

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account
- Vercel account (for deployment)

### Setup Instructions

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the migration script: `supabase/migrations/001_initial_schema.sql`
   - (Optional) Run seed data: `supabase/seed.sql`
   - Enable Email Auth in Authentication settings

3. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/
│   ├── employee/      # Employee-facing components
│   └── ui/            # Reusable UI components
├── lib/               # Supabase client & utilities
├── pages/
│   ├── admin/         # Admin dashboard pages
│   ├── auth/          # Login & Register pages
│   └── employee/      # Employee portal pages
├── store/             # Zustand state stores
└── types/             # TypeScript type definitions

api/                   # Vercel serverless functions
├── admin/
│   ├── approve.ts
│   └── deny.ts
└── bookings/
    ├── cancel.ts
    ├── create.ts
    └── index.ts

supabase/
├── migrations/        # Database schema
└── seed.sql           # Sample data
```

## Features

### Employee Portal
- Browse daily menus with meal details
- Book meals with conflict detection
- View and manage bookings
- Real-time notifications
- Dietary preference filtering

### Admin Panel
- Dashboard with booking statistics
- Menu management (CRUD meals & schedules)
- Booking approval workflow
- User management & role assignment
- Reports & analytics with charts

## Deployment

Deploy to Vercel:

```bash
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## License

MIT
