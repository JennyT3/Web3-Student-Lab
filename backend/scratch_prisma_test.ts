import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const student = await prisma.student.findUnique({
      where: {
        id: '123',
        // @ts-ignore
        workspaceId: '123',
      }
    });
    console.log('findUnique success');
  } catch (e: any) {
    console.log('findUnique error:', e.message);
  }
}

main().finally(() => prisma.$disconnect());
