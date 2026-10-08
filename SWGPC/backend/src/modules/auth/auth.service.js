const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new Error('Credenciales inválidas');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Credenciales inválidas');
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return { token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } };
}

async function register({ fullName, email, password, role }) {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  return prisma.user.create({
    data: { fullName, email, passwordHash, role },
    select: { id: true, fullName: true, email: true, role: true },
  });
}

module.exports = { login, register };
