import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "./prisma"
import type { User } from "@prisma/client"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const JWT_EXPIRES_IN = "7d"

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function createSession(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) throw new Error("User not found")

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  return token
}

export async function validateSession(token: string): Promise<User | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || !session.isActive || session.expiresAt < new Date()) {
    return null
  }

  return session.user
}

export async function invalidateSession(token: string): Promise<void> {
  await prisma.session.updateMany({
    where: { token },
    data: { isActive: false },
  })
}

export async function getUserWithPermissions(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  })
}
