import { PrismaClient } from "@prisma/client";

// Lazy initialization to avoid build-time errors
let prismaInstance = null;

function initializePrisma() {
  if (globalThis.prisma) {
    return globalThis.prisma;
  }
  
  if (!prismaInstance) {
    try {
      // Ensure DATABASE_URL is set (required for PrismaClient initialization)
      if (!process.env.DATABASE_URL) {
        process.env.DATABASE_URL = "file:./dev.db";
      }
      
      prismaInstance = new PrismaClient();
      
      if (process.env.NODE_ENV !== "production") {
        globalThis.prisma = prismaInstance;
      }
    } catch (error) {
      // During build time, PrismaClient might fail to initialize
      // Return a proxy that will throw a helpful error when actually used
      console.warn('PrismaClient initialization warning (this is normal during build):', error.message);
      prismaInstance = new Proxy({}, {
        get() {
          throw new Error('PrismaClient is not available. This route should be marked as dynamic.');
        }
      });
    }
  }
  
  return prismaInstance;
}

// Export getter that initializes on first access
const prisma = new Proxy({}, {
  get(target, prop) {
    const instance = initializePrisma();
    return instance[prop];
  }
});

export default prisma;
export function getPrisma() {
  return initializePrisma();
}