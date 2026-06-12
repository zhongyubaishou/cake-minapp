/** Seed script - initialize admin account and default data */
import bcrypt from 'bcryptjs';
import prisma from '../src/utils/prisma';

async function seed() {
  console.log('Seeding database...');

  // 1. Create admin account
  const adminUsername = process.env.INIT_ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.INIT_ADMIN_PASSWORD;
  const existingAdmin = await prisma.adminUser.findUnique({ where: { username: adminUsername } });
  if (!existingAdmin) {
    if (!adminPassword || adminPassword.length < 12) {
      throw new Error('INIT_ADMIN_PASSWORD must be set and at least 12 characters long before seeding admin account.');
    }
    await prisma.adminUser.create({
      data: {
        username: adminUsername,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        name: '老板',
      },
    });
    console.log(`  OK Admin account created: ${adminUsername}`);
  } else {
    console.log('  OK Admin account exists, skip');
  }

  // 2. Create default categories (Chinese names)
  const categories = [
    { name: '生日蛋糕', sortOrder: 1 },
    { name: '儿童蛋糕', sortOrder: 2 },
    { name: '定制蛋糕', sortOrder: 3 },
  ];
  for (const cat of categories) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!existing) {
      await prisma.category.create({ data: cat });
      console.log(`  OK Created category: ${cat.name}`);
    }
  }

  // 3. Create store config with real coordinates
  const existingConfig = await prisma.storeConfig.findFirst();
  if (!existingConfig) {
    await prisma.storeConfig.create({
      data: {
        name: '蛋糕定制店',
        address: '广东省河源市紫金县义容镇青溪信用社旁',
        lng: 114.8700,
        lat: 23.6900,
        businessHoursStart: '06:00:00',
        businessHoursEnd: '18:00:00',
        deliveryRangeKm: 5.0,
        deliveryFeePerKm: 2.0,
        minAdvanceHours: 6,
      },
    });
    console.log('  OK Store config created');
  } else {
    console.log('  OK Store config exists, skip');
  }

  console.log('Seed complete!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
