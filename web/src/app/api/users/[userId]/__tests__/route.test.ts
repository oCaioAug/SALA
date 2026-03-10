/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET, PATCH } from '../route'
import { prismaMock } from '../../../../../../prisma/mock'
import { verifyAuth } from '@/lib/auth-hybrid'

jest.mock('@/lib/auth-hybrid', () => ({
  verifyAuth: jest.fn()
}))

describe('Users [userId] API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyAuth as jest.Mock).mockResolvedValue({ 
      success: true, 
      user: { id: 'admin-1', role: 'ADMIN' } 
    })
  })

  describe('GET /api/users/[userId]', () => {
    it('should return 401 if unauthorized', async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValue({ success: false, error: 'Não autorizado', status: 401 })
      const req = new NextRequest('http://localhost:3000/api/users/user-1')
      const response = await GET(req, { params: Promise.resolve({ userId: 'user-1' }) })
      expect(response.status).toBe(401)
    })

    it('should return 404 if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)
      const req = new NextRequest('http://localhost:3000/api/users/inv')
      const response = await GET(req, { params: Promise.resolve({ userId: 'inv' }) })
      expect(response.status).toBe(404)
    })

    it('should return 403 if user lacks permissions', async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValue({ 
        success: true, 
        user: { id: 'user-2', role: 'USER' } // Not admin and not the same user
      })
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' } as any)
      
      const req = new NextRequest('http://localhost:3000/api/users/user-1')
      const response = await GET(req, { params: Promise.resolve({ userId: 'user-1' }) })
      expect(response.status).toBe(403)
    })

    it('should allow user to view their own profile', async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValue({ 
        success: true, 
        user: { id: 'user-1', role: 'USER' } 
      })
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Own User' } as any)
      
      const req = new NextRequest('http://localhost:3000/api/users/user-1')
      const response = await GET(req, { params: Promise.resolve({ userId: 'user-1' }) })
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.name).toBe('Own User')
    })

    it('should allow admin to view any profile', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Other User' } as any)
      
      const req = new NextRequest('http://localhost:3000/api/users/user-1')
      const response = await GET(req, { params: Promise.resolve({ userId: 'user-1' }) })
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.name).toBe('Other User')
    })
  })

  describe('PATCH /api/users/[userId]', () => {
    it('should require at least one field to update', async () => {
      const req = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({})
      })
      const response = await PATCH(req, { params: Promise.resolve({ userId: 'user-1' }) })
      expect(response.status).toBe(400)
    })

    it('should validate email format', async () => {
      const req = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ email: 'bad-email' })
      })
      const response = await PATCH(req, { params: Promise.resolve({ userId: 'user-1' }) })
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Email inválido')
    })

    it('should check if user to update exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)
      const req = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New Name' })
      })
      const response = await PATCH(req, { params: Promise.resolve({ userId: 'user-1' }) })
      expect(response.status).toBe(404)
    })

    it('should return 403 if user lacks edit permissions', async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValue({ 
        success: true, 
        user: { id: 'user-2', role: 'USER' } // Not admin and not the same user
      })
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' } as any)
      
      const req = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Hacker' })
      })
      const response = await PATCH(req, { params: Promise.resolve({ userId: 'user-1' }) })
      expect(response.status).toBe(403)
    })

    it('should prevent using an already taken email', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1', email: 'old@test.com' } as any) // first call returns current user
        .mockResolvedValueOnce({ id: 'other', email: 'taken@test.com' } as any) // second call returns if email exists
      
      const req = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ email: 'taken@test.com' })
      })
      const response = await PATCH(req, { params: Promise.resolve({ userId: 'user-1' }) })
      expect(response.status).toBe(400)
    })

    it('should update user successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'user-1', email: 'old@test.com' } as any)
      prismaMock.user.update.mockResolvedValue({ id: 'user-1', email: 'old@test.com', name: 'New Name' } as any)
      
      const req = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New Name' })
      })
      const response = await PATCH(req, { params: Promise.resolve({ userId: 'user-1' }) })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.name).toBe('New Name')
    })
  })
})
