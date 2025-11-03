// src/app/api/categories/route.ts
// Replace ENTIRE file with advanced version:

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET Handler - Advanced Categories with Filtering, Sorting, Pagination
// কি করছি: Categories fetch with multiple options
// কেন করছি: Different use cases need different data
// কিভাবে: Query parameters for customization
// 
// Query Parameters:
// - search: Search category names/descriptions
// - sort: Sort by (name, products, newest)
// - page: Pagination page number
// - limit: Items per page
// - includeEmpty: Show categories with 0 products?
// 
// Examples:
// GET /api/categories → All categories
// GET /api/categories?search=elect → Search "elect"
// GET /api/categories?sort=popular → Sort by product count
// GET /api/categories?includeEmpty=false → Hide empty categories
// GET /api/categories?page=2&limit=5 → Pagination
export async function GET(request: Request) {
  try {
    // Extract Query Parameters
    // কি করছি: URL থেকে filtering/sorting options পড়ছি
    // কেন করছি: Flexible API - different scenarios different needs
    const { searchParams } = new URL(request.url)
    
    // Search Parameter
    // কি করছি: Category name/description search query
    // কেন করছি: User search করতে চাইলে "electronics" type করে
    // Example: ?search=elect → Matches "Electronics"
    const search = searchParams.get('search')
    
    // Sort Parameter
    // কি করছি: Sorting strategy select করছি
    // কেন করছি: Different views need different orders
    // Options:
    //   - 'name' (default): Alphabetical A-Z
    //   - 'popular': Most products first
    //   - 'newest': Recently created first
    // Example: ?sort=popular → Electronics (500) before Books (20)
    const sort = searchParams.get('sort') || 'name'
    
    // Include Empty Parameter
    // কি করছি: Empty categories show করবো কি না
    // কেন করছি: Admin panel all দেখতে চায়, customers শুধু active
    // Default: true (show all)
    // ?includeEmpty=false → Hide categories with 0 products
    const includeEmpty = searchParams.get('includeEmpty') !== 'false'
    
    // Pagination Parameters
    // কি করছি: Page number and items per page
    // কেন করছি: 100+ categories থাকলে pagination দরকার
    // Defaults: page=1, limit=20
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build WHERE Clause - Dynamic Filtering
    // কি করছি: Prisma where conditions build করছি dynamically
    // কেন করছি: Query parameters based on filter করতে
    // Pattern: Start with empty object, conditionally add properties
    const where: any = {}

    // Conditional Filter 1: Search
    // কি করছি: যদি search query থাকে, name/description এ search করছি
    // কেন করছি: User "electronics" type করলে match করবে
    // কিভাবে: OR condition - name অথবা description এ match
    // 
    // Search Logic:
    // - Case-insensitive (Electronics = electronics = ELECTRONICS)
    // - Partial match (elect matches Electronics)
    // - Multiple fields (name OR description)
    // 
    // Example:
    // search = "elect"
    // Matches:
    //   ✅ name: "Electronics"
    //   ✅ description: "Electronic devices and gadgets"
    //   ❌ name: "Clothing"
    // 
    // Generated SQL:
    // WHERE (name ILIKE '%elect%' OR description ILIKE '%elect%')
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Conditional Filter 2: Exclude Empty Categories
    // কি করছি: যদি includeEmpty=false, empty categories filter out করছি
    // কেন করছি: Customer-facing views এ empty categories meaningless
    // কিভাবে: Nested relation filter (products count > 0)
    // 
    // Logic:
    // includeEmpty=true → Show all (no filter)
    // includeEmpty=false → Only show categories with products
    // 
    // Example:
    // Categories:
    // - Electronics: 156 products ✅ Show
    // - Clothing: 243 products ✅ Show
    // - Books: 0 products ❌ Hide (if includeEmpty=false)
    // 
    // Prisma Relation Filter:
    // products: { some: {} } means "has at least one product"
    // 
    // Generated SQL:
    // WHERE EXISTS (
    //   SELECT 1 FROM products 
    //   WHERE products.categoryId = categories.id
    // )
    if (!includeEmpty) {
      where.products = {
        some: {},  // At least one product must exist
      }
    }

    // Determine ORDER BY Clause - Dynamic Sorting
    // কি করছি: sort parameter অনুযায়ী ordering define করছি
    // কেন করছি: Different views different sorting needs
    // কিভাবে: Switch case pattern
    // 
    // Sort Options Explained:
    let orderBy: any = { name: 'asc' }  // Default: Alphabetical

    switch (sort) {
      case 'popular':
        // Sort by Product Count (Most → Least)
        // কি করছি: যে category তে বেশি products সেটা আগে
        // কেন করছি: Popular categories highlight করতে
        // কিভাবে: Aggregate count descending order
        // 
        // Challenge: Can't directly order by _count in Prisma
        // Solution: Fetch all, sort in memory (acceptable for categories)
        // 
        // Alternative (Raw SQL):
        // ORDER BY (SELECT COUNT(*) FROM products WHERE categoryId = categories.id) DESC
        // 
        // Example Order:
        // 1. Electronics (500 products)
        // 2. Clothing (243 products)
        // 3. Books (89 products)
        // 
        // Note: We'll handle this sorting after query
        orderBy = { name: 'asc' }  // Fetch alphabetically, sort later
        break

      case 'newest':
        // Sort by Creation Date (Newest → Oldest)
        // কি করছি: Recently added categories আগে
        // কেন করছি: Admin panel এ new categories track করতে
        // কিভাবে: ORDER BY createdAt DESC
        // 
        // Example Order:
        // 1. Gaming (created today)
        // 2. Toys (created yesterday)
        // 3. Electronics (created last month)
        orderBy = { createdAt: 'desc' }
        break

      case 'name':
      default:
        // Sort Alphabetically (A → Z)
        // কি করছি: Category names alphabetically sort
        // কেন করছি: User-friendly, predictable
        // Default option (most common)
        // 
        // Example Order:
        // 1. Books
        // 2. Clothing
        // 3. Electronics
        orderBy = { name: 'asc' }
        break
    }

    // Parallel Queries - Fetch Data + Count
    // কি করছি: একসাথে দুইটা query execute করছি
    // কেন করছি: Performance optimization (parallel > sequential)
    // কিভাবে: Promise.all() concurrent execution
    // 
    // Query 1: Fetch categories with pagination
    // Query 2: Count total matching categories
    // 
    // Why parallel:
    // Sequential: 100ms + 50ms = 150ms total
    // Parallel: max(100ms, 50ms) = 100ms total ⚡
    const [categories, total] = await Promise.all([
      // Query 1: Fetch Categories
      prisma.category.findMany({
        where,
        
        // Include Related Data
        include: {
          // Product Count Aggregation
          // কি করছি: প্রতিটা category তে কতগুলো products count
          // কেন করছি: Show "Electronics (156 products)"
          // কিভাবে: _count special relation
          _count: {
            select: { 
              products: true  // COUNT(products)
            },
          },
          
          // Featured Products Preview (Optional Enhancement)
          // কি করছি: Category এর কিছু products preview fetch করছি
          // কেন করছি: Category cards এ product thumbnails show করতে
          // কিভাবে: Limit to 3 featured products
          // 
          // Use Case:
          // Category Card:
          // [Electronics]
          // 156 products
          // [img] [img] [img] ← Preview images
          // 
          // Performance Note:
          // - Only 3 products per category (lightweight)
          // - Only fetch essential fields (id, name, images)
          // - Featured products prioritized
          products: {
            where: {
              isActive: true,
              featured: true,  // Only featured products
            },
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              basePrice: true,
            },
            take: 3,  // Maximum 3 preview products
            orderBy: { createdAt: 'desc' },
          },
        },
        
        orderBy,
        skip,
        take: limit,
      }),
      
      // Query 2: Total Count
      // কি করছি: Total কতগুলো categories match করে
      // কেন করছি: Pagination calculation (total pages)
      // কিভাবে: Same where condition, just count
      prisma.category.count({ where }),
    ])

    // Post-Query Sorting for 'popular'
    // কি করছি: যদি sort=popular, এখন product count দিয়ে sort করছি
    // কেন করছি: Prisma directly order by aggregate করতে পারে না
    // কিভাবে: JavaScript array.sort()
    // 
    // Why here not in query:
    // - Prisma limitation: Can't ORDER BY _count directly
    // - Solution: Fetch data, sort in memory
    // - Acceptable: Categories are limited (not 1000s)
    // 
    // Sort Logic:
    // Compare two categories by product count
    // b._count.products - a._count.products → Descending
    // Higher count first
    if (sort === 'popular') {
      categories.sort((a, b) => b._count.products - a._count.products)
    }

    // Success Response - Enhanced Structure
    // কি করছি: Categories + metadata return করছি
    // কেন করছি: Frontend needs pagination info, filtering status
    // কিভাবে: Structured JSON response
    // 
    // Response Structure:
    // {
    //   categories: [...],           // Category array
    //   pagination: {                // Pagination metadata
    //     page: 1,
    //     limit: 20,
    //     total: 45,
    //     totalPages: 3
    //   },
    //   filters: {                   // Applied filters info
    //     search: "elect",
    //     sort: "popular",
    //     includeEmpty: false
    //   }
    // }
    // 
    // Frontend Usage:
    // - Display categories
    // - Show "Page 1 of 3"
    // - Show active filters
    // - Enable/disable "Next" button
    return NextResponse.json({
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        search: search || null,
        sort,
        includeEmpty,
      },
    })
  } catch (error) {
    // Error Handling
    // কি করছি: Gracefully handle any errors
    // কেন করছি: Prevent server crash, user-friendly response
    // 
    // Production Enhancement:
    // console.error('Categories API error:', error)
    // logger.error({ error, endpoint: '/api/categories' })
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}