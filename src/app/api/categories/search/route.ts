// src/app/api/categories/search/route.ts
// কি: Autocomplete search for categories
// কেন: Search box এ type করতেই suggestions show করতে
// HTTP Method: GET

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET Handler - Category Search with Autocomplete
// কি করছি: Fast category search for autocomplete/suggestions
// কেন করছি: User search box এ type করলে instant suggestions
// কিভাবে: Optimized query with minimal data
// 
// Query Parameters:
// - q: Search query (required)
// - limit: Max results (default: 5)
// 
// Examples:
// /api/categories/search?q=elec → ["Electronics", "Electronic Accessories"]
// /api/categories/search?q=cloth → ["Clothing", "Clothes & Fashion"]
// /api/categories/search?q=book&limit=3 → Max 3 results
// 
// Use Case:
// User types "ele" in search box
// → Instant API call: /api/categories/search?q=ele
// → Shows dropdown: "Electronics", "Electronic Accessories"
// → User clicks → Navigate to category
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Search Query (Required)
    // কি করছি: User এর search input পড়ছি
    // কেন করছি: এই text based on search করবো
    // Validation: Must be at least 1 character
    const query = searchParams.get('q')
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Limit Parameter
    // কি করছি: Maximum কতগুলো results return করবো
    // কেন করছি: Autocomplete dropdown small হওয়া উচিত
    // Default: 5 (optimal for dropdown)
    // Max: 10 (prevent overwhelming user)
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '5'),
      10  // Hard limit: maximum 10 results
    )

    // Optimized Search Query
    // কি করছি: Categories search করছি minimal data সহ
    // কেন করছি: Fast response for autocomplete (< 100ms)
    // কিভাবে: Limited fields, simple condition, indexed search
    // 
    // Performance Optimizations:
    // 1. select: Only essential fields (not all columns)
    // 2. where: Indexed field (name has index)
    // 3. take: Limit results (small dataset)
    // 4. No joins: No include relations
    // 
    // Why fast matters:
    // - Autocomplete needs instant response
    // - User types quickly, multiple requests
    // - Slow = laggy UI = bad UX
    // - Target: < 100ms response time
    const categories = await prisma.category.findMany({
      where: {
        // Search in name OR description
        // কি করছি: Category name বা description এ match করছি
        // কেন করছি: More matches = better suggestions
        // কিভাবে: OR condition with case-insensitive search
        // 
        // Example:
        // query = "tech"
        // Matches:
        //   ✅ name: "Technology"
        //   ✅ name: "Tech Gadgets"
        //   ✅ description: "Latest tech devices"
        //   ❌ name: "Books"
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      
      // Select Minimal Fields
      // কি করছি: শুধু dropdown জন্য দরকারি fields
      // কেন করছি: Smaller response = faster transfer
      // 
      // Required fields:
      // - id: For tracking
      // - name: Display in dropdown
      // - slug: For navigation link
      // - _count: Show product count "(156 products)"
      // 
      // Excluded fields (not needed):
      // - description (too long for dropdown)
      // - image (no images in autocomplete)
      // - createdAt/updatedAt (irrelevant)
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { products: true },
        },
      },
      
      // Order by Relevance (Simplified)
      // কি করছি: Name alphabetically sort করছি
      // কেন করছি: Predictable order
      // 
      // Future Enhancement:
      // - Exact match first (query === name)
      // - Then partial matches
      // - Then description matches
      // - Finally by popularity (product count)
      // 
      // Current: Simple alphabetical
      orderBy: { name: 'asc' },
      
      // Limit Results
      // কি করছি: Maximum N results return করছি
      // কেন করছি: Dropdown shouldn't be too long
      take: limit,
    })

    // Enhanced Response for Autocomplete
    // কি করছি: Search results structured format এ return করছি
    // কেন করছি: Frontend easily render করতে পারবে
    // 
    // Response Structure:
    // {
    //   query: "elec",
    //   results: [
    //     {
    //       id: "cat_electronics",
    //       name: "Electronics",
    //       slug: "electronics",
    //       productCount: 156,
    //       url: "/categories/electronics"
    //     },
    //     {
    //       id: "cat_electronic_accessories",
    //       name: "Electronic Accessories",
    //       slug: "electronic-accessories",
    //       productCount: 89,
    //       url: "/categories/electronic-accessories"
    //     }
    //   ],
    //   total: 2
    // }
    // 
    // Frontend Autocomplete Usage:
    // <input
    //   onChange={async (e) => {
    //     const res = await fetch(`/api/categories/search?q=${e.target.value}`)
    //     const data = await res.json()
    //     setResults(data.results)
    //   }}
    // />
    // 
    // <Dropdown>
    //   {results.map(category => (
    //     <Link href={category.url}>
    //       {category.name} ({category.productCount})
    //     </Link>
    //   ))}
    // </Dropdown>
    return NextResponse.json({
      query,
      results: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        productCount: cat._count.products,
        url: `/categories/${cat.slug}`,  // Ready-to-use URL
      })),
      total: categories.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search categories' },
      { status: 500 }
    )
  }
}