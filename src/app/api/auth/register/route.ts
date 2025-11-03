import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {z} from "zod";



const registerSchema = z.object({
email:z.string().email("Invalid email address"),
password: z.string().min(6, 'Password must be at least 6 characters'),
name: z.string().min(2, 'Name must be at least 2 characters'),
})

export async function POST(request:Request){
    try{
        const body = await request.json();
         const validated = registerSchema.parse(body)
        
        const existingUser = await prisma.user.findUnique({
        where: { email: validated.email },
        })
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 400 }
            )
        }
         const hashedPassword = await bcrypt.hash(validated.password, 10)
         const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,  // Store hashed, never plain
        name: validated.name,
        role: 'CUSTOMER',
      },

      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })
    

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user 
      },
      { status: 201 }
    )
    }
    catch(error){

        if (error instanceof z.ZodError) {
             return NextResponse.json(
            { error: error.errors[0].message },  // First validation error
            { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
      )
    }
}