// src/app/api/auth/[...nextauth]/route.ts
// Replace ENTIRE file:

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }