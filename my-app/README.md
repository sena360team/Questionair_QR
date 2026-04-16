# Questionnaire QR System

Questionnaire QR System is a Next.js application for creating, publishing, and tracking QR-based forms. It includes an admin panel, form versioning, draft workflows, theme customization, and submission analytics.

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- PostgreSQL + Prisma
- Supabase (auth/data integrations)
- Tailwind CSS

## Core Features

- Form builder with customizable fields
- Form draft and publish workflow
- Form version history and duplicate/copy version support
- Multiple form themes (default, card-groups, step-wizard, minimal)
- QR code generation and scan tracking
- Submission collection and admin analytics
- Consent and CSS integration options

## Project Structure

```
src/app/            Next.js routes (admin UI, public form pages, API routes)
src/components/     Reusable UI and feature components
prisma/             Prisma schema and migrations
docs/               Setup, feature, API, and deployment documentation
public/             Static assets and demo HTML pages
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+ (or Docker)

## Quick Start (Local)

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Set required values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db_name>
```

4. Run the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Run with Docker

For local containerized run (app + PostgreSQL):

```bash
docker compose up -d --build
```

Default ports in this repository:

- App: `1880`
- PostgreSQL: `5433`

Stop services:

```bash
docker compose down
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run lint checks
- `npm run db:types` - Generate Supabase TypeScript types

## Documentation

- Main docs index: `docs/README.md`
- Setup guides: `docs/01-setup/`
- Feature docs: `docs/02-features/`
- Usage guides: `docs/03-guides/`
- Deployment docs: `docs/04-deployment/`
- API docs: `docs/05-api/`

## Deployment Notes

- Production compose file: `docker-compose.prod.yml`
- Application Docker image is defined in `Dockerfile`
- Review environment variables before production deployment

## License

Private repository. Internal use only.