// src/app/api/categories/[slug]/route.ts
// কি: Get single category details by slug
// কেন: Category landing page এ category info + stats দেখাতে
// HTTP Method: GET

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET Handler - Single Category Details
// কি করছি: Slug দিয়ে specific category fetch করছি full details সহ
// কেন করছি: Category page এ show করতে:
//   - Category name, description, image
//   - Total products count
//   - Price range (min/max)
//   - Featured products preview
//   - Related categories (optional)
// 
// URL Examples:
// /api/categories/electronics → Electronics category
// /api/categories/clothing → Clothing category
// /api/categories/invalid-slug → 404 error
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    // কি করছি: params Promise resolve করে slug extract করছি
    const { slug } = await params

    // Fetch Category with Aggregated Data
    // কি করছি: Category + related statistics একসাথে fetch করছি
    // কেন করছি: Category page এ comprehensive information দেখাতে
    // কিভাবে: Prisma include + aggregations
    const category = await prisma.category.findUnique({
      where: { slug },
      
      include: {
        // Product Count
        // কি করছি: Total products in this category
        // কেন করছি: Show "156 products available"
        _count: {
          select: { products: true },
        },
        
        // Featured Products (First 6)
        // কি করছি: Category এর featured products fetch করছি
        // কেন করছি: Category page hero section এ showcase করতে
        // কিভাবে: Filter by featured + active, limit 6
        // 
        // Use Case:
        // Category: Electronics
        // Hero Section:
        // "Featured Electronics"
        // [Product 1] [Product 2] [Product 3]
        // [Product 4] [Product 5] [Product 6]
        products: {
          where: {
            isActive: true,
            featured: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            images: true,
            featured: true,
          },
          take: 6,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    // Not Found Check
    // কি করছি: Category না পেলে 404 return করছি
    // কেন করছি: Invalid slug handle করতে
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Calculate Price Range (Aggregate Query)
    // কি করছি: Category এর products এর min/max price calculate করছি
    // কেন করছি: Show করতে "Products from $19.99 to $2,999.99"
    // কিভাবে: Separate aggregation query (Prisma aggregate)
    // 
    // Why separate query:
    // - findUnique can't do aggregations directly
    // - Need MIN() and MAX() SQL functions
    // 
    // Use Case:
    // Category: Electronics
    // Products:
    // - Phone Case: $19.99 ← Min
    // - Laptop: $2,999.99 ← Max
    // Display: "From $19.99 to $2,999.99"
    const priceRange = await prisma.product.aggregate({
      where: {
        categoryId: category.id,
        isActive: true,
      },
      _min: {
        basePrice: true,  // Minimum price
      },
      _max: {
        basePrice: true,  // Maximum price
      },
    })

    // Enhanced Response with Statistics
    // কি করছি: Category data + calculated stats return করছি
    // কেন করছি: Frontend single response এ সব info পাবে
    // কিভাবে: Custom response structure
    // 
    // Response Structure:
    // {
    //   category: {
    //     id: "cat_electronics",
    //     name: "Electronics",
    //     slug: "electronics",
    //     description: "Electronic devices and gadgets",
    //     image: "https://cdn.../electronics.jpg",
    //     _count: { products: 156 },
    //     products: [6 featured products]
    //   },
    //   stats: {
    //     totalProducts: 156,
    //     priceRange: {
    //       min: 19.99,
    //       max: 2999.99
    //     }
    //   }
    // }
    // 
    // Frontend Usage:
    // const { category, stats } = data
    // 
    // <h1>{category.name}</h1>
    // <p>{category.description}</p>
    // <p>{stats.totalProducts} products available</p>
    // <p>From ${stats.priceRange.min} to ${stats.priceRange.max}</p>
    // 
    // <div className="featured-products">
    //   {category.products.map(product => (
    //     <ProductCard key={product.id} {...product} />
    //   ))}
    // </div>
    return NextResponse.json({
      category,
      stats: {
        totalProducts: category._count.products,
        priceRange: {
          min: priceRange._min.basePrice || 0,
          max: priceRange._max.basePrice || 0,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}