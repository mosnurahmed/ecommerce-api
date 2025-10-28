// prisma/seed.ts
// Seed data for e-commerce

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@shop.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  })

  // Create Customer
  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      password: hashedPassword,
      name: 'John Customer',
      role: 'CUSTOMER',
      emailVerified: true,
    },
  })

  // Create Categories
  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
    },
  })

  const clothing = await prisma.category.create({
    data: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400',
    },
  })

  // Create Products
  const laptop = await prisma.product.create({
    data: {
      name: 'MacBook Pro 16"',
      slug: 'macbook-pro-16',
      description: 'Powerful laptop for professionals',
      basePrice: 2499.00,
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
      ],
      featured: true,
      categoryId: electronics.id,
    },
  })

  const phone = await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      description: 'Latest iPhone with A17 Pro chip',
      basePrice: 999.00,
      images: [
        'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600',
      ],
      featured: true,
      categoryId: electronics.id,
    },
  })

  const tshirt = await prisma.product.create({
    data: {
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-tshirt',
      description: 'Comfortable everyday wear',
      basePrice: 19.99,
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
      ],
      categoryId: clothing.id,
    },
  })

  // Create Product Variants
  await prisma.productVariant.createMany({
    data: [
      // Laptop variants
      {
        sku: 'MBP16-512GB-SILVER',
        name: '512GB Silver',
        price: 2499.00,
        stock: 10,
        size: '512GB',
        color: 'Silver',
        productId: laptop.id,
      },
      {
        sku: 'MBP16-1TB-SPACE',
        name: '1TB Space Gray',
        price: 2999.00,
        stock: 5,
        size: '1TB',
        color: 'Space Gray',
        productId: laptop.id,
      },
      // iPhone variants
      {
        sku: 'IP15P-128GB-TITANIUM',
        name: '128GB Titanium',
        price: 999.00,
        stock: 25,
        size: '128GB',
        color: 'Titanium',
        productId: phone.id,
      },
      {
        sku: 'IP15P-256GB-TITANIUM',
        name: '256GB Titanium',
        price: 1099.00,
        stock: 20,
        size: '256GB',
        color: 'Titanium',
        productId: phone.id,
      },
      // T-shirt variants
      {
        sku: 'TSHIRT-RED-M',
        name: 'Medium Red',
        stock: 50,
        size: 'M',
        color: 'Red',
        weight: 0.2,
        productId: tshirt.id,
      },
      {
        sku: 'TSHIRT-RED-L',
        name: 'Large Red',
        stock: 30,
        size: 'L',
        color: 'Red',
        weight: 0.25,
        productId: tshirt.id,
      },
      {
        sku: 'TSHIRT-BLUE-M',
        name: 'Medium Blue',
        stock: 40,
        size: 'M',
        color: 'Blue',
        weight: 0.2,
        productId: tshirt.id,
      },
    ],
  })

  // Create Address for Customer
  await prisma.address.create({
    data: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001',
      type: 'SHIPPING',
      isDefault: true,
      userId: customer.id,
    },
  })

  console.log('✅ Seed completed!')
  console.log('\nCreated:')
  console.log('- 2 users (admin, customer)')
  console.log('- 2 categories')
  console.log('- 3 products')
  console.log('- 7 product variants')
  console.log('- 1 address')
  console.log('\nLogin credentials:')
  console.log('Admin: admin@shop.com / password123')
  console.log('Customer: customer@example.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })