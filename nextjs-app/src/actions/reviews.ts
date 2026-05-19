'use server';

import { prisma } from '@/lib/prisma';
import { generateAiText } from '@/lib/ai-text';

interface ReviewAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
  isToxic: boolean;
}

interface AnalyzeReviewResponse {
  success: boolean;
  data?: {
    id: number;
    text: string;
    sentiment: string;
    keywords: string | null;
    isToxic: boolean;
    createdAt: string;
    productId: number;
  };
  error?: string;
}

function extractJsonCandidate(raw: string): string {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence?.[1]) return fence[1].trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

export async function analyzeAndCreateReview(productId: number, reviewText: string): Promise<AnalyzeReviewResponse> {
  try {
    if (!reviewText.trim()) return { success: false, error: 'Текст отзыва не может быть пустым' };

    const responseText = await generateAiText({
      systemPrompt: 'Ты аналитик отзывов. Верни только JSON с полями: sentiment (positive, negative, neutral), keywords (2-3 строки), isToxic (boolean).',
      input: reviewText.trim(),
      yandexPromptId: process.env.YANDEX_PROMPT_ID,
      temperature: 0.2,
      maxTokens: 300,
    });

    let analysis: ReviewAnalysis;
    try {
      analysis = JSON.parse(extractJsonCandidate(responseText));
    } catch {
      return { success: false, error: 'Ошибка при анализе текста отзыва: модель вернула ответ не в JSON-формате.' };
    }

    if (!['positive', 'negative', 'neutral'].includes(analysis.sentiment) || !Array.isArray(analysis.keywords) || typeof analysis.isToxic !== 'boolean') {
      return { success: false, error: 'Модель вернула некорректный формат анализа.' };
    }

    const review = await prisma.review.create({
      data: {
        text: reviewText.trim(),
        sentiment: analysis.sentiment,
        keywords: analysis.keywords.slice(0, 3).join(', '),
        isToxic: analysis.isToxic,
        productId,
      },
    });

    return {
      success: true,
      data: {
        id: review.id,
        text: review.text,
        sentiment: review.sentiment,
        keywords: review.keywords,
        isToxic: review.isToxic,
        createdAt: review.createdAt.toISOString(),
        productId: review.productId,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return { success: false, error: message };
  }
}
