# Sports Event Management Application

A fullstack sports event management application built with Next.js, TypeScript, Supabase, and Tailwind CSS.

## Features

- 🔐 **Google SSO Authentication** - Secure authentication with Supabase Auth
- 📅 **Event Management** - Create, view, update, and delete sporting events
- 🎨 **Modern UI** - Built with Shadcn UI components and Tailwind CSS
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🔔 **Toast Notifications** - User-friendly feedback for all actions
- ⚡ **Server Actions** - Fast, type-safe server-side operations
- 🔒 **Row Level Security** - Secure data access with Supabase RLS

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- A Supabase account

### Installation

1. Clone the repository:

```bash
cd sports-event-app
```

2. Install dependencies:

```bash
npm install
```

3. Set up Supabase:

   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
   - Configure Google OAuth in Supabase Dashboard:
     - Go to Authentication > Providers > Google
     - Enable Google provider
     - Add your Google OAuth credentials

4. Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

5. Add your Supabase credentials to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

6. Run the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Authentication

- Google SSO via Supabase Auth
- Protected routes and server-side authentication checks
- User session management

### Event Management

- Create events with title, description, sport type, date, and venues
- View all events or individual event details
- Edit and delete events (only by creator)
- Responsive event cards with information display
- Filter events by sport type and event title
- Real-time database filtering with URL-based search params
- Added feature to be able to RSVP to events to see what is trending

### User Experience

- Loading states for all async operations
- Toast notifications for success/error feedback
- Smooth navigation and transitions
- Accessible UI components

## License

MIT
