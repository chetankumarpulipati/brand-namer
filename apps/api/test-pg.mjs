import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  await p.$connect();
  console.log('Connected!');
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await p.$disconnect();
}
