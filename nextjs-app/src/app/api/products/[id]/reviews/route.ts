import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = Number(params.id);
    const reviews = await prisma.review.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(reviews);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = Number(params.id);
    const body = await request.json();
    const text = String(body.text || '').trim();
    if (!text) return NextResponse.json({ error: 'Review text is required' }, { status: 400 });

    const review = await prisma.review.create({ data: { text, productId } });
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
