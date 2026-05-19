import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Review {
  id: number;
  sentiment: string;
}

interface ProductStats {
  totalReviews: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  averageRating: number;
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        reviews: {
          select: {
            id: true,
            sentiment: true,
          },
        },
      },
    });

    // Вычисляем статистику для каждого товара
    const productsWithStats = products.map((product: any) => {
      const reviews: Review[] = product.reviews;
      const totalReviews = reviews.length;
      
      const positiveCount = reviews.filter((r: Review) => r.sentiment === 'positive').length;
      const negativeCount = reviews.filter((r: Review) => r.sentiment === 'negative').length;
      const neutralCount = reviews.filter((r: Review) => r.sentiment === 'neutral').length;
      
      // Вычисляем среднюю оценку (5-звёздочная шкала)
      // positive = 5, neutral = 3, negative = 1
      let averageRating = 0;
      if (totalReviews > 0) {
        const totalScore = (positiveCount * 5) + (neutralCount * 3) + (negativeCount * 1);
        averageRating = Number((totalScore / totalReviews).toFixed(1));
      }

      return {
        ...product,
        stats: {
          totalReviews,
          positiveCount,
          negativeCount,
          neutralCount,
          averageRating,
        } as ProductStats,
      };
    });
    
    return NextResponse.json(productsWithStats);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
