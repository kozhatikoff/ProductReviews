import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SENTIMENTS = ['positive', 'negative', 'neutral'] as const;
type Sentiment = (typeof SENTIMENTS)[number];

export async function GET() {
  try {
    const [products, reviews] = await Promise.all([
      prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.review.findMany({ include: { product: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } }),
    ]);

    const total = reviews.length;
    const sentimentCounts = reviews.reduce<Record<Sentiment, number>>((acc, review) => {
      const s = review.sentiment as Sentiment;
      if (SENTIMENTS.includes(s)) acc[s] += 1;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });

    const sentimentPercentages = {
      positive: total ? Number(((sentimentCounts.positive / total) * 100).toFixed(1)) : 0,
      negative: total ? Number(((sentimentCounts.negative / total) * 100).toFixed(1)) : 0,
      neutral: total ? Number(((sentimentCounts.neutral / total) * 100).toFixed(1)) : 0,
    };

    const byDay = new Map<string, number>();
    for (const r of reviews) {
      const day = r.createdAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }

    const activityByDay = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));

    return NextResponse.json({ products, reviews, stats: { total, sentimentCounts, sentimentPercentages, activityByDay } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 });
  }
}
