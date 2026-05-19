'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { generateProductInsights } from '@/actions/insights';
import { TrendingUp, AlertCircle, Star, Target } from 'lucide-react';

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

interface InsightsProps {
  productId: number;
}

// Парсер сводки для структурированного отображения
function parseSummary(text: string) {
  const lines = text.split('\n');
  const sections: {
    impression?: string;
    positive: string[];
    negative: string[];
    recommendations: string[];
  } = {
    positive: [],
    negative: [],
    recommendations: [],
  };

  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.includes('ВПЕЧАТЛЕНИЕ') || trimmed.includes('Впечатление')) {
      currentSection = 'impression';
      sections.impression = trimmed
        .replace(/\*\*ВПЕЧАТЛЕНИЕ:\*\*/i, '')
        .replace(/ВПЕЧАТЛЕНИЕ:/i, '')
        .trim();
    } else if (trimmed.includes('ПОЗИТИВ') || trimmed.includes('Позитив')) {
      currentSection = 'positive';
    } else if (trimmed.includes('НЕГАТИВ') || trimmed.includes('Негатив')) {
      currentSection = 'negative';
    } else if (trimmed.includes('РЕКОМЕНДАЦИИ') || trimmed.includes('Рекомендации')) {
      currentSection = 'recommendations';
    } else if (trimmed && trimmed !== '**ВПЕЧАТЛЕНИЕ:**' && trimmed !== '**ПОЗИТИВ:**' && trimmed !== '**НЕГАТИВ:**' && trimmed !== '**РЕКОМЕНДАЦИИ:**') {
      const items = trimmed
        .replace(/^[-–•]\s*/, '')
        .split(/[,;]/);
      
      for (const item of items) {
        const cleaned = item.trim().replace(/^[-–•]\s*/, '');
        if (cleaned && currentSection && currentSection !== 'impression') {
          const sectionKey = currentSection as 'positive' | 'negative' | 'recommendations';
          const sectionArray = sections[sectionKey];
          if (sectionArray && !sectionArray.includes(cleaned)) {
            sectionArray.push(cleaned);
          }
        }
      }
    }
  }

  return sections;
}

export function ProductInsights({ productId }: InsightsProps) {
  const [insights, setInsights] = useState<ProductInsightsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleGenerateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateProductInsights(productId);

      if (result.success && result.data) {
        setInsights(result.data);
        setIsExpanded(true);
      } else {
        setError(result.error || 'Ошибка при генерации сводки');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const parsedSummary = insights ? parseSummary(insights.summary) : null;
  const totalAnalyzed = insights ? insights.positiveCount + insights.negativeCount + insights.neutralCount : 0;

  return (
    <div className="w-full space-y-4">
      {/* Кнопка генерации */}
      <Button
        onClick={handleGenerateInsights}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⚙️</span>
            Анализирование отзывов...
          </span>
        ) : insights ? (
          <span className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Обновить сводку
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Создать сводку по отзывам
          </span>
        )}
      </Button>

      {/* Ошибка */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Сводка */}
      {insights && parsedSummary && (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
          {/* Заголовок с статусом */}
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl flex items-center gap-2 mb-1">
                  <span>📊</span>
                  <span>Анализ отзывов</span>
                </CardTitle>
                <CardDescription className="text-blue-100 text-xs">
                  {totalAnalyzed} отзывов • Обновлено {new Date(insights.lastUpdated).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </CardDescription>
              </div>
              <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                insights.averageSentiment === 'positive'
                  ? 'bg-green-100 text-green-800'
                  : insights.averageSentiment === 'negative'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {insights.averageSentiment === 'positive' && '✓ Позитив'}
                {insights.averageSentiment === 'negative' && '✗ Негатив'}
                {insights.averageSentiment === 'neutral' && '○ Нейтрально'}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Статистика - три колонки */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4 border border-green-200 text-center">
                <div className="text-3xl font-bold text-green-700 mb-1">
                  {insights.positiveCount}
                </div>
                <div className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                  Позитивных
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {Math.round((insights.positiveCount / totalAnalyzed) * 100)}%
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-4 border border-gray-200 text-center">
                <div className="text-3xl font-bold text-gray-700 mb-1">
                  {insights.neutralCount}
                </div>
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Нейтральных
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {Math.round((insights.neutralCount / totalAnalyzed) * 100)}%
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100 p-4 border border-red-200 text-center">
                <div className="text-3xl font-bold text-red-700 mb-1">
                  {insights.negativeCount}
                </div>
                <div className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                  Негативных
                </div>
                <div className="text-xs text-red-600 mt-1">
                  {Math.round((insights.negativeCount / totalAnalyzed) * 100)}%
                </div>
              </div>
            </div>

            {/* Прогресс-бар */}
            <div className="space-y-2">
              <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="bg-green-500"
                  style={{ width: `${(insights.positiveCount / totalAnalyzed) * 100}%` }}
                />
                <div
                  className="bg-gray-500"
                  style={{ width: `${(insights.neutralCount / totalAnalyzed) * 100}%` }}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${(insights.negativeCount / totalAnalyzed) * 100}%` }}
                />
              </div>
            </div>

            {/* Впечатление */}
            {parsedSummary.impression && (
              <div className="rounded-lg bg-blue-50 border-l-4 border-blue-500 p-4">
                <h4 className="font-semibold text-sm text-blue-900 mb-2 flex items-center gap-2">
                  <span>💭</span> Общее впечатление
                </h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {parsedSummary.impression}
                </p>
              </div>
            )}

            {/* Позитив */}
            {parsedSummary.positive.length > 0 && (
              <div className="rounded-lg bg-green-50 border-l-4 border-green-500 p-4">
                <h4 className="font-semibold text-sm text-green-900 mb-3 flex items-center gap-2">
                  <span>✅</span> Что нравится покупателям
                </h4>
                <div className="space-y-2">
                  {parsedSummary.positive.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-lg leading-none mt-0.5">+</span>
                      <span className="text-sm text-green-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Негатив */}
            {parsedSummary.negative.length > 0 && (
              <div className="rounded-lg bg-red-50 border-l-4 border-red-500 p-4">
                <h4 className="font-semibold text-sm text-red-900 mb-3 flex items-center gap-2">
                  <span>⚠️</span> На что обратить внимание
                </h4>
                <div className="space-y-2">
                  {parsedSummary.negative.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-red-600 font-bold text-lg leading-none mt-0.5">−</span>
                      <span className="text-sm text-red-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Рекомендации */}
            {parsedSummary.recommendations.length > 0 && (
              <div className="rounded-lg bg-orange-50 border-l-4 border-orange-500 p-4">
                <h4 className="font-semibold text-sm text-orange-900 mb-3 flex items-center gap-2">
                  <span>🎯</span> Рекомендации по улучшению
                </h4>
                <div className="space-y-2">
                  {parsedSummary.recommendations.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-orange-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ключевые темы */}
            {insights.topKeywords.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <span>🏷️</span> Основные темы отзывов
                </h4>
                <div className="flex flex-wrap gap-2">
                  {insights.topKeywords.slice(0, 8).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition-colors"
                    >
                      <span>#{keyword}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
