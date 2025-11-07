// src/prisma/extensions/slug.extension.ts
import slugify from 'slugify';
import { Prisma } from 'generated/prisma'; // или @prisma/client, если ты не менял output

export const slugExtension = Prisma.defineExtension((client) =>
  client.$extends({
    query: {
      article: {
        create({ args, query }) {
          const data = args.data;
          if (!data.slug && data.title) {
            data.slug = slugify(data.title, {
              lower: true,
              strict: true,
              locale: 'ru',
            });
          }
          return query(args);
        },
      },
    },
  }),
);
