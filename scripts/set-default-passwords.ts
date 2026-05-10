import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

(async () => {
  const hash = await bcrypt.hash('senha123', 10);
  const r = await db.user.updateMany({
    where: { passwordHash: null },
    data: { passwordHash: hash },
  });
  console.log(`Updated ${r.count} user(s) with default password "senha123".`);
  await db.$disconnect();
})();
