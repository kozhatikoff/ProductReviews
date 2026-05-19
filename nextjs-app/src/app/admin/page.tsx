'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { analyzeAndCreateReview } from '@/actions/reviews';
import { generateBusinessInsights } from '@/actions/insights';
import { generateOwnerReply, saveOwnerReply } from '@/actions/reply-generator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TypewriterText from '@/components/TypewriterText';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProductOption { id: number; name: string }
interface ReviewItem {
  id: number;
  text: string;
  sentiment: string;
  keywords: string | null;
  isToxic: boolean;
  ownerReply?: string | null;
  createdAt: string;
  product: { id: number; name: string };
}
interface AdminStats {
  total: number;
  sentimentPercentages: { positive: number; negative: number; neutral: number };
  activityByDay: Array<{ date: string; count: number }>;
}

const PIE_COLORS = ['#16a34a', '#dc2626', '#64748b'];

export default function AdminPage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProcessed, setBulkProcessed] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);

  const [insightLoading, setInsightLoading] = useState(false);
  const [insightText, setInsightText] = useState('');

  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [ownerReplyDraft, setOwnerReplyDraft] = useState('');
  const [replyGenerating, setReplyGenerating] = useState(false);
  const [replySaving, setReplySaving] = useState(false);

  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [productFilter, setProductFilter] = useState<'all' | number>('all');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/reviews');
      const data = await res.json();
      setProducts(data.products ?? []);
      setReviews(data.reviews ?? []);
      setStats(data.stats ?? null);
      if (!selectedProductId && data.products?.length) setSelectedProductId(data.products[0].id);
      setError(null);
    } catch {
      setError('Ошибка загрузки админ-данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredReviews = useMemo(() => reviews.filter((r) => {
    const bySentiment = sentimentFilter === 'all' || r.sentiment === sentimentFilter;
    const byProduct = productFilter === 'all' || r.product.id === productFilter;
    return bySentiment && byProduct;
  }), [reviews, sentimentFilter, productFilter]);

  const handleBulkUpload = async () => {
    if (!selectedProductId || !csvFile) return;
    setBulkRunning(true);
    setBulkProcessed(0);
    try {
      const lines = (await csvFile.text()).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      setBulkTotal(lines.length);
      let toxicNotified = false;
      for (let i = 0; i < lines.length; i += 1) {
        const res = await analyzeAndCreateReview(selectedProductId, lines[i]);
        if (res.success && res.data?.isToxic && !toxicNotified) {
          toast.error('Внимание: Обнаружен токсичный контент!');
          toxicNotified = true;
        }
        setBulkProcessed(i + 1);
        await new Promise((r) => setTimeout(r, 600));
      }
      await fetchData();
    } finally {
      setBulkRunning(false);
    }
  };

  const handleGenerateInsights = async () => {
    setInsightLoading(true);
    const result = await generateBusinessInsights();
    if (result.success && result.summary) setInsightText(result.summary);
    else setError(result.error || 'Ошибка генерации сводки');
    setInsightLoading(false);
  };

  const openReply = (review: ReviewItem) => {
    setSelectedReview(review);
    setOwnerReplyDraft(review.ownerReply || '');
  };

  const handleGenerateReply = async () => {
    if (!selectedReview) return;
    setReplyGenerating(true);
    const result = await generateOwnerReply(selectedReview.text);
    if (result.success && result.reply) {
      setOwnerReplyDraft('');
      for (let i = 0; i < result.reply.length; i += 1) {
        setOwnerReplyDraft(result.reply.slice(0, i + 1));
        await new Promise((r) => setTimeout(r, 15));
      }
    } else {
      setError(result.error || 'Ошибка генерации ответа');
    }
    setReplyGenerating(false);
  };

  const handleSaveReply = async () => {
    if (!selectedReview) return;
    setReplySaving(true);
    const result = await saveOwnerReply(selectedReview.id, ownerReplyDraft);
    if (!result.success) setError(result.error || 'Ошибка сохранения ответа');
    else {
      setSelectedReview(null);
      await fetchData();
    }
    setReplySaving(false);
  };

  if (loading) return <div className="py-20 text-center">Загрузка админки...</div>;

  const pieData = [
    { name: 'Позитивные', value: stats?.sentimentPercentages.positive || 0 },
    { name: 'Негативные', value: stats?.sentimentPercentages.negative || 0 },
    { name: 'Нейтральные', value: stats?.sentimentPercentages.neutral || 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Админ-панель</h1>
        <p className="text-slate-600">Статистика, AI-инсайты и модерация</p>
      </div>

      {error && <div className="rounded-md bg-red-100 p-3 text-red-800">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Всего отзывов</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-bold">{stats?.total ?? 0}</div></CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Тональность</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} isAnimationActive animationDuration={900}>
                  {pieData.map((x, i) => <Cell key={x.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v ?? 0}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Активность по дням</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.activityByDay ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" isAnimationActive animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Business Insights</CardTitle>
          <CardDescription>Сводка по последним 20 отзывам</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerateInsights} disabled={insightLoading}>
            {insightLoading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />ИИ анализирует...</span> : 'Сгенерировать бизнес-сводку'}
          </Button>
          {insightText && (
            <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
              <div className="mb-2 flex items-center gap-2 text-violet-700"><span>✨</span><span className="font-semibold">AI Sparkle Insight</span></div>
              <TypewriterText text={insightText} speedMs={14} className="leading-7 text-slate-800" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Пакетная загрузка CSV</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row">
            <select className="h-10 rounded-md border border-slate-300 px-3" value={selectedProductId ?? ''} onChange={(e) => setSelectedProductId(Number(e.target.value))}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="file" accept=".csv,text/csv" className="h-10 rounded-md border border-slate-300 px-3 py-2" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} />
            <Button onClick={handleBulkUpload} disabled={bulkRunning || !csvFile || !selectedProductId}>{bulkRunning ? 'Загрузка...' : 'Загрузить CSV'}</Button>
          </div>
          {(bulkRunning || bulkProcessed > 0) && (
            <>
              <p className="text-sm text-slate-700">Проанализировано {bulkProcessed} из {bulkTotal}</p>
              <div className="relative overflow-hidden rounded-full">
                <Progress value={bulkTotal ? Math.round((bulkProcessed / bulkTotal) * 100) : 0} />
                {bulkRunning && <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.45),transparent)] bg-[length:200%_100%] animate-shimmer" />}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Все отзывы</CardTitle>
          <CardDescription>Фильтрация по тональности и продуктам</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row">
            <select className="h-10 rounded-md border border-slate-300 px-3" value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value as 'all' | 'positive' | 'negative')}>
              <option value="all">Все тональности</option>
              <option value="positive">Только позитивные</option>
              <option value="negative">Только негативные</option>
            </select>
            <select className="h-10 rounded-md border border-slate-300 px-3" value={productFilter} onChange={(e) => setProductFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
              <option value="all">Все продукты</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-700">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Продукт</th>
                  <th className="px-4 py-3 text-left">Отзыв</th>
                  <th className="px-4 py-3 text-left">Тональность</th>
                  <th className="px-4 py-3 text-left">Ключевые слова</th>
                  <th className="px-4 py-3 text-left">Дата</th>
                  <th className="px-4 py-3 text-left">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((r) => (
                  <tr key={r.id} className={`border-b ${r.isToxic ? 'bg-red-50' : 'bg-white'} hover:bg-slate-50`}>
                    <td className="px-4 py-3 align-top font-medium">{r.id}</td>
                    <td className="px-4 py-3 align-top font-semibold text-slate-800">{r.product.name}</td>
                    <td className="px-4 py-3 align-top max-w-[420px] text-slate-700">{r.text}</td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          r.sentiment === 'positive'
                            ? 'bg-green-100 text-green-700'
                            : r.sentiment === 'negative'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.sentiment}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-slate-700">{r.keywords || '-'}</td>
                    <td className="px-4 py-3 align-top text-slate-700">
                      {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" onClick={() => openReply(r)}>
                          Ответить
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            await fetch(`/api/admin/reviews/${r.id}`, { method: 'DELETE' });
                            await fetchData();
                          }}
                        >
                          Удалить отзыв
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedReview)} onOpenChange={(v) => !v && setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Генератор ответа на отзыв</DialogTitle>
            <DialogDescription>Сгенерируйте и отредактируйте ответ владельца.</DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="rounded-md bg-slate-100 p-3 text-sm">{selectedReview.text}</div>
              <Button onClick={handleGenerateReply} disabled={replyGenerating} className={replyGenerating ? 'animate-pulse-glow' : ''}>
                {replyGenerating ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />ИИ анализирует...</span> : 'Сгенерировать ответ ИИ'}
              </Button>
              <Textarea rows={6} value={ownerReplyDraft} onChange={(e) => setOwnerReplyDraft(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>Отмена</Button>
            <Button onClick={handleSaveReply} disabled={replySaving}>{replySaving ? 'Сохранение...' : 'Сохранить ответ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
