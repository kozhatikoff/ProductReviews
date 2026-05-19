'use server';

import { prisma } from '@/lib/prisma';
import { generateAiText } from '@/lib/ai-text';

interface InsightResult {
  success: boolean;
  summary?: string;
  error?: string;
}

export async function generateBusinessInsights(): Promise<InsightResult> {
  try {
    const recentReviews = await prisma.review.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    if (recentReviews.length === 0) {
      return {
        success: false,
        error: 'Недостаточно данных: в базе пока нет отзывов для анализа.',
      };
    }

    const reviewsText = recentReviews
      .map(
        (review, index) =>
          `${index + 1}. [${review.product.name}] ${review.text} (sentiment: ${review.sentiment}, toxic: ${review.isToxic})`
      )
      .join('\n');

    const summary = await generateAiText({
      systemPrompt:
        'Ты аналитик клиентского опыта. Отвечай кратко, структурно и по делу на русском языке.',
      input:
        'Вот последние отзывы клиентов. Сделай краткую выжимку в 3-4 предложениях: что клиентам нравится больше всего, а какие главные проблемы нужно решить бизнесу.\n\n' +
        reviewsText,
      yandexPromptId: process.env.YANDEX_PROMPT_ID_INSIGHTS,
      temperature: 0.3,
      maxTokens: 260,
    });
    if (!summary) {
      return {
        success: false,
        error: 'Модель не вернула текст сводки.',
      };
    }

    return {
      success: true,
      summary,
    };
  } catch (error) {
    console.error('Error generating business insights:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось сгенерировать AI-сводку.',
    };
  }
}

interface ProductInsightsSummary {
  productId: number;
  productName: string;
  totalReviews: number;
  summary: string;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  topKeywords: string[];
  averageSentiment: string;
  lastUpdated: string;
}

export async function generateProductInsights(
  productId: number
): Promise<{ success: boolean; data?: ProductInsightsSummary; error?: string }> {
  try {
    // Получаем товар с последними отзывами
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 15, // Берем последние 15 отзывов
        },
      },
    });

    if (!product) {
      return {
        success: false,
        error: 'Товар не найден',
      };
    }

    if (product.reviews.length === 0) {
      return {
        success: false,
        error: 'Нет отзывов для анализа',
      };
    }

    // Подсчитываем тональность
    const positiveCount = product.reviews.filter(r => r.sentiment === 'positive').length;
    const negativeCount = product.reviews.filter(r => r.sentiment === 'negative').length;
    const neutralCount = product.reviews.filter(r => r.sentiment === 'neutral').length;

    // Собираем ключевые слова
    const keywordsSet = new Set<string>();
    product.reviews.forEach(review => {
      if (review.keywords) {
        review.keywords.split(',').forEach(kw => {
          const trimmed = kw.trim();
          if (trimmed && trimmed.length > 0) keywordsSet.add(trimmed);
        });
      }
    });
    const topKeywords = Array.from(keywordsSet).slice(0, 10);

    // Определяем среднюю тональность
    let averageSentiment = 'neutral';
    if (positiveCount > negativeCount) {
      averageSentiment = 'positive';
    } else if (negativeCount > positiveCount) {
      averageSentiment = 'negative';
    }

    // Формируем текст отзывов для анализа
    const reviewsText = product.reviews
      .map(
        (r, idx) =>
          `Отзыв ${idx + 1} (${r.sentiment}): ${r.text}`
      )
      .join('\n\n');

    let summary = '';
    try {
      summary = await generateAiText({
        systemPrompt:
          'Ты аналитик отзывов о товарах. Создай краткую бизнес-сводку по отзывам товара на русском языке.',
        input: `Проанализируй отзывы товара "${product.name}" (всего ${product.reviews.length} отзывов, из них: позитивных ${positiveCount}, негативных ${negativeCount}, нейтральных ${neutralCount}):\n\n${reviewsText}\n\nВыведи сводку в формате:\nВПЕЧАТЛЕНИЕ: [2-3 предложения]\nПОЗИТИВ: [список]\nНЕГАТИВ: [список]\nРЕКОМЕНДАЦИИ: [рекомендации]`,
        yandexPromptId: process.env.YANDEX_PROMPT_ID_INSIGHTS,
        temperature: 0.5,
        maxTokens: 500,
      });
    } catch (error) {
      console.warn('Ошибка при генерации сводки с ИИ, используем локальный анализ:', error);
      summary = `ВПЕЧАТЛЕНИЕ: Товар "${product.name}" получил ${positiveCount} позитивных и ${negativeCount} негативных отзывов. Среднее впечатление: ${averageSentiment}.
ПОЗИТИВ: ${topKeywords.slice(0, 3).join(', ') || 'данных недостаточно'}
НЕГАТИВ: требуется внимание к качеству и обслуживанию
РЕКОМЕНДАЦИИ: улучшить описание товара, отслеживать отзывы покупателей`;
    }

    return {
      success: true,
      data: {
        productId: product.id,
        productName: product.name,
        totalReviews: product.reviews.length,
        summary,
        positiveCount,
        negativeCount,
        neutralCount,
        topKeywords,
        averageSentiment,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error generating product insights:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при генерации сводки',
    };
  }
}
