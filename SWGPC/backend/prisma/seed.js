require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../src/config/database');

async function main() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Defina ADMIN_NAME, ADMIN_EMAIL y ADMIN_PASSWORD en backend/.env');
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { fullName: ADMIN_NAME, passwordHash, role: 'ADMINISTRADOR', isActive: true },
    create: { fullName: ADMIN_NAME, email: ADMIN_EMAIL, passwordHash, role: 'ADMINISTRADOR' },
  });

  console.log(`Administrador listo: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
