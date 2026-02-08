import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { faker, fakerRU } from '@faker-js/faker';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Use Russian faker for more realistic content
const ru = fakerRU;

// Transliteration map for slug generation
const translitMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .split('')
    .map((char) => translitMap[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Generate TipTap-compatible JSON content
function generateTipTapContent() {
  const content: any[] = [];

  // Add 3-8 paragraphs
  const paragraphCount = faker.number.int({ min: 3, max: 8 });
  for (let i = 0; i < paragraphCount; i++) {
    // Occasionally add a heading before paragraph
    if (i > 0 && faker.datatype.boolean({ probability: 0.3 })) {
      content.push({
        type: 'heading',
        attrs: { level: faker.helpers.arrayElement([2, 3]) },
        content: [{ type: 'text', text: ru.lorem.sentence({ min: 3, max: 6 }) }],
      });
    }

    // Regular paragraph
    const paragraph: any = {
      type: 'paragraph',
      content: [],
    };

    // Generate text with occasional formatting
    const sentences = ru.lorem.sentences({ min: 2, max: 5 }).split('. ');
    sentences.forEach((sentence, idx) => {
      if (idx > 0) paragraph.content.push({ type: 'text', text: '. ' });

      // Sometimes add bold or italic
      if (faker.datatype.boolean({ probability: 0.15 })) {
        paragraph.content.push({
          type: 'text',
          marks: [{ type: faker.helpers.arrayElement(['bold', 'italic']) }],
          text: sentence,
        });
      } else {
        paragraph.content.push({ type: 'text', text: sentence });
      }
    });

    content.push(paragraph);

    // Occasionally add a bullet list
    if (faker.datatype.boolean({ probability: 0.2 })) {
      const listItems = faker.number.int({ min: 2, max: 5 });
      content.push({
        type: 'bulletList',
        content: Array.from({ length: listItems }, () => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: ru.lorem.sentence({ min: 3, max: 8 }) }],
            },
          ],
        })),
      });
    }

    // Occasionally add a blockquote
    if (faker.datatype.boolean({ probability: 0.1 })) {
      content.push({
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: ru.lorem.sentences({ min: 1, max: 2 }) }],
          },
        ],
      });
    }
  }

  return {
    type: 'doc',
    content,
  };
}

// Generate articles with realistic distribution of weights
function generateWeight(): number {
  const rand = Math.random();
  if (rand < 0.6) return 1;      // 60% weight 1
  if (rand < 0.85) return 2;     // 25% weight 2
  if (rand < 0.95) return 3;     // 10% weight 3
  return 4;                       // 5% weight 4
}

async function main() {
  console.log('Seeding started...');

  // Check if there are existing articles
  const existingCount = await prisma.article.count();
  if (existingCount > 0) {
    console.log(`Found ${existingCount} existing articles. Skipping seed.`);
    console.log('To reseed, first clear the database or use --force flag.');

    const forceFlag = process.argv.includes('--force');
    if (!forceFlag) {
      return;
    }

    console.log('Force flag detected. Clearing existing data...');
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
  }

  // Create tags first
  const tagNames = [
    'Технологии',
    'Дизайн',
    'Разработка',
    'Архитектура',
    'История',
    'Искусство',
    'Наука',
    'Путешествия',
    'Фотография',
    'Обзоры',
  ];

  console.log('Creating tags...');
  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.create({
        data: {
          name,
          slug: generateSlug(name),
        },
      }),
    ),
  );
  console.log(`Created ${tags.length} tags`);

  // Create articles
  const articlesCount = 50;
  console.log(`Creating ${articlesCount} articles...`);

  for (let i = 0; i < articlesCount; i++) {
    const title = ru.lorem.sentence({ min: 4, max: 10 }).replace(/\.$/, '');
    const weight = generateWeight();

    // Randomly assign 0-3 tags
    const tagCount = faker.number.int({ min: 0, max: 3 });
    const articleTags = faker.helpers.arrayElements(tags, tagCount);

    // Vary creation dates within last 6 months
    const createdAt = faker.date.recent({ days: 180 });
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() });

    await prisma.article.create({
      data: {
        title,
        slug: generateSlug(title) + '-' + faker.string.alphanumeric(4),
        description: ru.lorem.sentences({ min: 1, max: 2 }),
        content: generateTipTapContent(),
        weight,
        published: faker.datatype.boolean({ probability: 0.85 }), // 85% published
        createdAt,
        updatedAt,
        tags: {
          connect: articleTags.map((tag) => ({ id: tag.id })),
        },
      },
    });

    if ((i + 1) % 10 === 0) {
      console.log(`  Created ${i + 1}/${articlesCount} articles`);
    }
  }

  console.log(`\nSeeding completed!`);
  console.log(`  - ${tags.length} tags`);
  console.log(`  - ${articlesCount} articles`);
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
