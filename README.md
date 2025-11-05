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

## Supabase server client (cookie handling)

This project exposes a helper `createClient` in `lib/supabase/server.ts` that creates a Supabase server client for use on the server.

- If you only need to read cookies (for example, to read an existing session) you can call `createClient()` from any server-side context. It will safely read cookies using Next's `cookies()` API.
- If you need to set or delete cookies (for example to store auth session cookies returned by Supabase), you MUST call `createClient` from a Route Handler or Server Action and pass the `cookies()` object into it. Modifying cookies outside those contexts will throw an error from Next.js.

Example (Route Handler):

```ts
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  // Now it's safe for Supabase client to set/delete cookies as part of auth flows
}
```

Example (server component or other read-only server context):

```ts
import { createClient } from "@/lib/supabase/server";

export async function someServerFunction() {
  const supabase = await createClient(); // read-only cookies
  // don't call set/remove here — they'll throw a helpful error
}
```

Also ensure the environment variables below are set (used by `createClient`):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
sports-event-app/
├── app/                    # Next.js app router pages
│   ├── events/            # Event pages
│   ├── auth/              # Auth callback route
│   └── layout.tsx         # Root layout
├── actions/               # Server actions
│   ├── auth.ts           # Authentication actions
│   └── events.ts         # Event CRUD actions
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── EventCard.tsx     # Event card component
│   ├── EventForm.tsx     # Event form component
│   ├── AuthButton.tsx    # Authentication button
│   └── Navbar.tsx        # Navigation bar
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase client setup
│   └── utils.ts          # Utility functions
├── types/                 # TypeScript types
│   └── database.types.ts # Database type definitions
└── supabase/             # Database schema
    └── schema.sql        # SQL schema file
```

## Database Setup

No additional database setup required! All filters work out of the box using Supabase's built-in query capabilities.

## Deployment to Vercel

1. Push your code to GitHub

2. Import your project in Vercel:

   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. Add environment variables in Vercel:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel deployment URL)

4. Update Supabase OAuth redirect URL:

   - In Supabase Dashboard, go to Authentication > URL Configuration
   - Add your Vercel URL to "Redirect URLs"

5. Deploy!

## Features in Detail

### Authentication

- Google SSO via Supabase Auth
- Protected routes and server-side authentication checks
- User session management

### Event Management

- Create events with title, description, sport type, date, and venues
- View all events or individual event details
- Edit and delete events (only by creator)
- Responsive event cards with rich information display
- Filter events by sport type and event title
- Real-time database filtering with URL-based search params

### User Experience

- Loading states for all async operations
- Toast notifications for success/error feedback
- Smooth navigation and transitions
- Accessible UI components

## License

MIT
