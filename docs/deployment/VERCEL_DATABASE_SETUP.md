# Vercel Database Setup Guide

## ⚠️ Belangrijk: SQLite en Vercel

**SQLite werkt NIET goed op Vercel** omdat:
- Vercel is serverless (stateless)
- Elke request kan op een andere server draaien
- SQLite bestanden kunnen niet gedeeld worden tussen serverless functions
- Elke function heeft zijn eigen filesystem

## Opties voor Vercel

### Optie 1: Vercel Postgres (Aanbevolen) ⭐

**Stappen:**
1. Ga naar je Vercel project dashboard
2. Ga naar **Storage** → **Create Database** → **Postgres**
3. Kies een naam voor je database
4. Vercel maakt automatisch een `DATABASE_URL` environment variable aan
5. Update je `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Verander van "sqlite" naar "postgresql"
  url      = env("DATABASE_URL")
}
```

6. Run migrations:
```bash
npx prisma migrate dev --name init
```

7. Push naar Vercel - de `DATABASE_URL` wordt automatisch gebruikt

**Voordelen:**
- ✅ Volledig geïntegreerd met Vercel
- ✅ Automatische backups
- ✅ Schaalbaar
- ✅ Gratis tier beschikbaar

### Optie 2: Supabase (Gratis PostgreSQL)

**Stappen:**
1. Maak account op [supabase.com](https://supabase.com)
2. Maak een nieuw project
3. Ga naar **Settings** → **Database** → kopieer de connection string
4. In Vercel: **Settings** → **Environment Variables**:
   - Name: `DATABASE_URL`
   - Value: `postgresql://user:password@host:5432/database?sslmode=require`
5. Update `prisma/schema.prisma` naar `postgresql`
6. Run migrations

**Voordelen:**
- ✅ Gratis tier (500MB database)
- ✅ Goede performance
- ✅ Real-time features beschikbaar

### Optie 3: Neon (Serverless Postgres)

**Stappen:**
1. Maak account op [neon.tech](https://neon.tech)
2. Maak een nieuw project
3. Kopieer de connection string
4. Voeg toe aan Vercel environment variables
5. Update schema naar `postgresql`

**Voordelen:**
- ✅ Serverless PostgreSQL
- ✅ Auto-scaling
- ✅ Gratis tier beschikbaar

### Optie 4: Blijven met SQLite (Niet aanbevolen voor Vercel)

Als je toch SQLite wilt gebruiken op Vercel:

**Problemen:**
- ❌ Database wordt niet gedeeld tussen requests
- ❌ Data gaat verloren bij elke deploy
- ❌ Werkt alleen als je 1 serverless function gebruikt
- ❌ Niet geschikt voor productie

**Als je het toch wilt proberen:**
1. In Vercel environment variables:
   ```
   DATABASE_URL="file:./data/production.db"
   ```
2. Zorg dat de `data/` folder bestaat en write permissions heeft
3. **Let op:** Data gaat verloren bij elke deploy!

## Aanbevolen: Migratie naar PostgreSQL

### Stap 1: Update schema.prisma

```prisma
datasource db {
  provider = "postgresql"  // Verander dit
  url      = env("DATABASE_URL")
}
```

### Stap 2: Maak een nieuwe database (Supabase/Vercel Postgres)

### Stap 3: Exporteer lokale SQLite data (optioneel)

```bash
# Exporteer data uit SQLite
npx prisma db pull
npx prisma db seed  # Als je seed data hebt
```

### Stap 4: Run migrations op nieuwe database

```bash
# Update DATABASE_URL naar je nieuwe PostgreSQL database
export DATABASE_URL="postgresql://..."
npx prisma migrate dev --name init
```

### Stap 5: Test lokaal

```bash
npm run dev
```

### Stap 6: Deploy naar Vercel

Vercel gebruikt automatisch de `DATABASE_URL` environment variable.

## Environment Variables in Vercel

Ga naar je Vercel project → **Settings** → **Environment Variables**:

**Voor PostgreSQL:**
```
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
JWT_SECRET=your-secret-key-here
NODE_ENV=production
POKEMON_API_KEY=your-api-key
```

**Voor SQLite (niet aanbevolen):**
```
DATABASE_URL=file:./data/production.db
JWT_SECRET=your-secret-key-here
NODE_ENV=production
POKEMON_API_KEY=your-api-key
```

## Huidige Setup Check

Je huidige setup gebruikt SQLite. Voor productie op Vercel raden we aan om te migreren naar PostgreSQL.

**Lokaal (development):**
- Database: `dev.db` (SQLite)
- DATABASE_URL: `file:./dev.db`

**Productie (Vercel):**
- Database: PostgreSQL (via Vercel Postgres, Supabase, of Neon)
- DATABASE_URL: Automatisch ingesteld door Vercel of handmatig toegevoegd

## Hulp nodig?

Als je hulp nodig hebt met de migratie, laat het weten!
