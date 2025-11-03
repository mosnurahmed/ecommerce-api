// src/app/api/products/[slug]/route.ts
// Replace ENTIRE file:

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Next.js 15 Change: params is now a Promise
// কি পরিবর্তন: params direct access করা যায় না, await করতে হয়
// কেন পরিবর্তন: Better async handling, performance optimization
// কিভাবে: async/await pattern use করতে হবে
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Await params to get actual slug value
    // কি করছি: params Promise resolve করে slug বের করছি
    // কেন করছি: Next.js 15 এ params asynchronous
    // কিভাবে: await keyword দিয়ে Promise unwrap করছি
    // 
    // Before Next.js 15:
    // const slug = params.slug ← Direct access
    // 
    // Next.js 15+:
    // const { slug } = await params ← Must await
    const { slug } = await params

    const product = await prisma.product.findUnique({
      where: {
        slug: slug,
        isActive: true,
      },
      include: {
        category: true,
        variants: {
          orderBy: { price: 'asc' },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}