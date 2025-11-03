// src/app/api/products/[slug]/reviews/route.ts
// Separate endpoint শুধু reviews এর জন্য

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET Handler for Paginated Reviews
// কি করছি: শুধু reviews fetch করছি pagination সহ
// কেন করছি: "Load More" button এ efficient loading
// কিভাবে: skip + take pattern
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    
    // Pagination params
    // page=1 → First 10 reviews (skip 0)
    // page=2 → Next 10 reviews (skip 10)
    // page=3 → Next 10 reviews (skip 20)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // First, verify product exists
    // কি করছি: Product আছে কিনা check করছি
    // কেন করছি: Invalid slug এ reviews fetch করা pointless
    // কিভাবে: Simple findUnique without includes (fast)
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      select: { id: true }  // শুধু ID চাই
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Fetch reviews with pagination
    // কি করছি: Product এর reviews fetch করছি page অনুযায়ী
    // কেন করছি: User scroll করলে আরও reviews load করতে
    // কিভাবে: Parallel queries (reviews + count)
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId: product.id
        },
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: { productId: product.id }
      })
    ])

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total  // আরও reviews আছে?
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}