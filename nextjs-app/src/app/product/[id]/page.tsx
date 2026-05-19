'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { analyzeAndCreateReview } from '@/actions/reviews';
import { ProductInsights } from '@/components/ProductInsights';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
}

interface Review {
  id: number;
  text: string;
  sentiment: string;
  keywords: string | null;
  isToxic: boolean;
  createdAt: string;
}

const sentimentConfig = {
  positive: {
    color: 'bg-green-100 text-green-800',
    label: 'Позитив',
  },
  negative: {
    color: 'bg-red-100 text-red-800',
    label: 'Негатив',
  },
  neutral: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Нейтрально',
  },
};

export default function ProductPage() {
  const params = useParams();
  const productId = parseInt(params.id as string, 10);

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          fetch(`/api/products/${productId}`),
          fetch(`/api/products/${productId}/reviews`),
        ]);

        const productData = await productRes.json();
        const reviewsData = await reviewsRes.json();

        setProduct(productData);
        setReviews(reviewsData);
      } catch (fetchError) {
        console.error('Error fetching data:', fetchError);
        setError('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewText.trim()) {
      setError('Пожалуйста, введите текст отзыва');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await analyzeAndCreateReview(productId, reviewText);

      if (result.success && result.data) {
        const newReview: Review = {
          id: result.data.id,
          text: result.data.text,
          sentiment: result.data.sentiment,
          keywords: result.data.keywords,
          isToxic: result.data.isToxic,
          createdAt: result.data.createdAt,
        };

        setReviews([newReview, ...reviews]);
        setReviewText('');
        toast.success('Успешно! Отзыв отправлен на анализ ИИ', {
          icon: <CheckCircle2 className="h-4 w-4" />,
        });
      } else {
        setError(result.error || 'Ошибка при добавлении отзыва');
      }
    } catch (submitError) {
      console.error('Error submitting review:', submitError);
      setError('Ошибка при добавлении отзыва');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">Продукт не найден</p>
        <Link href="/">
          <Button>Вернуться к продуктам</Button>
        </Link>
      </div>
    );
  }

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <div>
      <Link href="/" className="mb-6 inline-block">
        <Button variant="outline">← Назад к продуктам</Button>
      </Link>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">{product.name}</CardTitle>
          <CardDescription className="text-base mt-2">{product.description}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6 text-slate-900">Отзывы ({reviews.length})</h2>

          {reviews.length === 0 ? (
            <p className="text-slate-600 py-8">Отзывов еще нет. Будьте первым!</p>
          ) : (
            <motion.div
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {reviews.map((review) => (
                <motion.div key={review.id} variants={itemVariants}>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              sentimentConfig[review.sentiment as keyof typeof sentimentConfig]?.color
                            }`}
                          >
                            {sentimentConfig[review.sentiment as keyof typeof sentimentConfig]?.label ||
                              review.sentiment}
                          </span>
                          {review.isToxic && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                              Содержит грубость
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          {new Date(review.createdAt).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>

                      <p className="text-slate-900 mb-4">{review.text}</p>

                      {review.keywords && (
                        <div className="flex flex-wrap gap-2">
                          {review.keywords.split(',').map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium"
                            >
                              #{keyword.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        <div>
          <ProductInsights productId={product.id} />
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Оставить отзыв</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <Textarea
                  placeholder="Напишите ваш отзыв... (будет автоматически проанализирован ИИ)"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={5}
                  disabled={submitting}
                />
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Анализирование и отправка...' : 'Отправить отзыв'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
