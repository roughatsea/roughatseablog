# Rough at Sea - Blog Architecture

Welcome to **Rough at Sea**, a modern, high-performance personal blog built on the cutting edge of the React ecosystem. This document outlines the core architecture of the application, the rationale behind our technical decisions, and a guide on how to deploy it.

---

## 🏗️ Architecture & Tech Stack

This application is built as a full-stack Next.js application using the App Router. The goal was to create a fast, secure, and easily maintainable blogging platform.

### 1. Framework: Next.js (App Router)
- **What**: React framework with Server Components and Server Actions.
- **Why**: The App Router allows us to push heavy logic (like database fetching and markdown rendering preparation) to the server. By utilizing **Server Actions**, we completely eliminated the need for manual REST API routes to handle form submissions (like creating/editing posts), resulting in significantly less boilerplate and full end-to-end type safety.

### 2. Database: Neon (Serverless Postgres)
- **What**: A fully managed, serverless PostgreSQL database.
- **Why**: Traditional Postgres requires persistent connections which struggle in serverless environments (like Vercel). Neon uses a specialized HTTP/WebSocket driver that allows hundreds of rapid, stateless connections without exhausting connection pools. It's incredibly fast, scales to zero when not in use, and is perfectly tailored for edge computing.

### 3. ORM: Drizzle ORM
- **What**: A headless, lightweight TypeScript ORM.
- **Why**: Unlike Prisma (which relies on a heavy Rust binary engine), Drizzle is just a thin, strongly-typed wrapper around SQL. It ensures that our database queries are extremely fast, incredibly type-safe, and capable of running anywhere, including Vercel Edge functions.

### 4. Authentication: NextAuth.js
- **What**: Authentication provider configured with Google OAuth.
- **Why**: We wanted secure, passwordless authentication without managing credential hashing ourselves. We implemented an **Email Whitelist Strategy** (`ALLOWED_EMAILS` env variable). While anyone with a Google account can technically attempt to log in, NextAuth intercepts the sign-in attempt and strictly verifies their email against the whitelist, ensuring only authorized captains can access the dashboard and write posts.

### 5. Content Editor: `@uiw/react-md-editor`
- **What**: A live-preview Markdown WYSIWYG editor.
- **Why**: Writing blog posts in raw HTML is tedious, and rich-text editors (like Slate/Draft) often save complex, proprietary JSON structures to the database. Markdown is universal, portable, and lightweight. This editor gives us a beautiful split-pane live preview without any server roundtrips.

### 6. Storage: Vercel Blob
- **What**: Serverless file storage provided natively by Vercel.
- **Why**: We needed a way to upload local images directly into the Markdown editor via drag-and-drop. Passing massive Base64 image strings to the database causes severe payload limits and database bloat. Vercel Blob provides an out-of-the-box, zero-configuration S3-compatible bucket to securely store images and generate public URLs for our blog posts.

### 7. UI & Styling: Tailwind CSS + shadcn/ui
- **What**: Utility-first CSS framework combined with accessible, unstyled Radix UI components.
- **Why**: Tailwind allows for rapid design iteration without leaving the JSX file. Instead of using a bloated component library (like MUI or Bootstrap), `shadcn/ui` lets us copy exactly the components we need (Buttons, Forms, Toasts) directly into our codebase, giving us 100% control over the styling and behavior.

---

## 🚀 Deployment Guide

This application is designed to be deployed on **Vercel** with a **Neon** database.

### Prerequisites
Before deploying, you need to gather the following environment variables:

1. **Neon Database**: Create a free project at [neon.tech](https://neon.tech) and get your Postgres Connection String.
2. **Google OAuth**: Go to the Google Cloud Console, create a web application credential, and get your Client ID and Client Secret. 
   - *Note: Add your Vercel production domain to the authorized redirect URIs (e.g. `https://your-domain.com/api/auth/callback/google`).*
3. **Vercel Blob**: Inside your Vercel Project Dashboard, go to the Storage tab and create a Blob store to get your Read/Write token.
4. **NextAuth Secret**: Generate a random 32-character string (e.g. run `openssl rand -base64 32` in your terminal).

### Environment Variables
When deploying to Vercel, add the following variables to your project settings:

```env
# Database
DATABASE_URL="postgresql://user:password@ep-lively-fire-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Authentication
AUTH_GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-google-client-secret"
NEXTAUTH_SECRET="your-random-secret-key"

# Production Domain (Required for NextAuth in production)
NEXTAUTH_URL="https://www.your-custom-domain.com"

# Security Whitelist (Comma separated list of emails allowed to write posts)
ALLOWED_EMAILS="your-email@gmail.com,another-author@gmail.com"

# Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxx_xxxx"
```

### Deployment Steps
1. Push your code to a GitHub repository.
2. Log into [Vercel](https://vercel.com) and import the repository.
3. Add all the Environment Variables listed above during the setup phase.
4. Click **Deploy**.
5. Once deployed, run your database migrations. You can do this by running `npx drizzle-kit push` from your local machine (with your `.env.local` pointed to the Neon production database) to ensure your tables are created.

*Fair winds and following seas!* ⛵

---

## 📁 File Structure

The project follows a feature-driven, highly modular architecture built on Next.js 15 principles.

```text
src/
├── app/                        # Next.js App Router (Pages, Layouts, API Routes)
│   ├── api/                    # Serverless API endpoints
│   │   ├── auth/[...nextauth]/ # NextAuth authentication provider setup
│   │   └── upload/             # Vercel Blob secure image upload route
│   ├── blog/                   # Public blog feed and individual post pages
│   ├── dashboard/              # Protected writer dashboard (new/edit/delete posts)
│   ├── layout.tsx              # Root HTML layout and global Navbar
│   └── page.tsx                # Landing page
├── components/                 # Shared UI Components
│   ├── layout/                 # Structural components like the Navbar
│   └── ui/                     # shadcn/ui components (Buttons, Inputs, Forms)
├── db/                         # Database connection and Drizzle client initialization
│   └── index.ts                
├── features/                   # Feature-driven domain logic
│   ├── auth/                   # Auth-specific database schemas (users, sessions)
│   └── posts/                  # Everything related to blog posts
│       ├── actions.ts          # Next.js Server Actions (Create, Update, Delete)
│       ├── queries.ts          # Drizzle Database Queries (Get posts, Get post by ID)
│       ├── schema.ts           # Drizzle table schemas and Zod validation types
│       └── components/         # Feature-specific UI components (PostForm, DeleteButton)
└── lib/                        # Global utilities and configurations
    ├── auth.ts                 # NextAuth configuration and Google Provider logic
    └── utils.ts                # Tailwind merge utilities (cn)
```

### Purpose of Key Directories

- **`src/app`**: Contains all the routing for the application. Any file named `page.tsx` represents a public or protected web page, and `route.ts` represents a serverless API endpoint.
- **`src/features`**: Instead of having a monolithic `components` or `actions` folder, we use a feature-driven architecture. The `posts` folder self-contains the UI, Server Actions, Database Queries, and Schemas all required to make the blogging system work. This keeps domain logic tightly coupled and highly maintainable.
- **`src/components/ui`**: Contains raw, unstyled components generated by `shadcn/ui`. These are meant to be primitive building blocks (like an `<Input />` or `<Button />`) rather than domain-specific components.
- **`src/db`**: Initializes the Neon HTTP connection pool and binds it to the Drizzle ORM client so the entire application can query the database.
