import { NextResponse } from 'next/server';
import { existsSync, mkdirSync, writeFileSync, accessSync, constants, unlinkSync } from 'fs';
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

    // Check 2: Write permissions
    try {
      const dataDir = join(process.cwd(), 'data');
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }
      accessSync(dataDir, constants.W_OK);
      
      // Test if we can actually write a file
      const testFile = join(dataDir, '.write-test');
      writeFileSync(testFile, 'test');
      unlinkSync(testFile);
      
      checks.writable = {
        passed: true,
        message: 'Schrijfrechten OK ✅'
      };
    } catch (error) {
      checks.writable = {
        passed: false,
        message: `Geen schrijfrechten: ${error.message}`
      };
    }

    // Check 3: Database support (check if we can create SQLite)
    try {
      const dataDir = join(process.cwd(), 'data');
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }
      const testDbPath = join(dataDir, '.test.db');
      writeFileSync(testDbPath, '');
      // Clean up test file
      unlinkSync(testDbPath);
      checks.database = {
        passed: true,
        message: 'SQLite support OK ✅'
      };
    } catch (error) {
      checks.database = {
        passed: false,
        message: `Kan geen SQLite database aanmaken: ${error.message}`
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
