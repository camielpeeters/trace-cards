import { PrismaClient } from "@prisma/client";

// Singleton pattern for PrismaClient
let prismaInstance = null;

function initializePrisma() {
  // Return existing instance if available (reuse across requests)
  if (globalThis.prisma) {
    return globalThis.prisma;
  }
  
  // Return cached instance if already created
  if (prismaInstance) {
    return prismaInstance;
  }
  
  // During build phase, return null to avoid initialization errors
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }
  
  try {
    // Ensure DATABASE_URL is set (required for PrismaClient initialization)
    if (!process.env.DATABASE_URL) {
      // In production (Vercel), use environment variable or default
      process.env.DATABASE_URL = process.env.VERCEL 
        ? (process.env.DATABASE_URL || "file:./data/production.db")
        : "file:./dev.db";
    }
    
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    
    // Store in globalThis for reuse across requests (important for serverless)
    globalThis.prisma = prismaInstance;
    
    return prismaInstance;
  } catch (error) {
    console.error('PrismaClient initialization error:', error);
    throw error;
  }
}

// Export getter that initializes on first access
// This proxy ensures lazy initialization and handles build-time gracefully
const prisma = new Proxy({}, {
  get(target, prop) {
    // During build phase, return a no-op function to avoid errors
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      // Return a function that does nothing for methods
      if (typeof prop === 'string' && prop.startsWith('$')) {
        return async () => {};
      }
      return undefined;
    }
    
    // During runtime, initialize and return the property
    try {
      const instance = initializePrisma();
      if (!instance) {
        throw new Error('PrismaClient failed to initialize. Check DATABASE_URL and database connection.');
      }
      
      if (instance && typeof instance[prop] !== 'undefined') {
        const value = instance[prop];
        // If it's a function, bind it to the instance
        if (typeof value === 'function') {
          return value.bind(instance);
        }
        return value;
      }
      return undefined;
    } catch (error) {
      console.error('Prisma proxy error:', error);
      throw error;
    }
  }
});

export default prisma;
export function getPrisma() {
  const instance = initializePrisma();
  if (!instance) {
    throw new Error('PrismaClient failed to initialize. Check DATABASE_URL and database connection.');
  }
  return instance;
}