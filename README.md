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

## Architecture Patterns

### Authentication Pattern

The application uses a server-side authentication pattern with Supabase Auth and Google OAuth:

- **Server-Side Client Creation**: The `createClient()` function in `lib/supabase/server.ts` creates a Supabase client that automatically manages cookies using Next.js's `cookies()` API. This ensures secure, server-side session management.

- **OAuth Flow**: Authentication is handled through server actions (`actions/auth.ts`) that initiate the OAuth flow. The callback route (`app/auth/callback/route.ts`) exchanges the authorization code for a session and handles errors gracefully.

- **Middleware Protection**: The `middleware.ts` file handles cookie security, cleanup of invalid cookies, and sets appropriate cache headers. It avoids unnecessary session checks to prevent rate limiting issues.

- **Server-Side Auth Checks**: All protected operations (like creating/editing events) verify authentication server-side using `supabase.auth.getUser()` within server actions, ensuring security even if client-side checks are bypassed.

### Server Actions

The application leverages Next.js Server Actions for type-safe, server-side operations:

- **Centralized Actions**: All server actions are organized in the `actions/` directory (`auth.ts`, `events.ts`, `rsvps.ts`), each marked with the `"use server"` directive.

- **Consistent Error Handling**: Server actions are wrapped with `withErrorHandling()` from `types/errors.ts`, which ensures all actions return a consistent `ActionResult<T>` type (either `SuccessResponse<T>` or `ErrorResponse<T>`).

- **Cache Management**: Actions use `revalidatePath()` to invalidate Next.js cache after mutations, ensuring users see updated data immediately.

- **Type Safety**: All actions are fully typed with TypeScript, providing compile-time safety and excellent developer experience.

### Reusable UI Components

The application uses a component architecture built on Shadcn UI:

- **Base UI Components**: Found in `components/ui/`, these are foundational components from Shadcn UI including:
  - `Button` - Variant-based button component with multiple styles
  - `Card` - Flexible card component with header, content, and footer sections
  - `Dialog` - Modal dialog component
  - `Form` - Form components with validation support
  - `Input`, `Label`, `Select`, `Textarea` - Form input components
  - `Toast` & `Toaster` - Toast notification system

- **Custom Components**: Higher-level components in `components/` that compose base UI components:
  - `AuthButton` - Handles sign in/out functionality
  - `EventCard` - Displays event information
  - `EventForm` - Form for creating/editing events
  - `EventFilters` - Filtering interface for events
  - `RSVPButton` - RSVP functionality component

- **Composition Pattern**: Components are designed to be composable, allowing for easy reuse and customization throughout the application.

### Abstracted Error Types

The application uses a centralized error handling system for consistent error management:

- **Error Code Enum**: The `ErrorCode` enum in `types/errors.ts` categorizes errors (authentication, validation, database, rate limiting, etc.), making error handling predictable and type-safe.

- **ActionResult Pattern**: All server actions return `ActionResult<T>`, a discriminated union type that can be either:
  - `SuccessResponse<T>` - Contains `data: T` and `error: null`
  - `ErrorResponse<T>` - Contains `error: string`, optional `code: ErrorCode`, and optional `details`

- **Error Handling Utilities**:
  - `withErrorHandling()` - Wraps async functions to catch errors and return standardized responses
  - `handleAuthError()` - Specialized handler for authentication errors
  - `handleSupabaseError()` - Handles Supabase-specific error codes
  - `isErrorResponse()` / `isSuccessResponse()` - Type guards for checking response types
  - `AppError` - Custom error class for application-specific errors

- **Type Safety**: The error system is fully typed, allowing TypeScript to infer success/error states and provide compile-time guarantees about error handling.

## License

MIT
