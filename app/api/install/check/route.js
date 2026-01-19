import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  const checks = {
    nodeVersion: { passed: false, message: '' },
    writable: { passed: false, message: '' },
    database: { passed: false, message: '' },
    env: { passed: false, message: '' },
    prisma: { passed: false, message: '' }
  };

  try {
    // Check 1: Node.js version
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split('.')[0]);
    checks.nodeVersion = {
      passed: major >= 18,
      message: major >= 18 
        ? `Node.js ${nodeVersion} ✅` 
        : `Node.js ${nodeVersion} is te oud. Minimaal 18.x vereist.`
    };

    // Check 2: Write permissions (not needed for PostgreSQL)
    checks.writable = {
      passed: true,
      message: 'PostgreSQL gebruikt geen lokale bestanden ✅'
    };

    // Check 3: Database connection (PostgreSQL)
    try {
      if (process.env.DATABASE_URL) {
        checks.database = {
          passed: true,
          message: 'DATABASE_URL is configured ✅'
        };
      } else {
        checks.database = {
          passed: false,
          message: 'DATABASE_URL is not set. Configure PostgreSQL connection string.'
        };
      }
    } catch (error) {
      checks.database = {
        passed: false,
        message: `Database check mislukt: ${error.message}`
      };
    }

    // Check 4: .env file
    const envPath = join(process.cwd(), '.env');
    checks.env = {
      passed: true,
      message: existsSync(envPath) 
        ? '.env bestand bestaat ✅' 
        : '.env wordt aangemaakt tijdens installatie'
    };

    // Check 5: Prisma Client availability
    try {
      // Check if Prisma schema exists
      const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
      if (existsSync(schemaPath)) {
        checks.prisma = {
          passed: true,
          message: 'Prisma schema gevonden ✅'
        };
      } else {
        checks.prisma = {
          passed: false,
          message: 'Prisma schema niet gevonden'
        };
      }
    } catch (error) {
      checks.prisma = {
        passed: false,
        message: `Prisma check mislukt: ${error.message}`
      };
    }

    return NextResponse.json({ checks });

  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json({
      error: error.message,
      checks
    }, { status: 500 });
  }
}
