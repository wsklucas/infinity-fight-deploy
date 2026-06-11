import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [email, newPassword] = process.argv.slice(2)

  if (!email || !newPassword) {
    console.error('Uso: npx tsx src/db/set-admin-password.ts <email> <nova-senha>')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`Usuário não encontrado: ${email}`)
    process.exit(1)
  }

  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { email }, data: { password: hash } })

  console.log(`Senha atualizada com sucesso para ${email} (role: ${user.role})`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
