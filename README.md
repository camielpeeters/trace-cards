# 🎴 Trace Cards

A modern web application for selling Pokémon cards, built with Next.js 14, React, and Tailwind CSS.

## Quick Start

### Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Documentation

All documentation is organized in the `docs/` folder:

- **Installation**: `docs/installation/` - Setup guides and installation instructions
- **Deployment**: `docs/deployment/` - Deployment guides and checklists
- **Pricing**: `docs/pricing/` - Pricing implementation details
- **Status**: `docs/status/` - Implementation status and completion notes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: JWT-based auth
- **API**: Pokemon TCG API integration

## Project Structure

```
trace-cards/
├── app/              # Next.js app directory (pages, API routes, components)
├── public/           # Static assets
├── prisma/           # Database schema
├── scripts/          # Utility scripts
├── data/             # Database files
└── docs/             # Documentation
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

---

For detailed information, see the documentation in `docs/`.
