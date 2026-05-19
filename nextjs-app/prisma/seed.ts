import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();

  await prisma.product.create({
    data: {
      name: 'Ноутбук Dell XPS 13',
      description: 'Тонкий и легкий ноутбук для работы и учебы.',
      reviews: {
        create: [
          { text: 'Отличный ноутбук! Быстрый, легкий.', sentiment: 'positive', keywords: 'Скорость — хорошо, Вес — хорошо' },
          { text: 'Нормальный, но дорогой.', sentiment: 'neutral', keywords: 'Цена — дорого, Качество — нормально' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro',
      description: 'Флагманский смартфон с мощной камерой.',
      reviews: {
        create: [
          { text: 'Камера супер, всё нравится.', sentiment: 'positive', keywords: 'Камера — хорошо, Производительность — хорошо' }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Sony WH-1000XM5',
      description: 'Наушники с активным шумоподавлением.',
      reviews: {
        create: [
          { text: 'Звук отличный, но посадка неудобная.', sentiment: 'neutral', keywords: 'Звук — хорошо, Комфорт — плохо' },
          { text: 'Разочарован, сломались через месяц.', sentiment: 'negative', keywords: 'Надежность — плохо, Качество — плохо' }
        ]
      }
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
