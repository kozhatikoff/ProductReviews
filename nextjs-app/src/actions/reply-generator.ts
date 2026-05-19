'use server';

import { prisma } from '@/lib/prisma';
import { generateAiText } from '@/lib/ai-text';

export async function generateOwnerReply(reviewText: string): Promise<{ success: boolean; reply?: string; error?: string }> {
  try {
    const reply = await generateAiText({
      systemPrompt: 'Ты PR-менеджер. Напиши вежливый профессиональный ответ на отзыв. Если негативный — извинись и предложи решение, если позитивный — поблагодари.',
      input: reviewText,
      yandexPromptId: process.env.YANDEX_PROMPT_ID_REPLY,
      temperature: 0.4,
      maxTokens: 220,
    });
    if (!reply) return { success: false, error: 'Модель не вернула ответ' };
    return { success: true, reply };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Ошибка генерации' };
  }
}

export async function saveOwnerReply(reviewId: number, ownerReply: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.review.update({ where: { id: reviewId }, data: { ownerReply: ownerReply.trim() || null } });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Ошибка сохранения' };
  }
}
