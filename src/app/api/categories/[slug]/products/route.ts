// src/app/api/categories/[slug]/products/route.ts
// কি: Get all products in a specific category with filtering
// কেন: Category page এ products list করতে advanced filters সহ
// HTTP Method: GET

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET Handler - Products in Category with Filters
// কি করছি: Specific category এর products fetch with multiple filters
// কেন করছি: Category page এ comprehensive filtering system
// 
// Query Parameters:
// - search: Product name search
// - minPrice: Minimum price filter
// - maxPrice: Maximum price filter
// - inStock: Only in-stock products?
// - sort: Sort order (newest, price_asc, price_desc, popular)
// - page: Pagination page
// - limit: Items per page
// 
// Examples:
// /api/categories/electronics/products
// /api/categories/electronics/products?search=iphone
// /api/categories/electronics/products?minPrice=500&maxPrice=1500
// /api/categories/electronics/products?inStock=true&sort=price_asc
// /api/categories/clothing/products?search=shirt&sort=popular&page=2
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Extract slug from params
    const { slug } = await params
    
    // Extract query parameters
    const { searchParams } = new URL(request.url)
    
    // Search Parameter
    // কি: Product name search within category
    // Example: ?search=laptop → Matches "MacBook Pro", "Dell Laptop"
    const search = searchParams.get('search')
    
    // Price Range Filters
    // কি করছি: Min and max price boundaries
    // কেন করছি: User price range slider use করতে পারবে
    // Example: ?minPrice=100&maxPrice=500 → $100 to $500 products
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    
    // Stock Filter
    // কি করছি: Only show in-stock products?
    // কেন করছি: Customer শুধু available products দেখতে চায়
    // Default: false (show all)
    // ?inStock=true → Only products with stock > 0
    const inStock = searchParams.get('inStock') === 'true'
    
    // Sort Parameter
    // Options:
    // - newest: Recently added first
    // - price_asc: Cheapest first
    // - price_desc: Most expensive first
    // - popular: Best selling (requires sales data - future)
    // - name: Alphabetical
    const sort = searchParams.get('sort') || 'newest'
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Verify Category Exists
    // কি করছি: Category আছে কিনা check করছি
    // কেন করছি: Invalid category slug এ products fetch করা pointless
    // কিভাবে: Simple findUnique, just need ID
    const category = await prisma.category.findUnique({
      where: { slug },
      select: { id: true, name: true },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Build WHERE Clause - Complex Filtering
    // কি করছি: Multiple conditions combine করছি
    // কেন করছি: User এর সব filters একসাথে apply করতে
    const where: any = {
      categoryId: category.id,  // Must be in this category
      isActive: true,           // Only active products
    }

    // Filter 1: Search by Product Name
    // কি করছি: যদি search query থাকে, name এ match করছি
    // কেন করছি: User search box use করলে relevant products show করতে
    // কিভাবে: Case-insensitive partial match
    // 
    // Example:
    // Category: Electronics
    // Search: "iphone"
    // Matches:
    //   ✅ "iPhone 15 Pro"
    //   ✅ "iPhone Case"
    //   ✅ "Apple iPhone"
    //   ❌ "Samsung Galaxy"
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Filter 2: Price Range
    // কি করছি: Min/max price boundaries apply করছি
    // কেন করছি: Price slider filter
    // কিভাবে: gte (greater than or equal), lte (less than or equal)
    // 
    // Scenarios:
    // 1. Only minPrice: ?minPrice=100
    //    where.basePrice = { gte: 100 }
    //    Products >= $100
    // 
    // 2. Only maxPrice: ?maxPrice=500
    //    where.basePrice = { lte: 500 }
    //    Products <= $500
    // 
    // 3. Both: ?minPrice=100&maxPrice=500
    //    where.basePrice = { gte: 100, lte: 500 }
    //    Products between $100 and $500
    // 
    // Example:
    // Category: Electronics
    // Filter: $500 to $1500
    // Results:
    //   ✅ iPad: $799
    //   ✅ iPhone: $999
    //   ✅ MacBook Air: $1299
    //   ❌ MacBook Pro: $2499 (too expensive)
    //   ❌ AirPods: $249 (too cheap)
    if (minPrice || maxPrice) {
      where.basePrice = {}
      
      if (minPrice) {
        where.basePrice.gte = parseFloat(minPrice)
      }
      
      if (maxPrice) {
        where.basePrice.lte = parseFloat(maxPrice)
      }
    }

    // Filter 3: In-Stock Only
    // কি করছি: যদি inStock=true, শুধু available products
    // কেন করছি: Customer out-of-stock products দেখতে চায় না
    // কিভাবে: Nested relation filter (variants with stock > 0)
    // 
    // Logic:
    // Product has variants
    // At least one variant must have stock > 0
    // 
    // Example:
    // Product: T-Shirt
    // Variants:
    // - Red Medium: stock = 0 ❌
    // - Blue Medium: stock = 10 ✅
    // Result: Product shown (has one in-stock variant)
    // 
    // Prisma Filter:
    // variants: { some: { stock: { gt: 0 } } }
    // "some" = at least one variant matches
    if (inStock) {
      where.variants = {
        some: {
          stock: { gt: 0 },
        },
      }
    }

    // Determine ORDER BY Clause
    // কি করছি: sort parameter based on ordering define করছি
    // কেন করছি: Different sorting needs different scenarios
    let orderBy: any = { createdAt: 'desc' }  // Default: newest first

    switch (sort) {
      case 'price_asc':
        // Cheapest First
        // কি করছি: Price ascending order (low → high)
        // কেন করছি: Budget shoppers want cheap options first
        // Example: $19.99, $29.99, $49.99, $99.99
        orderBy = { basePrice: 'asc' }
        break

      case 'price_desc':
        // Most Expensive First
        // কি করছি: Price descending order (high → low)
        // কেন করছি: Premium shoppers, luxury products
        // Example: $2999.99, $1999.99, $999.99, $499.99
        orderBy = { basePrice: 'desc' }
        break

      case 'name':
        // Alphabetical Order
        // কি করছি: Product names A → Z
        // কেন করছি: Easy browsing, predictable order
        // Example: AirPods, iPhone, MacBook, Watch
        orderBy = { name: 'asc' }
        break

      case 'popular':
        // Most Popular (Future Enhancement)
        // কি করছি: Best selling products first
        // কেন করছি: Social proof, trending products
        // কিভাবে: Requires order count tracking (not implemented yet)
        // 
        // Current: Fallback to featured + newest
        // Future: ORDER BY (SELECT COUNT(*) FROM order_items WHERE productId = products.id) DESC
        // 
        // Placeholder Logic:
        // Featured products have preference
        // Then sort by creation date
        orderBy = [
          { featured: 'desc' },      // Featured first
          { createdAt: 'desc' },     // Then newest
        ]
        break

      case 'newest':
      default:
        // Recently Added First
        // কي করছি: Latest products আগে show করছি
        // কেন করছি: Fresh inventory highlight করতে
        // Default option
        orderBy = { createdAt: 'desc' }
        break
    }

    // Parallel Queries - Fetch Products + Count
    // কি করছি: Products list + total count একসাথে fetch
    // কেন করছি: Pagination info জন্য count দরকার
    const [products, total] = await Promise.all([
      // Query 1: Fetch Products
      prisma.product.findMany({
        where,
        
        include: {
          // Include variants for stock checking
          // কি করছি: Product variants include করছি
          // কেন করছি: Frontend variant selector show করতে
          // কিভাবে: Only in-stock variants
          variants: {
            where: { stock: { gt: 0 } },
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              stock: true,
              color: true,
              size: true,
            },
            orderBy: { price: 'asc' },
          },
          
          // Include review stats (aggregate)
          // কি করছি: Average rating + review count
          // কেন করছি: Product cards এ stars show করতে
          // 
          // Future Enhancement (requires aggregation):
          // _avg: { rating: true }
          // _count: { reviews: true }
          // 
          // Current: Include count only
          _count: {
            select: { reviews: true },
          },
        },
        
        orderBy,
        skip,
        take: limit,
      }),
      
      // Query 2: Total Count
      prisma.product.count({ where }),
    ])

    // Success Response with Metadata
    // কি করছি: Products + pagination + filters return করছি
    // কেন করছি: Frontend comprehensive info চাই
    // 
    // Response Structure:
    // {
    //   category: { id, name },
    //   products: [...],
    //   pagination: { page, limit, total, totalPages },
    //   filters: { search, minPrice, maxPrice, inStock, sort }
    // }
    // 
    // Frontend Usage:
    // - Display products grid
    // - Show pagination controls
    // - Display active filters
    // - Show results count: "Showing 12 of 156 products"
    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
      },
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        search: search || null,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        inStock,
        sort,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch category products' },
      { status: 500 }
    )
  }
}