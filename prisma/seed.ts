import { PrismaClient } from '../generated/prisma';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding started...');

  const articlesCount = 100;

  for (let i = 0; i < articlesCount; i++) {
    await prisma.article.create({
      data: {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs({ min: 3, max: 7 }),
        slug: faker.lorem.slug(),
        // published: faker.datatype.boolean(),
        published: true,
      },
    });
  }

  console.log(`Created ${articlesCount} articles`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
