/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { prismaMock } from '../../../../../prisma/mock'

describe('Items API (List and Create)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('GET /api/items', () => {
    it('should return a list of items and use cache on subsequent calls', async () => {
      const mockItems = [{ id: 'item-1', name: 'Projetor' }]
      prismaMock.item.findMany.mockResolvedValue(mockItems as any)

      // First call (hits DB)
      const req1 = new NextRequest('http://localhost:3000/api/items')
      const response1 = await GET()
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(data1).toEqual(mockItems)
      expect(prismaMock.item.findMany).toHaveBeenCalledTimes(1)

      // Second call (should hit cache)
      const response2 = await GET()
      expect(prismaMock.item.findMany).toHaveBeenCalledTimes(1) // Still 1

      // Advance time beyond cache duration (2 mins)
      jest.advanceTimersByTime(3 * 60 * 1000)

      // Third call (should hit DB again)
      const response3 = await GET()
      expect(prismaMock.item.findMany).toHaveBeenCalledTimes(2)
    })
  })

  describe('POST /api/items', () => {
    it('should validate required fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/items', {
        method: 'POST',
        body: JSON.stringify({ description: 'Sem nome' }) // Missing name
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Nome do item é obrigatório')
    })

    it('should create a new item and invalidate cache', async () => {
      const mockItem = { id: 'new-item', name: 'Novo Projetor' }
      prismaMock.item.create.mockResolvedValue(mockItem as any)

      const req = new NextRequest('http://localhost:3000/api/items', {
        method: 'POST',
        body: JSON.stringify({ name: 'Novo Projetor', quantity: '2' })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('new-item')
      expect(prismaMock.item.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Novo Projetor', quantity: 2 })
        })
      )
    })
  })
})
