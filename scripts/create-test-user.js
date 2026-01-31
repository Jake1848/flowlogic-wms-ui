import { PrismaClient } from '../server/generated/prisma/client.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createTestUser() {
  console.log('\n=== Setting Up Test User ===\n');

  // Check for existing users
  const existingUsers = await prisma.user.findMany({ take: 5 });
  console.log(`Existing users: ${existingUsers.length}`);
  existingUsers.forEach(u => console.log(`  - ${u.username} (${u.email})`));

  // Check for test user
  let testUser = await prisma.user.findFirst({
    where: { OR: [{ username: 'admin' }, { email: 'admin@flowlogic.ai' }] }
  });

  if (testUser) {
    console.log('\nTest user already exists:', testUser.username);
    // Reset password
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.update({
      where: { id: testUser.id },
      data: { passwordHash: hash, isActive: true }
    });
    console.log('Password reset to: admin123');
  } else {
    // Get or create company
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: { name: 'FlowLogic Demo', code: 'DEMO' }
      });
    }

    const hash = await bcrypt.hash('admin123', 10);
    testUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@flowlogic.ai',
        passwordHash: hash,
        firstName: 'Admin',
        lastName: 'User',
        fullName: 'Admin User',
        role: 'ADMIN',
        companyId: company.id,
        isActive: true
      }
    });
    console.log('\nCreated test user:', testUser.username);
  }

  // Now test login API
  console.log('\n=== Testing Login ===\n');

  const res = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });

  if (res.ok) {
    const data = await res.json();
    console.log('Login successful!');
    console.log('Token:', data.token?.substring(0, 50) + '...');

    // Test alerts API
    console.log('\n=== Testing Alerts API ===\n');
    const alertsRes = await fetch('http://localhost:3001/api/alerts?limit=10', {
      headers: { 'Authorization': `Bearer ${data.token}` }
    });

    if (alertsRes.ok) {
      const alertsData = await alertsRes.json();
      console.log('Alerts fetched successfully!');
      console.log(`Total alerts: ${alertsData.data?.length || 0}`);
      console.log('\nAlerts:');
      (alertsData.data || []).forEach((a, i) => {
        console.log(`  ${i + 1}. [${a.severity}] ${a.title}`);
        console.log(`      isResolved: ${a.isResolved}`);
      });
    } else {
      console.log('Alerts fetch failed:', await alertsRes.text());
    }
  } else {
    console.log('Login failed:', await res.text());
  }

  await prisma.$disconnect();
}

createTestUser().catch(console.error);
