'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Star, MessageCircle } from 'lucide-react';

interface ProductStats {
  totalReviews: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  averageRating: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  stats: ProductStats;
}

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => {
        let isFilled = false;
        if (i < fullStars) {
          isFilled = true;
        } else if (i === fullStars && hasHalfStar) {
          isFilled = true;
        }
        
        return (
          <Star
            key={i}
            size={16}
            className={`transition-colors ${
              isFilled ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
          />
        );
      })}
      <span className="ml-1 text-sm font-semibold text-slate-700">{rating}</span>
    </div>
  );
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="text-center space-y-3 pb-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Все товары
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Изучите отзывы других покупателей, читайте ИИ-сводки и оставляйте свои мнения
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-600 text-lg">Товары не найдены</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <Link href={`/product/${product.id}`} className="block h-full">
                <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 overflow-hidden group">
                  {/* Верхняя часть - изображение товара */}
                  <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden relative">
                    <div className="w-full h-full flex items-center justify-center">
                      {/* Заглушка для изображения товара */}
                      <div className="text-6xl text-slate-400 group-hover:scale-110 transition-transform duration-300">
                        📦
                      </div>
                    </div>
                    {/* Лента "Популярный" */}
                    {product.stats.totalReviews > 5 && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Популярно
                      </div>
                    )}
                  </div>

                  <CardContent className="pt-6 space-y-4">
                    {/* Название товара */}
                    <h2 className="text-xl font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h2>

                    {/* Описание товара */}
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Разделитель */}
                    <div className="h-px bg-slate-200"></div>

                    {/* Рейтинг и звёзды */}
                    <div className="space-y-2">
                      <StarRating rating={product.stats.averageRating} />
                      <p className="text-xs text-slate-500">
                        на основе {product.stats.totalReviews} отзыво{
                          product.stats.totalReviews % 10 === 1 && product.stats.totalReviews !== 11 ? 'в'
                          : product.stats.totalReviews % 10 >= 2 && product.stats.totalReviews % 10 <= 4 && (product.stats.totalReviews < 10 || product.stats.totalReviews >= 20) ? 'в'
                          : 'ов'
                        }
                      </p>
                    </div>

                    {/* Статистика по тональности */}
                    <div className="bg-gradient-to-r from-green-50 to-red-50 rounded-lg p-3 space-y-2">
                      {/* Прогресс-бар */}
                      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-200">
                        {product.stats.totalReviews > 0 && (
                          <>
                            <div
                              className="bg-green-500 transition-all"
                              style={{
                                width: `${(product.stats.positiveCount / product.stats.totalReviews) * 100}%`,
                              }}
                            />
                            <div
                              className="bg-slate-400 transition-all"
                              style={{
                                width: `${(product.stats.neutralCount / product.stats.totalReviews) * 100}%`,
                              }}
                            />
                            <div
                              className="bg-red-500 transition-all"
                              style={{
                                width: `${(product.stats.negativeCount / product.stats.totalReviews) * 100}%`,
                              }}
                            />
                          </>
                        )}
                      </div>

                      {/* Легенда */}
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          {product.stats.positiveCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          {product.stats.neutralCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          {product.stats.negativeCount}
                        </span>
                      </div>
                    </div>

                    {/* Кнопка с количеством отзывов */}
                    <div className="flex items-center justify-center gap-2 pt-2 text-blue-600 font-semibold text-sm group-hover:text-blue-700 transition-colors">
                      <MessageCircle size={16} />
                      Смотреть отзывы и сводку
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
