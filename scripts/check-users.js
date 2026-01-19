// Script to check users in database
const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    console.log('Checking users in database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${users.length} user(s):\n`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found in database!');
      console.log('You can create an admin user by:');
      console.log('  1. Visiting /setup-admin');
      console.log('  2. Or using the API: POST /api/auth/setup-admin');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Display Name: ${user.displayName || 'N/A'}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        console.log('');
      });
    }

    // Check specifically for admin user
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (adminUser) {
      console.log('✅ Admin user exists!');
    } else {
      console.log('⚠️  Admin user (username: "admin") not found!');
    }

  } catch (error) {
    console.error('Error checking users:', error.message);
    if (error.message.includes('adapter') || error.message.includes('accelerateUrl')) {
      console.error('\n⚠️  PrismaClient initialization error detected.');
      console.error('This might be a Prisma version issue. Try:');
      console.error('  1. npm install prisma@7.1.1 @prisma/client@7.1.1');
      console.error('  2. npx prisma generate');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
